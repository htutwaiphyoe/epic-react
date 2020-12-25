// own modules
const User = require("../models/userModel");
const catchError = require("../utils/catchError");
const AppError = require("../utils/AppError");

const filterBody = (body, ...allowedFields) => {
    const newBody = {};
    Object.keys(body).forEach((field) => {
        if (allowedFields.includes(field)) {
            newBody[field] = body[field];
        }
    });
    return newBody;
};
exports.updateMe = catchError(async (req, res, next) => {
    // check password includes
    if (req.body.password || req.body.confirmPassword) {
        return next(new AppError("Password can't be updated here. Try another", 400));
    }

    // filter body
    const body = filterBody(req.body, "name", "email");
    if (Object.keys(body).length === 0) {
        return next(new AppError("Please fill the form", 400));
    }

    // update user
    const user = await User.findByIdAndUpdate(req.user._id, body, {
        new: true,
        runValidators: true,
    });

    // send response
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    });
});

exports.deleteMe = catchError(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: "success",
        data: null,
    });
});
exports.getAllUsers = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "No route yet implemented",
    });
};
exports.addNewUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "No route yet implemented",
    });
};
exports.getSingleUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "No route yet implemented",
    });
};
exports.updateSingleUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "No route yet implemented",
    });
};
exports.deleteSingleUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "No route yet implemented",
    });
};
