// Own modules
const AppError = require("../utils/AppError");

const sendDevError = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendProdError = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Oops! Something went wrong.💥",
        });
    }
};

const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKeyError = (err) =>
    new AppError(
        `${Object.keys(err.keyValue).join(" ")}: ${err.keyValue.name} is already in use`,
        400
    );

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        // console.log(err.code, err.keyValue.name);
        sendDevError(err, res);
    } else if (process.env.NODE_ENV === "production") {
        if (err.name === "CastError") {
            err = handleCastError(err);
        }
        if (err.code === 11000) {
            err = handleDuplicateKeyError(err);
        }
        sendProdError(err, res);
    }
};
