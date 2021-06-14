const express = require("express");
const transactionRouter = express.Router();
const transactionController = require("../controllers/transactionController");
const userController = require("../controllers/userController");

transactionRouter.get(
  "/user",
  userController.protect,
  transactionController.getTransactionByUserId
);
transactionRouter.post(
  "/deposit",
  userController.protect,
  transactionController.createDeposit
);
transactionRouter.post(
  "/withdraw",
  userController.protect,
  transactionController.createWithdraw
);
transactionRouter.post(
  "/transfer",
  userController.protect,
  transactionController.createTransfer
);

module.exports = transactionRouter;
