const fs = require("fs");
const express = require("express");

const app = express();
const port = 8000;

// Middleware
// body parser
app.use(express.json());
// Top level code
let tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, "utf8"));

// API

// RouteHandlers
const getAllTours = (req, res) => {
    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            tours,
        },
    });
};

const addNewTour = (req, res) => {
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

const getSingleTour = (req, res) => {
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

const updateSingleTour = (req, res) => {
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

const deleteSingleTour = (req, res) => {
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
// Routes
app.route("/api/v1/tours").get(getAllTours).post(addNewTour);
app.route("/api/v1/tours/:id").get(getSingleTour).patch(updateSingleTour).delete(deleteSingleTour);

// Starting server
app.listen(port, () => {
    console.log("Server listening on port " + port);
});
