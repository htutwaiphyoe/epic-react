// third-party modules
const express = require("express");
// Own modules
const tourController = require("../controllers/tourController");

const router = express.Router();
router.param("id", tourController.checkId);
router.route("/").get(tourController.getAllTours).post(tourController.addNewTour);
router
    .route("/:id")
    .get(tourController.getSingleTour)
    .patch(tourController.updateSingleTour)
    .delete(tourController.deleteSingleTour);

module.exports = router;
