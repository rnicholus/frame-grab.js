/* jshint node:true */
/* globals module */
module.exports = {
    minify: {
        files: {
            "_dist/frame-grab.min.js": ["client/frame-grab.js"]
        },
        options: {
            "banner": "/* frame-grab.js - Copyright (C) 2014  Raymond S. Nicholus, III */",
            "compilation_level": "SIMPLE_OPTIMIZATIONS"
        }
    }
};