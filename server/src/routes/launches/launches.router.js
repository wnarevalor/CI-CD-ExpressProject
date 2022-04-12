const express = require("express");

const launches_router = express.Router();
const {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpAbortLaunch,
} = require("./launches.controller");

launches_router.get("/", httpGetAllLaunches);
launches_router.post("/", httpAddNewLaunch);
launches_router.delete("/:id", httpAbortLaunch);

module.exports = launches_router;
