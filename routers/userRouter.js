// third-party modules
const express = require("express");
// Own modules
const userController = require("../controllers/userController");
const router = express.Router();

router.route("/").get(userController.getAllUsers).post(userController.addNewUser);
router
    .route("/:id")
    .get(userController.getSingleUser)
    .patch(userController.updateSingleUser)
    .delete(userController.deleteSingleUser);

module.exports = router;
