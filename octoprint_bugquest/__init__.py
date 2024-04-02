# coding=utf-8
from __future__ import absolute_import

import octoprint.plugin
from octoprint.util import RepeatedTimer
from board import D23, SCL, SDA
from busio import I2C
from adafruit_dht import DHT22 
from flask import jsonify, request
import RPi.GPIO as gpio
from adafruit_ssd1306 import SSD1306_I2C

import subprocess

from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont

class BugquestPlugin(
    octoprint.plugin.StartupPlugin,
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.TemplatePlugin,
    octoprint.plugin.BlueprintPlugin
):

    def __init__(self):
        self._checkTimer = None
        self._notifyClientTimer = None
        self._oledTimer = None
        self.light_stat = False
        self.tempSensor = DHT22(D23)
        self.temperature = -1
        self.humidity = -1
        gpio.setmode(gpio.BCM)
        gpio.setup(20, gpio.OUT, initial=gpio.HIGH)#light
        gpio.setup(21, gpio.OUT, initial=gpio.HIGH)#fan
        self.init_oled()

    def init_oled(self):
        self.i2c = I2C(SCL, SDA)
        self.oled = SSD1306_I2C(128, 32, self.i2c, addr=0x3C)
        self.oled_padding = -2
        self.oled_top = self.oled_padding
        self.oled_bottom = self.oled.height - self.oled_padding
        self.oled_x = 0
        self.oled_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 9)
        self.oled.fill(0)
        self.image = Image.new("1", (self.oled.width, self.oled.height))
        self.draw = ImageDraw.Draw(self.image)
        self.oled.image(self.image)
        self.oled.show()

    def on_after_startup(self):
        self._logger.debug("Bugquest Plugin started!")

        self._logger.debug("Let's start RepeatedTimer!")
        self.start_check_timer(3.0)
        self.start_notify_client_timer(5.0)
        self.start_oled_timer(1)


    def start_check_timer(self, interval):
        self._checkTimer = RepeatedTimer(
            interval, self.update_temp, run_first=True
        )
        self._checkTimer.start()

    def start_notify_client_timer(self, interval):
        self._notifyClientTimer = RepeatedTimer(
            interval, self.update_client, run_first=True
        )
        self._notifyClientTimer.start()

    def start_oled_timer(self, interval):
        self._oledTimer = RepeatedTimer(
            interval, self.update_oled, run_first=True
        )
        self._oledTimer.start()

    def update_temp(self):
        try:
            self.temperature = float(self.tempSensor.temperature)
            self.humidity = float(self.tempSensor.humidity)
            self._logger.debug(f"Temperature: {self.temperature}°C, Humidity: {self.humidity}%")
            if self.temperature > 30:
                gpio.output(21, gpio.LOW)
            else:
                gpio.output(21, gpio.HIGH)

        except Exception as e:
            self.temperature = -1
            self.humidity = -1
            self._logger.debug(f"Error reading temperature: {e}")

    def update_client(self):
        if self.temperature > -1 and self.humidity > -1:
            self._plugin_manager.send_plugin_message(
                self._identifier, dict(temp=self.temperature, humidity=self.humidity)
            )

    def update_oled(self):
        
        # Draw a black filled box to clear the image.
        self.draw.rectangle((0,0,self.oled.width, self.oled.height), outline=0, fill=0)
        IP = subprocess.check_output("hostname -I | cut -d\' \' -f1", shell = True )
        IP = IP.decode()
        IP = IP.replace('\n', '')
        HOSTNAME = subprocess.check_output("hostname", shell = True )
        HOSTNAME = HOSTNAME.decode()
        HOSTNAME = HOSTNAME.replace('\n', '')
        self.draw.text((self.oled_x, self.oled_top), str(IP) + " - " + str(HOSTNAME),  font=self.oled_font, fill=255)

        CPU_TEMP = subprocess.check_output("vcgencmd measure_temp | cut -d '=' -f 2", shell = True )
        CPU_TEMP = CPU_TEMP.decode()
        CPU_TEMP = CPU_TEMP.replace('\n', '')
        self.draw.text((self.oled_x, self.oled_top+8), "CPU: " + str(CPU_TEMP),  font=self.oled_font, fill=255)
        if self.temperature > -1:
            self.draw.text((self.oled_x, self.oled_top+16), "Temp: " + str(self.temperature) + "°C",  font=self.oled_font, fill=255)
        if self.humidity > -1:
            self.draw.text((self.oled_x, self.oled_top+24), "Humidity: " + str(self.humidity) + "%",  font=self.oled_font, fill=255)
        self.oled.image(self.image)
        self.oled.show()

    def get_assets(self):
        return {
            "js": ["js/bugquest.js"],
            "css": ["css/bugquest.css"]
        }

    @octoprint.plugin.BlueprintPlugin.route("/toogleLight", methods=["GET"])
    def toogle_light(self):
        self.light_stat = not self.light_stat
        self._logger.debug("Light is: "+str(self.light_stat))
        gpio.output(20, gpio.LOW if self.light_stat else gpio.HIGH)
        return {"status": "ok", "light": self.light_stat}
    


__plugin_name__ = "Bugquest Plugin"
__plugin_pythoncompat__ = ">=3,<4"  # Only Python 3

def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = BugquestPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {}
