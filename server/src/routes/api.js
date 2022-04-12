const express = require("express");

const planets_router = require("./planets/planets.router");
const launches_router = require("./launches/launches.router");

const api = express.Router();

api.use("/planets", planets_router);
api.use("/launches", launches_router);

module.exports = api;
