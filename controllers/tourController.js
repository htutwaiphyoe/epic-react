// Core modules

// Own modules
const Tour = require("../models/tourModel");
const catchError = require("../utils/catchError");
const controllerFactory = require("../factory/controllerFactory");
const AppError = require("../utils/AppError");

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

exports.getAllTours = controllerFactory.getAll(Tour);
exports.addNewTour = controllerFactory.createOne(Tour);
exports.getSingleTour = controllerFactory.getOne(Tour, { path: "reviews" });
exports.updateSingleTour = controllerFactory.updateOne(Tour);
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

exports.getToursWithIn = catchError(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");
    if (!lat || !lng) {
        return next(new AppError("Missing latitude & longitude", 400));
    }
    const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

exports.getDistances = catchError(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");
    if (!lat || !lng) {
        return next(new AppError("Missing latitude & longitude", 400));
    }
    const distanceMultiplier = unit === "mi" ? 0.000621371 : 0.001;
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [+lng, +lat],
                },
                distanceField: "distance",
                distanceMultiplier,
            },
        },
        {
            $project: {
                name: 1,
                distance: 1,
            },
        },
    ]);

    res.status(200).json({
        status: "success",
        results: distances.length,
        data: {
            data: distances,
        },
    });
});
