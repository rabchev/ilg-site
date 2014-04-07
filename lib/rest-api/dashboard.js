"use strict";

// Data Transfer Objects
var dtos = {
    Sample: {
        id: "Sample",
        description: "This is a sample DTO.",
        required: ["name"],
        properties: {
            name: {
                type: "string",
                description: "The name of the sample DTO."
            }
        }
    }
};

exports.init = function (swagger) {
    var methods = {
        getSample: {
            spec: {
                description: "Sample Operations",
                path: "/sample/{key}",
                parameters : [
                    swagger.pathParam("key", "The ID of the sample to get.", "string")
                ],
                notes: "Registers an application for routing and returns the connection string for the app.",
                summary: "Register an application for connection routing.",
                method: "GET",
                type: "Sample",
                nickname: "getSample"
            },
            action: function (req, resp) {
                    resp.json({ name: req.params.key });
            }
        }
    };

    swagger.addModels(dtos);

    swagger.addGet(methods.getSample);
};
