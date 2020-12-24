// third-party modules
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

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
        select: false,
    },
    comfirmPassword: {
        type: String,
        required: [true, "Missing confirm password"],
        validate: {
            validator: function (value) {
                return value === this.password;
            },
            message: "Passwords do not match",
        },
    },
});

userSchema.pre("save", async function (next) {
    // run this if password is not changed
    if (!this.isModified("password")) return next();

    // hash password
    this.password = await bcrypt.hash(this.password, 12);

    // delete confirmpassword
    this.comfirmPassword = undefined;
    next();
});

// instance methods
userSchema.methods.checkPassword = async function (inputPassword, hashPassword) {
    return await bcrypt.compare(inputPassword, hashPassword);
};
const User = mongoose.model("User", userSchema);

module.exports = User;
