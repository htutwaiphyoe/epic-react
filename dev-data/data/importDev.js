const fs = require("fs");

const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Tour = require("../../models/tourModel");

dotenv.config({ path: "./.env" });

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

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf8"));

const importData = async () => {
    try {
        await Tour.create(tours);
        console.log("Data imported successfully");
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

const deleteData = async () => {
    try {
        await Tour.deleteMany({});
        console.log("Data deleted successfully");
    } catch (err) {
        console.log(err);
    }

    process.exit();
};

if (process.argv[2] === "--import") {
    importData();
} else if (process.argv[2] === "--delete") {
    deleteData();
}
