exports.errors = (err, req, res, next) => {
  console.log(err);
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "You are unauthorized" });
  }
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ message: "SequelizeValidationError" });
  }
  res.status(500).json({ messageError: err.message });
};
