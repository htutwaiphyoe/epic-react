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

exports.getTourDetail = catchError(async (req, res) => {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).populate({
        path: "reviews",
        fields: "review rating user",
    });

    res.status(200).render("tour", {
        title: tour.name,
        tour,
    });
});
