// own modules
const User = require("../models/userModel");
const catchError = require("../utils/catchError");

exports.signup = catchError(async (req, res, next) => {
    const user = await User.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            user,
        },
    });
});
