// third-party modules
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// own modules
const tourRouter = require("./routers/tourRouter");
const userRouter = require("./routers/userRouter");
const AppError = require("./utils/AppError");
const globalErrorController = require("./controllers/errorController");

const app = express();

// Middleware
// rate limiter
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests, please try again in an hour",
});

app.use("/api", limiter);
// logger
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// body parser
app.use(express.json());
// static file
app.use(express.static(`${__dirname}/public`));

// Routes Middleware
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

// Unhandled routes middleware
app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorController);
module.exports = app;
