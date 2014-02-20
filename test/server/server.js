/* jshint node:true */
var express = require("express"),
    app = express();

app.use("/test", express.static("./test/"));
app.use("/client", express.static("./client/"));

app.listen(9001);
console.log("Express server started on port %s", 9001);