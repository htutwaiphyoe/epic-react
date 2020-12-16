// third-party modules
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
// own modules
const app = require("./app");

const port = process.env.PORT || 8000;
// Starting server
app.listen(port, () => {
    console.log("Server listening on port " + port);
});
