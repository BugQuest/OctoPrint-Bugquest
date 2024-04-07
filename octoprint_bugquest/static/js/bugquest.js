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

        // self.light_stat = ko.observable();

        // self.light_stat(false)


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
                console.log("update color: " + newColor)
                // OctoPrint.simpleApiCommand('gpiorgbcontroller', 'update_color', {'color': newColor})
            }
        }

        self.saveColor = function(picker, event) {
            var newColor = event.currentTarget.jscolor.toHEXString()
            if(newColor) {
                self.color(newColor)
                console.log("save color: " + newColor)
                OctoPrint.simpleApiCommand('bugquest', 'update_color', {'color': newColor})
                OctoPrint.settings.savePluginSettings('bugquest', {'color': newColor})
            }
        }

        // self.onBeforeBinding = function () {
        //     document.querySelector('#color-picker-control').jscolor.fromString(self.color())
        // }

        self.onClickLight = function() {
            // $.ajax({
            //     type: "GET",
            //     url: self.buildPluginUrl("/toogleLight"),
            //     dataType: "json",
            //     success: function (data) {
            //         self.light_stat(data.light)
            //     }
            // })
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
                //document.querySelector('#color-picker-control').jscolor.fromString(self.color())
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
