// third-party modules
const express = require("express");

// own modules
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const router = express.Router();

router
    .route("/")
    .get(authController.protect, reviewController.getAllReviews)
    .post(authController.protect, authController.restrict, reviewController.createNewReview);

module.exports = router;
