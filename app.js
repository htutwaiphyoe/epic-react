// core modules
const path = require("path");
// third-party modules
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

// own modules
const tourRouter = require("./routers/tourRouter");
const userRouter = require("./routers/userRouter");
const reviewRouter = require("./routers/reviewRouter");

const AppError = require("./utils/AppError");
const globalErrorController = require("./controllers/errorController");

const app = express();

// Middleware
// template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// static file
app.use(express.static(path.join(__dirname, "public")));
// secure http headers
app.use(helmet());
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
app.use(express.json({ limit: "100kb" }));

// NoSQL injection
app.use(mongoSanitize());

// xss
app.use(xss());

// parameter polluions
app.use(
    hpp({
        whitelist: ["duration", "ratingsAverage", "difficulty", "price", "maxGroupSize"],
    })
);

// Routes Middleware
app.get("/", (req, res) => {
    res.status(200).render("base", {
        tour: "The Forest Hiker",
        user: "HWP",
    });
});
// api
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

// Unhandled routes middleware
app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorController);
module.exports = app;
