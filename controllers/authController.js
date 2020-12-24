// third-party modules
const jwt = require("jsonwebtoken");
const util = require("util");
const validator = require("validator");
// own modules
const User = require("../models/userModel");
const catchError = require("../utils/catchError");
const AppError = require("../utils/AppError");

const getToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

exports.signup = catchError(async (req, res, next) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        comfirmPassword: req.body.comfirmPassword,
    });

    const token = getToken(user._id);
    res.status(201).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
});

exports.login = catchError(async (req, res, next) => {
    // retrieve email and password
    const { email, password } = req.body;

    //check email and password are provided
    if (!email || !password) {
        return next(new AppError("Missing email or password", 400));
    }

    // check there is a user with email and password
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.checkPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401));
    }

    // get token
    const token = getToken(user._id);

    // send response
    res.status(200).json({
        status: "success",
        token,
    });
});

exports.protect = catchError(async (req, res, next) => {
    let token;
    // get token and check token exists

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return next(new AppError("You are not logged in.", 401));
    }

    // verify token
    const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

    // check user with id in token
    const user = await User.findById(decoded.id);
    if (!user) {
        return next(new AppError("User does not exist", 401));
    }

    // check user updates password
    if (user.checkPasswordUpdate(decoded.iat)) {
        return next(new AppError("User changed password. Please login again!", 401));
    }

    // get user and grant access to protected routes
    req.user = user;
    next();
});

exports.restrict = (req, res, next) => {
    // check user is admin
    if (req.user.role !== "admin") {
        return next(new AppError("You do not have permission", 403));
    }
    next();
};

exports.forgotPassword = catchError(async (req, res, next) => {
    // get email
    const { email } = req.body;
    if (!email) {
        return next(new AppError("Missing email", 400));
    }
    // check email
    if (!validator.isEmail(email)) {
        return next(new AppError("Invalid email", 400));
    }

    // get user with email
    const user = await User.findOne({ email });

    // check user
    if (!user) {
        return next(new AppError("No user found", 404));
    }

    // generate password reset token
    const token = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    next();
});

exports.resetPassword = catchError(async (req, res, next) => {});
