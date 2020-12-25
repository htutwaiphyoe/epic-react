// core modules
const crypto = require("crypto");

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
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
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
    confirmPassword: {
        type: String,

        validate: {
            validator: function (value) {
                return value === this.password;
            },
            message: "Passwords do not match",
        },
        required: [true, "Missing confirm password"],
    },
    passwordChangedAt: {
        type: Date,
    },
    passwordResetToken: String,
    passwordResetExprieIn: String,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

// document middleware
userSchema.pre("save", async function (next) {
    // run this if password is not changed
    if (!this.isModified("password")) return next();

    // hash password
    this.password = await bcrypt.hash(this.password, 12);

    // delete confirmpassword
    this.confirmPassword = undefined;
    next();
});

// query middleware
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});
userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 5000;
    next();
});
// instance methods
userSchema.methods.checkPassword = async function (inputPassword, hashPassword) {
    return await bcrypt.compare(inputPassword, hashPassword);
};

userSchema.methods.checkPasswordUpdate = function (jwttimestamp) {
    if (this.passwordChangedAt) {
        const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return jwttimestamp < changedAt;
    }
    return false;
};

userSchema.methods.generatePasswordResetToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
    this.passwordResetExprieIn = Date.now() + 10 * 60 * 1000;
    return token;
};
const User = mongoose.model("User", userSchema);

module.exports = User;
