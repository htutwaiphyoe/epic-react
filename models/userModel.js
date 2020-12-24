const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, "Missing name"],
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: [true, "Missing email"],
        lowercase: true,
        validate: [validator.isEmail, "Invalid email"],
    },
    photo: {
        type: String,
        default: "asdfsd",
    },
    password: {
        type: String,
        trim: true,
        minLength: 8,
        required: [true, "Missing password"],
    },
    comfirmPassword: {
        type: String,
        required: [true, "Missing confirm password"],
    },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
