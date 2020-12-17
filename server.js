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

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Missing name"],
        unique: true,
    },
    duration: {
        type: Number,
        required: [true, "Missing duration"],
    },
    price: {
        type: Number,
        required: [true, "Missing price"],
    },
    rating: {
        type: Number,
        default: 4.5,
    },
});

const Tour = mongoose.model("Tour", tourSchema);

const testTour = new Tour({
    name: "Test Tour 2",
    duration: 4,
    price: 699,
});

testTour
    .save()
    .then((doc) => console.log(doc))
    .catch((err) => console.log(err));
const port = process.env.PORT || 8000;
// Starting server
app.listen(port, () => {});
