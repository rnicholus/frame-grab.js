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

        plugins : [
            "karma-chrome-launcher",
            "karma-coverage",
            "karma-coveralls",
            "karma-firefox-launcher",
            "karma-jasmine"
        ],

        preprocessors: {
            "client/frame-grab.js": "coverage"
        },

        reporters : [
            "dots",
            "coverage",
            "coveralls"
        ],

        coverageReporter: {
            type: "lcov", // lcov or lcovonly are required for generating lcov.info files
            dir: "coverage/"
        },

        singleRun: true

    },
    dev: {
        browsers: ["Firefox"]
    },
    travis: {
        browsers: ["Firefox"]
    }
};