// own modules
const Review = require("../models/reviewModel");
const controllerFactory = require("../factory/controllerFactory");

exports.setTourAndUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user._id;
    next();
};

exports.getAllReviews = controllerFactory.getAll(Review);
exports.getSingleReview = controllerFactory.getOne(Review);
exports.createNewReview = controllerFactory.createOne(Review);
exports.updateSingleReview = controllerFactory.updateOne(Review);
exports.deleteSingleReview = controllerFactory.deleteOne(Review);
