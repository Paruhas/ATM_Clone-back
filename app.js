require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { errors } = require("./middlewares/errors");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", (req, res, next) => {
  res.status(404).json({ message: "Path not found" });
});

app.use(errors);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log("Server running on PORT: " + PORT));
