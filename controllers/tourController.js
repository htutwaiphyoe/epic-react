// Core modules
const fs = require("fs");

let tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, "utf8"));
exports.getAllTours = (req, res) => {
    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            tours,
        },
    });
};

exports.addNewTour = (req, res) => {
    const tour = {
        id: tours.length,
        ...req.body,
    };
    tours.push(tour);
    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        "utf-8",
        (err) => {
            if (err) {
                return res.status(500).json({
                    status: "error",
                    error: {
                        message: "Server error",
                    },
                });
            }
            res.status(201).json({
                status: "success",
                data: {
                    tour,
                },
            });
        }
    );
};

exports.getSingleTour = (req, res) => {
    const tour = tours.find((tour) => tour.id === +req.params.id);
    if (!tour) {
        return res.status(404).json({
            status: "fail",
            message: "Tour not found",
        });
    }
    res.status(200).json({
        status: "success",
        data: {
            tour,
        },
    });
};

exports.updateSingleTour = (req, res) => {
    let tour = tours.find((tour) => tour.id === +req.params.id);
    if (!tour) {
        return res.status(404).json({
            status: "fail",
            message: "Tour not found",
        });
    }
    tour = {
        ...tour,
        ...req.body,
    };
    tours[+req.params.id] = tour;

    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        "utf-8",
        (err) => {
            if (err) {
                return res.status(500).json({
                    status: "error",
                    error: {
                        message: "Server error",
                    },
                });
            }
            res.status(200).json({
                status: "success",
                data: {
                    tour,
                },
            });
        }
    );
};

exports.deleteSingleTour = (req, res) => {
    const tour = tours.find((tour) => tour.id === +req.params.id);
    if (!tour) {
        return res.status(404).json({
            status: "fail",
            message: "Tour not found",
        });
    }
    tours = tours.filter((tour) => tour.id !== +req.params.id);
    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        "utf-8",
        (err) => {
            if (err) {
                return res.status(500).json({
                    status: "error",
                    error: {
                        message: "Server error",
                    },
                });
            }
            res.status(204).json({
                status: "success",
                data: null,
            });
        }
    );
};
