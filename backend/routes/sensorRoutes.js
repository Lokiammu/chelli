const express = require("express");
const createSensorController = require("../controllers/sensorController");

function createSensorRoutes(deps) {
  const router = express.Router();
  const controller = createSensorController(deps);

  router.post("/updateFreshness", controller.updateFreshness);
  router.get("/latestData", controller.getLatestData);
  router.post("/predictVQI", controller.predictVQI);

  return router;
}

module.exports = createSensorRoutes;
