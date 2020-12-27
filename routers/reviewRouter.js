// third-party modules
const express = require("express");

// own modules
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const router = express.Router({ mergeParams: true });

// /:tourId/reviews
// /reviews
router
    .route("/")
    .get(authController.protect, reviewController.getAllReviews)
    .post(authController.protect, reviewController.createNewReview);

router.route("/:id").delete(authController.protect, reviewController.deleteSingleReview);
module.exports = router;
