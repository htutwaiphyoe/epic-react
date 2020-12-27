// own modules
// const AppError = require("../utils/AppError");
const catchError = require("../utils/catchError");
const Review = require("../models/reviewModel");
const controllerFactory = require("../factory/controllerFactory");

exports.getAllReviews = catchError(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const reviews = await Review.find(filter);
    res.status(200).json({
        status: "success",
        results: reviews.length,
        data: {
            reviews,
        },
    });
});

exports.setTourAndUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user._id;
    next();
};

exports.createNewReview = controllerFactory.createOne(Review);

exports.updateSingleReview = controllerFactory.updateOne(Review);
exports.deleteSingleReview = controllerFactory.deleteOne(Review);
