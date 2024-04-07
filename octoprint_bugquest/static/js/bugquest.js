/*
 * View model for OctoPrint-Bugquest
 *
 * Author: Realitynauts
 * License: AGPLv3
 */
$(function() {
    function BugquestViewModel(parameters) {
        var self = this;

        self.temperature = ko.observable();
        self.humidity = ko.observable();

        self.color = ko.observable()

        self.light_stat = ko.observable();
        self.fan_stat = ko.observable();

        self.light_stat(false)
        self.fan_stat(false)

        self.onAllBound = function () {
            // Check for themify - sadly the themeify plugin always sets the "themeify" class on html even though themes are not active so we cant use that as not selector in the css - so we use js :(
            if (
                OctoPrint.coreui.viewmodels.settingsViewModel.settings.plugins.hasOwnProperty(
                    "themeify"
                )
            ) {
                OctoPrint.coreui.viewmodels.settingsViewModel.settings.plugins.themeify.enabled.subscribe(
                    function (enabled) {
                        if (enabled) {
                            $("#navbar_plugin_bugquest").removeClass("ThemeifyOff");
                        } else {
                            $("#navbar_plugin_bugquest").addClass("ThemeifyOff");
                        }
                    }
                );
                if (
                    !OctoPrint.coreui.viewmodels.settingsViewModel.settings.plugins.themeify.enabled()
                ) {
                    $("#navbar_plugin_bugquest").addClass("ThemeifyOff");
                }
            } else {
                $("#navbar_plugin_bugquest").addClass("ThemeifyOff");
            }
        }

        self.buildPluginUrl = function (path) {
            return window.PLUGIN_BASEURL + "bugquest" + path;
        };

        self.updateColor = function(picker, event) {
            let newColor = event.currentTarget.jscolor.toHEXString()
            if(newColor) {
                self.color(newColor)
            }
        }

        self.saveColor = function(picker, event) {
            var newColor = event.currentTarget.jscolor.toHEXString()
            if(newColor) {
                self.color(newColor)
                OctoPrint.simpleApiCommand('bugquest', 'update_color', {'color': newColor})
                OctoPrint.settings.savePluginSettings('bugquest', {'color': newColor})
            }
        }

        // self.onBeforeBinding = function () {
        //     document.querySelector('#color-picker-control').jscolor.fromString(self.color())
        // }

        self.onClickLight = function() {
            OctoPrint.simpleApiCommand('bugquest', 'toggle_light')
            .done(function(response) {
                self.light_stat(response.light)
                OctoPrint.settings.savePluginSettings('bugquest', {'light': response.light})
            })
        }

        self.onClickFan = function() {
            OctoPrint.simpleApiCommand('bugquest', 'toggle_fan')
            .done(function(response) {
                self.fan_stat(response.fan)
            })
        }

        self.onDataUpdaterPluginMessage = function (plugin, data) {
            if (plugin != "bugquest") {
                return;
            }

            if(data.temp){
               self.temperature(data.temp + "°C")
            }
            if(data.humidity){
                self.humidity(data.humidity + "%")
            }
            if(data.color) {
                self.color(data.color)
                document.querySelector('#color-picker-control').jscolor.fromString(self.color())
            }
        }
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: BugquestViewModel,
        dependencies: [  ],
        // Elements to bind to, e.g. #settings_plugin_bugquest, #tab_plugin_bugquest, ...
        elements: [ '#navbar_plugin_bugquest' ]
    });
});
