// third-party modules
const express = require("express");

// own modules
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router
    .route("/")
    .get(reviewController.getAllReviews)
    .post(reviewController.setTourAndUserIds, reviewController.createNewReview);

router
    .route("/:id")
    .get(reviewController.getSingleReview)
    .patch(reviewController.updateSingleReview)
    .delete(reviewController.deleteSingleReview);

module.exports = router;
