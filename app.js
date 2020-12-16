// third-party modules
const express = require("express");
const morgan = require("morgan");
// own modules
const tourRouter = require("./routers/tourRouter");
const userRouter = require("./routers/userRouter");
const app = express();

// Middleware
// logger
app.use(morgan("dev"));
// body parser
app.use(express.json());

// Routes Middleware
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;
