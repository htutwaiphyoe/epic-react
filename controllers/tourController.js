// Core modules

// Own modules
const Tour = require("../models/tourModel");

exports.getAllTours = (req, res) => {
    // res.status(200).json({
    //     status: "success",
    //     results: tours.length,
    //     data: {
    //         tours,
    //     },
    // });
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

exports.getSingleTour = (req, res) => {
    // res.status(200).json({
    //     status: "success",
    //     data: {
    //         tour: req.tour,
    //     },
    // });
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
