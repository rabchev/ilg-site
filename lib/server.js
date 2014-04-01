"use strict";

var express         = require("express"),
    bodyParser      = require("body-parser"),
    cookieParser    = require("cookie-parser"),
    methodOverride  = require("method-override"),
    serveStatic     = require("serve-static"),
    favicon         = require("static-favicon"),
    exphbs          = require("express3-handlebars"),
    path            = require("path"),
    url             = require("url"),
    async           = require("async"),
    entree          = require("entree"),
    auth            = require("./auth"),
    pckg            = require("../package.json"),
    routes          = require("../routes"),
    ignorePaths     = new RegExp("^/public/|/content/", "i"),
    conf,
    session,
    srv,
    hbs,
    entreeOpts;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

hbs = exphbs.create({
    defaultLayout: "main",
    extname: ".html",
    helpers: {
        version: function () {
            return pckg.version;
        }
    }
});

function sessionHandler(req, res, next) {
    if (ignorePaths.test(req.url)) {
        return next();
    }
    session(req, res, next);
}

function getMongoUrl(obj) {
    obj.hostname = (obj.hostname || "localhost");
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || "test");
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
    else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}

function init(port, callback) {
    if (typeof port === "function") {
        callback = port;
        port = null;
    }

    conf = {
        url: {
            protocol: "http",
            port: port || process.env.VCAP_APP_PORT || 8095,
            hostname: process.env.VCAP_APP_HOST || "localhost"
        }
    };

    if(process.env.VCAP_SERVICES){
        var env = JSON.parse(process.env.VCAP_SERVICES),
            mongo = env["mongodb2-2.4.8"][0].credentials;

        entreeOpts = {
            "connections": {
                "mongodb": {
                    "provider": "mongodb",
                    "options": {
                        "connStr": getMongoUrl(mongo)
                    }
                }
            }
        };
    }

    async.series(
        [
            function (done) {
                entree.configure(entreeOpts, done);
                entreeOpts = null;
            },
            function (done) {
                auth.init(done);
            }
        ], function (err) {
            var app = express();
            app.set("rootUrl", url.format(conf.url));
            app.set("views", path.resolve("views"));
            app.engine("html", hbs.engine);
            app.set("view engine", "html");

            app.use(favicon())
                .use(bodyParser())
                .use(methodOverride())
                .use(cookieParser("JT187YEM54S35YO3"))
                .use("/res", serveStatic(path.resolve("public")));

            app.get("/", routes.index);

            if (err) {
                return callback(err);
            }
            callback(null, app);
        }
    );
}

function start(port, callback) {
    if (exports.app) {
        return callback(srv, conf.url);
    }

    if (typeof port === "function") {
        callback = port;
        port = null;
    }

    init(port, function (err, app) {
        if (err) {
            throw err;
        }

        exports.app = app;
        srv = exports.app.listen(conf.url.port, function () {
            if (callback) {
                callback(srv, conf.url);
            }
            console.log("Listening on ", url.format(conf.url));
        });
    });
}

function stop(callback) {
    srv.close(callback);
    console.log("Stopping on ", url.format(conf.url));
    exports.app = null;
    srv = null;
}

exports.init = init;
exports.start = start;
exports.stop = stop;
