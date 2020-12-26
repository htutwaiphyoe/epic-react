// third-party modules
const mongoose = require("mongoose");

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
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
