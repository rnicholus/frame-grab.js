/* jshint node:true */
function config(name) {
    return require("./grunt_tasks/" + name + ".js");
}

module.exports = function(grunt) {
    grunt.initConfig({
        connect: config("connect"),
        pkg: grunt.file.readJSON("package.json"),
        jshint: config("jshint"),
        karma: config("karma"),
        watch: {
            files: ["client/*.js", "test/unit/*"],
            tasks: ["jshint", "karma:dev"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-karma");

    grunt.registerTask("default", ["jshint", "connect", "karma:dev", "watch"]);
    grunt.registerTask("travis", ["jshint", "connect", "karma:travis"]);
};