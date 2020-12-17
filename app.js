// third-party modules
const express = require("express");
const morgan = require("morgan");
// own modules
const tourRouter = require("./routers/tourRouter");
const userRouter = require("./routers/userRouter");

const app = express();

// Middleware
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

module.exports = app;
