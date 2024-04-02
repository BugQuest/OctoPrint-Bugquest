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

        self.light_stat = ko.observable();

        self.light_stat(false)


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

        self.onClickLight = function() {
            $.ajax({
                type: "GET",
                url: self.buildPluginUrl("/toogleLight"),
                dataType: "json",
                success: function (data) {
                    self.light_stat(data.light)
                }
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
        }
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: BugquestViewModel,
        dependencies: [  ],
        // Elements to bind to, e.g. #settings_plugin_bugquest, #tab_plugin_bugquest, ...
        elements: [ '#navbar_plugin_bugquest' ]
    });
});
