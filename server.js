// third-party modules
const dotenv = require("dotenv");
const mongoose = require("mongoose");

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

mongoose.connection.on("connected", () => {
    console.log("Database connected successfully");
});

mongoose.connection.on("error", (err) => {
    console.log("Database connection fail", err);
});

const port = process.env.PORT || 8000;
// Starting server
app.listen(port, () => {});
