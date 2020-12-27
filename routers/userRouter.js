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

router.use(authController.protect);

router.patch("/update-password", authController.updatePassword);
router.get("/me", userController.getMe, userController.getSingleUser);
router.patch("/update-me", userController.updateMe);
router.delete("/delete-me", userController.deleteMe);

router.use(authController.restrict);

router.route("/").get(userController.getAllUsers);
router
    .route("/:id")
    .get(userController.getSingleUser)
    .patch(userController.updateSingleUser)
    .delete(userController.deleteSingleUser);

module.exports = router;
