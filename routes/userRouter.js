const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.post("/register", userController.register);
userRouter.post("/login", userController.login);

userRouter.get("/user", userController.protect, userController.getAllUsers);
userRouter.get("/user/me", userController.protect, userController.getMe);
userRouter.get("/user/:id", userController.protect, userController.getUserById);

module.exports = userRouter;
