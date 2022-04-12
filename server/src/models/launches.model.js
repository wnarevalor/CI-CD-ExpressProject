const launches = require("./launches.mongo");
const axios = require("axios");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 0;
const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function saveLaunch(launch) {
  //no setoninsert
  await launches.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );
}

async function populateLaunches() {
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed");
  }

  const launch_docs = response.data.docs;
  const parsed_launches = launch_docs.map((doc) => {
    return {
      flightNumber: doc.flight_number,
      mission: doc.name,
      rocket: doc.rocket.name,
      launchDate: doc.date_local,
      upcoming: doc.upcoming,
      success: doc.success,
      customers: doc.payloads.flatMap((payload) => payload.customers),
    };
  });
  parsed_launches.forEach(async (launch) => await saveLaunch(launch));
}

async function loadLaunchesData() {
  const first_launch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (first_launch) {
    console.log("Launch data was already loaded");
  } else {
    await populateLaunches();
    console.log("downloading data from space x api");
  }
}

async function findLaunch(filter) {
  return await launches.findOne(filter);
}

async function existsLaunch(launch_id) {
  return await findLaunch({
    flightNumber: launch_id,
  });
}

async function getLatestFlightNumber() {
  const latest_launch = await launches.findOne().sort("-flightNumber");
  if (!latest_launch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latest_launch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launches
    .find({}, "-_id -__v")
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("Planet was not found");
  }
  const new_flight_number = (await getLatestFlightNumber()) + 1;
  const new_launch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["YO", "NASA"],
    flightNumber: new_flight_number,
  });
  await saveLaunch(new_launch);
}

async function abortLaunchById(launch_id) {
  const aborted = await launches.updateOne(
    {
      flightNumber: launch_id,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.modifiedCount === 1;
}

module.exports = {
  getAllLaunches,
  existsLaunch,
  abortLaunchById,
  scheduleNewLaunch,
  loadLaunchesData,
};
