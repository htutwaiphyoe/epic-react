// own modules
const app = require("./app");

const port = 8000;
// Starting server
app.listen(port, () => {
    console.log("Server listening on port " + port);
});
