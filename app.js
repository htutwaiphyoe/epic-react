const fs = require("fs");
const express = require("express");

const app = express();
const port = 8000;

// Middleware
// body parser
app.use(express.json());
// Top level code
const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, "utf8"));

// API

// GET All Tours
app.get("/api/v1/tours", (req, res) => {
    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            tours,
        },
    });
});

// Create New Tour
app.post("/api/v1/tours", (req, res) => {
    const tour = {
        id: tours.length,
        ...req.body,
    };
    tours.push(tour);
    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simplejson`,
        JSON.stringify(tours),
        "utf-8",
        (err) => {
            if (err) {
                res.status(500).json({
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
});
// Starting server
app.listen(port, () => {
    console.log("Server listening on port " + port);
});
