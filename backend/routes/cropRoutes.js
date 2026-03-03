const express = require("express");
const createCropController = require("../controllers/cropController");

function createCropRoutes(deps) {
  const router = express.Router();
  const controller = createCropController(deps);

  router.post("/saveCrop", controller.saveCrop);
  router.post("/updateCrop", controller.updateCrop);
  router.get("/getCrops", controller.getCrops);

  return router;
}

module.exports = createCropRoutes;
