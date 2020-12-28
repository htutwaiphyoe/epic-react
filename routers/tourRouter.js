// third-party modules
const express = require("express");
// Own modules
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("./reviewRouter");

const router = express.Router();
// param middleware
// router.param("id", tourController.checkId);
// nested routes
// router.route("/:tourId/reviews").post(authController.protect, reviewController.createNewReview);
router.use("/:tourId/reviews", reviewRouter);

router.route("/top-5").get(tourController.aliasTop5, tourController.getAllTours);
router.route("/cheapest").get(tourController.aliasCheapest, tourController.getAllTours);
router.route("/tour-stats").get(tourController.getTourStats);
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);
router
    .route("/tours-within/:distance/center/:latlng/unit/:unit")
    .get(tourController.getToursWithIn);

router
    .route("/")
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restrict, tourController.addNewTour);

router
    .route("/:id")
    .get(tourController.getSingleTour)
    .patch(authController.protect, authController.restrict, tourController.updateSingleTour)
    .delete(authController.protect, authController.restrict, tourController.deleteSingleTour);

module.exports = router;
