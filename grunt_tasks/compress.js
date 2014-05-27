/* jshint node:true */
/* globals module */
module.exports = {
    main: {
        options: {
            archive: "_dist/release.zip"
        },
        files: [
            {expand: true, cwd: "client/", src: ["frame-grab.js"], filter: "isFile"},
            {expand: true, cwd:"client/lib/", src: ["rsvp.js"], filter: "isFile"},
            {expand: true, cwd: "_dist/", src: ["frame-grab.min.js"], filter: "isFile"}
        ]
    }
};