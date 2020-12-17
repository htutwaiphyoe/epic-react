// Core modules

// Own modules
const Tour = require("../models/tourModel");

exports.getAllTours = async (req, res) => {
    try {
        const tours = await Tour.find();
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
            message: "Something went wrong",
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

exports.updateSingleTour = (req, res) => {
    // req.tour = {
    //     ...req.tour,
    //     ...req.body,
    // };
    // tours[+req.params.id] = req.tour;
    // fs.writeFile(
    //     `${__dirname}/../dev-data/data/tours-simple.json`,
    //     JSON.stringify(tours),
    //     "utf-8",
    //     (err) => {
    //         if (err) {
    //             return res.status(500).json({
    //                 status: "error",
    //                 error: {
    //                     message: "Server error",
    //                 },
    //             });
    //         }
    //         res.status(200).json({
    //             status: "success",
    //             data: {
    //                 tour: req.tour,
    //             },
    //         });
    //     }
    // );
};

exports.deleteSingleTour = (req, res) => {
    // tours = tours.filter((tour) => tour.id !== +req.params.id);
    // fs.writeFile(
    //     `${__dirname}/../dev-data/data/tours-simple.json`,
    //     JSON.stringify(tours),
    //     "utf-8",
    //     (err) => {
    //         if (err) {
    //             return res.status(500).json({
    //                 status: "error",
    //                 error: {
    //                     message: "Server error",
    //                 },
    //             });
    //         }
    //         res.status(204).json({
    //             status: "success",
    //             data: null,
    //         });
    //     }
    // );
};
