// Core modules

// Own modules
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");
const catchError = require("../utils/catchError");
const controllerFactory = require("../factory/controllerFactory");

exports.aliasTop5 = (req, res, next) => {
    req.query.sort = "-price,-ratingsAverage";
    req.query.limit = 5;
    req.query.fields = "name,price,duration,ratingsAverage,difficulty,summary";
    next();
};
exports.aliasCheapest = (req, res, next) => {
    req.query.sort = "price,-ratingsAverage";
    req.query.limit = 5;
    req.query.fields = "name,price,duration,ratingsAverage,difficulty,summary";
    next();
};

exports.getAllTours = catchError(async (req, res, next) => {
    // get query
    const apiFeatures = new APIFeatures(Tour.find(), req.query).filter().sort().limit().paginate();

    // execute query
    const tours = await apiFeatures.query;

    // send response
    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            tours,
        },
    });
});

exports.addNewTour = catchError(async (req, res, next) => {
    const tour = await Tour.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            tour,
        },
    });
});

exports.getSingleTour = catchError(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id).populate("reviews");
    if (!tour) {
        return next(new AppError("No tour found with that id", 404));
    }
    res.status(200).json({
        status: "success",
        data: {
            tour,
        },
    });
});

exports.updateSingleTour = catchError(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!tour) {
        return next(new AppError("No tour found with that id", 404));
    }
    res.status(200).json({
        status: "success",
        data: {
            tour,
        },
    });
});

exports.deleteSingleTour = controllerFactory.deleteOne(Tour);

exports.getTourStats = catchError(async (req, res, next) => {
    const tours = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                _id: { $toUpper: "$difficulty" },
                numberOfTours: { $sum: 1 },
                numberOfRatings: { $sum: "$ratingsQuantity" },
                averageRating: { $avg: "$ratingsAverage" },
                averagePrice: { $avg: "$price" },
                minimumPrice: { $min: "$price" },
                maximumPrice: { $max: "$price" },
            },
        },
        {
            $sort: { averagePrice: -1 },
        },
    ]);

    res.status(200).json({
        status: "success",
        data: {
            tours,
        },
    });
});

exports.getMonthlyPlan = catchError(async (req, res, next) => {
    const year = +req.params.year;
    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates",
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: "$startDates" },
                numberOfTours: { $sum: 1 },
                tours: { $push: "$name" },
            },
        },
        {
            $addFields: { month: "$_id" },
        },
        {
            $project: { _id: 0 },
        },
        {
            $sort: { numberOfTours: -1 },
        },
    ]);

    res.status(200).json({
        status: "success",
        results: plan.length,
        data: {
            plan,
        },
    });
});
