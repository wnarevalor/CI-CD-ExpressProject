const express = require("express");

const planets_router = express.Router();
const { httpGetAllPlanets } = require("./planets.controller");

planets_router.get("/", httpGetAllPlanets);

module.exports = planets_router;
