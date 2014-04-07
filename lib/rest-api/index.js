"use strict";

var swagger     = require("swagger-node-express"),
    express     = require("express"),
    async       = require("async"),
    path        = require("path"),
    fs          = require("fs"),
    api         = express();

exports.init = function (app, callback) {
    app.use("/api", api);

    swagger.setAppHandler(api);
    swagger.configureSwaggerPaths("", "/api-docs", "");

    swagger.setHeaders = function setHeaders(res) {
        res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
        res.header("Content-Type", "application/json; charset=utf-8");
    };

    fs.readdir(__dirname, function (err, files) {
        async.each(files, function (file, done) {
            var err = null;
            try {
                if (file.indexOf("index") !== 0) {
                    require("./" + file).init(swagger);
                }
            } catch (er) {
                err = er;
            }
            done(err);
        }, function (err) {
            swagger.configure(app.get("rootUrl") + "/api", "0.1");
            api.use("/docs", express.static(path.resolve(__dirname, "..", "..", "public", "swagger")));
            callback(err);
        });
    });
};
