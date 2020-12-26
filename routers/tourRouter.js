// third-party modules
const express = require("express");
// Own modules
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const router = express.Router();
// router.param("id", tourController.checkId);
router.route("/top-5").get(tourController.aliasTop5, tourController.getAllTours);

router.route("/cheapest").get(tourController.aliasCheapest, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);

router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);

router
    .route("/")
    .get(authController.protect, tourController.getAllTours)
    .post(authController.protect, authController.restrict, tourController.addNewTour);

router
    .route("/:id")
    .get(authController.protect, tourController.getSingleTour)
    .patch(authController.protect, authController.restrict, tourController.updateSingleTour)
    .delete(authController.protect, authController.restrict, tourController.deleteSingleTour);

// nested routes
router.route("/:tourId/reviews").post(authController.protect, reviewController.createNewReview);

module.exports = router;
