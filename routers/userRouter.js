// third-party modules
const express = require("express");
// Own modules
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);
router.patch("/update-password", authController.protect, authController.updatePassword);
router.patch("/update-me", authController.protect, userController.updateMe);
router.delete("/delete-me", authController.protect, userController.deleteMe);

router.route("/").get(userController.getAllUsers).post(userController.addNewUser);
router
    .route("/:id")
    .get(userController.getSingleUser)
    .patch(userController.updateSingleUser)
    .delete(authController.protect, authController.restrict, userController.deleteSingleUser);

module.exports = router;
