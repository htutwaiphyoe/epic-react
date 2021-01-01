// own modules
const Tour = require("../models/tourModel");
const catchError = require("../utils/catchError");

exports.getOverview = catchError(async (req, res) => {
    const tours = await Tour.find();
    res.status(200).render("overview", {
        title: "Exciting tours for adventurous people",
        tours,
    });
});

exports.getTourDetail = (req, res) => {
    res.status(200).render("tour", {
        title: "The Forest Hiker",
    });
};
