// third-party modules
const express = require("express");
// own modules
const viewController = require("../controllers/viewController");

const router = express.Router();

router.get("/", viewController.getOverview);

router.get("/tours/:slug", viewController.getTourDetail);

module.exports = router;
