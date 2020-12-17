const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Missing name"],
        unique: true,
    },
    duration: {
        type: Number,
        required: [true, "Missing duration"],
    },
    price: {
        type: Number,
        required: [true, "Missing price"],
    },
    rating: {
        type: Number,
        default: 4.5,
    },
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
