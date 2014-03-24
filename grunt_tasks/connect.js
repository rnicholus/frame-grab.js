/* jshint node:true */
/* globals module */

var corsMiddleware = function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
};

module.exports = {
    server: {
        options: {
            port: 3000,
            base: "test/resources",
            middleware: function(connect, options, middlewares) {
                return [
                    corsMiddleware,
                    connect.static(options.base[0])
                ];
            }
        }
    }
};