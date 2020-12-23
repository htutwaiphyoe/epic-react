// third-party modules
const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
    console.error("uncaughtException ", err);
    process.exit(1);
});
dotenv.config({ path: "./.env" });
// own modules
const app = require("./app");

const dbString = process.env.DB_CONNECTION_STRING.replace("<PASSWORD>", process.env.DB_PASSWORD);
mongoose.connect(dbString, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
});

if (process.env.NODE_ENV === "development") {
    mongoose.connection.on("connected", () => {
        console.log("Database connected successfully");
    });
    mongoose.connection.on("disconnected", () => {
        console.log("No internet connection");
    });
    mongoose.connection.on("error", (err) => {
        console.log("Database connection fail");
    });
}

const port = process.env.PORT || 8000;
// Starting server
const server = app.listen(port, () => {});

process.on("unhandledRejection", (err) => {
    console.error("unhandledRejection ", err);
    server.close(() => {
        process.exit(1);
    });
});
