const express = require("express");
const cashRouter = express.Router();
const cashController = require("../controllers/cashController");

cashRouter.get("/", cashController.getAllCash);
cashRouter.post("/", cashController.creatCash);
cashRouter.patch("/", cashController.editCashAmount);

module.exports = cashRouter;
