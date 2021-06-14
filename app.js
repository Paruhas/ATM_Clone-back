require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { errors } = require("./middlewares/errors");

const userRouter = require("./routes/userRouter");
const transactionRouter = require("./routes/transactionRouter");
const cashRouter = require("./routes/cashRouter");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", userRouter);
app.use("/transaction", transactionRouter);
app.use("/cash", cashRouter);

app.use("/", (req, res, next) => {
  res.status(404).json({ message: "Path not found" });
});

app.use(errors);

// const { sequelize } = require("./models");
// sequelize.sync({ force: true }).then(() => console.log("DB sync"));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log("Server running on PORT: " + PORT));
