// own modules
// const AppError = require("../utils/AppError");
const catchError = require("../utils/catchError");
const Review = require("../models/reviewModel");

exports.getAllReviews = catchError(async (req, res, next) => {
    const reviews = await Review.find();
    res.status(200).json({
        status: "success",
        results: reviews.length,
        data: {
            reviews,
        },
    });
});

exports.createNewReview = catchError(async (req, res, next) => {
    const review = await Review.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            review,
        },
    });
});
