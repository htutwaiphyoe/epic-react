const mongoose = require("mongoose");

// schema
const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Missing name"],
            unique: true,
            trim: true,
            minLength: [10, "Name must be at least 10 characters"],
            maxLength: [40, "Name must be at most 40 characters"],
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, "Missing duration"],
        },
        maxGroupSize: {
            type: Number,
            required: [true, "Missing maxGroupSize"],
        },
        difficulty: {
            type: String,
            required: [true, "Missing difficulty"],
            enum: {
                values: ["easy", "medium", "difficult"],
                message: "Difficulty must be either easy, medium, or difficult",
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, "Ratings Average must be greater than or equal to 1.0"],
            max: [5, "Ratings Average must be less than or equal to 5.0"],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, "Missing price"],
        },
        priceDiscount: Number,
        summary: {
            type: String,
            required: [true, "Missing summary"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, "Missing imageCover"],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        secret: {
            type: Boolean,
            default: false,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// virtual properties
tourSchema.virtual("durationInWeeks").get(function () {
    return (this.duration / 7).toFixed(1);
});

// document middleware
tourSchema.pre("save", function (next) {
    this.slug = this.name.split(" ").join("-").toLowerCase();
    next();
});

// query middleware
tourSchema.pre(/^find/, function (next) {
    this.find({ secret: { $ne: true } });
    next();
});

// aggregation middleware
tourSchema.pre("aggregate", function (next) {
    this.pipeline().unshift({ $match: { secret: { $ne: true } } });
    next();
});

// model
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
