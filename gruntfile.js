/* jshint node:true */
function config(name) {
    return require("./grunt_tasks/" + name + ".js");
}

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jshint: config("jshint"),
        qunit: config("qunit"),
        watch: {
            files: ["client/*.js", "test/unit/*"],
            tasks: ["jshint", "qunit"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.registerTask("dist",
        ["jshint", "qunit"]);

    grunt.registerTask("default", ["qunit", "watch"]);
};