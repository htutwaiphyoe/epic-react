// third-party modules
const mongoose = require("mongoose");
// own modules
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            trim: true,
            required: [true, "Missing review"],
        },
        rating: {
            type: Number,
            required: [true, "Missing review rating"],
            min: 1,
            max: 5,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: "Tour",
            required: [true, "Missing tour that was reviewed"],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: [true, "Missing user who reviewed"],
        },
    },
    {
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
    }
);

// query middlewares
// populate user and tour
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: "user",
        select: "name photo",
    });
    next();
});

// static methods
reviewSchema.statics.calculateAverageRating = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: "$tour",
                numberOfRatings: { $sum: 1 },
                averageRating: { $avg: "$rating" },
            },
        },
    ]);

    await Tour.findByIdAndUpdate(tourId, {
        ratingsAverage: stats[0].averageRating,
        ratingsQuantity: stats[0].numberOfRatings,
    });
};

reviewSchema.post("save", function (doc, next) {
    this.constructor.calculateAverageRating(this.tour);
    next();
});
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
