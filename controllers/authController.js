const util = require("util");
const crypto = require("crypto");
// third-party modules
const jwt = require("jsonwebtoken");
const validator = require("validator");
// own modules
const User = require("../models/userModel");
const catchError = require("../utils/catchError");
const AppError = require("../utils/AppError");
const sendEmail = require("../mail/email");

const getToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

const sendResponseWithToken = (user, statusCode, res, data = undefined) => {
    const token = getToken(user._id);

    // send cookie
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === "production") {
        cookieOptions.secure = true;
    }
    res.cookie("jwt", token, cookieOptions);

    // delete password
    user.password = undefined;
    // send response
    res.status(statusCode).json({
        status: "success",
        token,
        data,
    });
};
exports.signup = catchError(async (req, res, next) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
    });
    sendResponseWithToken(user, 201, res, { user });
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

    // send response
    sendResponseWithToken(user, 200, res);
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

    // send email with reset url
    const resetURL = `${req.protocol}://${req.hostname}/api/v1/users/reset-password/${token}`;
    try {
        await sendEmail({
            email: req.body.email,
            subject: "Your password reset email (Valid in 10 minutes)",
            body: `Here is the link to reset your password, ${resetURL}`,
        });

        res.status(200).json({
            status: "success",
            message: "Password reset email is send. Check your email.",
        });
    } catch (err) {
        // delete password reset data for error
        user.passwordResetToken = undefined;
        user.passwordResetExprieIn = undefined;
        user.save({ validateBeforeSave: false });
        return next(new AppError("There was an error sending email. Please try again.", 500));
    }
});

exports.resetPassword = catchError(async (req, res, next) => {
    // get token and hash token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    // retrieve user with that token
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExprieIn: { $gt: Date.now() },
    });
    if (!user) {
        return next(new AppError("Token is invalid or has expired", 400));
    }

    // update password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetExprieIn = undefined;
    user.passwordResetToken = undefined;
    await user.save();

    // send response with new jwt
    sendResponseWithToken(user, 200, res);
});

exports.updatePassword = catchError(async (req, res, next) => {
    // retrieve user
    const user = await User.findById(req.user._id).select("+password");
    // check old password
    const { oldPassword, newPassword, newConfirmPassword } = req.body;
    if (!oldPassword || !newPassword || !newConfirmPassword) {
        return next(new AppError("Please fill the form", 400));
    }
    if (!(await user.checkPassword(oldPassword, user.password))) {
        return next(new AppError("Incorrect password", 400));
    }

    // update password
    user.password = newPassword;
    user.confirmPassword = newConfirmPassword;
    await user.save();

    // send token
    sendResponseWithToken(user, 200, res);
});
