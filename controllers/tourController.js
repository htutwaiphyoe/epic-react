// Core modules

// Own modules
const Tour = require("../models/tourModel");
const APIFeatures = require("../Utils/APIFeatures");

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
exports.getAllTours = async (req, res) => {
    try {
        // get query
        const apiFeatures = new APIFeatures(Tour.find(), req.query)
            .filter()
            .sort()
            .limit()
            .paginate();

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
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};

exports.addNewTour = async (req, res) => {
    try {
        const tour = await Tour.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                tour,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err,
        });
    }
};

exports.getSingleTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        res.status(200).json({
            status: "success",
            data: {
                tour,
            },
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: "Invalid id",
        });
    }
};

exports.updateSingleTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: "success",
            data: {
                tour,
            },
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err.message,
        });
    }
};

exports.deleteSingleTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: "success",
            data: null,
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err.message,
        });
    }
};
