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
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].averageRating,
            ratingsQuantity: stats[0].numberOfRatings,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0,
        });
    }
};

reviewSchema.post("save", async (doc) => {
    await doc.constructor.calculateAverageRating(doc.tour);
});

reviewSchema.post(/^findOneAnd/, async (doc) => {
    if (doc) {
        await doc.constructor.calculateAverageRating(doc.tour);
    }
});
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
