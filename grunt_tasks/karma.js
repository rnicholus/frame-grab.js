/* jshint node:true */
/* globals module */
module.exports = {
    options: {
        autoWatch : false,

        basePath : ".",

        files : [
            "client/lib/*",
            "client/**/*",
            "test/unit/tests.js"
        ],

        frameworks: ["jasmine"],

        singleRun: true,

        plugins : [
            "karma-chrome-launcher",
            "karma-firefox-launcher",
            "karma-jasmine"
        ]
    },
    dev: {
        browsers: ["Firefox"]
    },
    travis: {
        browsers: ["Firefox"]
    }
};