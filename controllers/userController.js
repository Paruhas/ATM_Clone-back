const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Transaction, sequelize } = require("../models");
const AppError = require("../utils/AppError");

const passwordIsNumber = /^[0-9]*$/;

exports.protect = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ message: "you are unauthorized" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findOne({
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "user not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !username.trim()) {
      throw new AppError(400, "username is required");
    }
    if (!password || !password.trim()) {
      throw new AppError(400, "password is required");
    }
    if (!confirmPassword || !confirmPassword.trim()) {
      throw new AppError(400, "confirmPassword is required");
    }
    if (password !== confirmPassword) {
      throw new AppError(400, "password and confirmPassword not match");
    }
    if (!passwordIsNumber.test(password)) {
      throw new AppError(400, "this password is invalid format; digit only");
    }

    const isHasThisUserInDatabase = await User.findOne({
      where: {
        username: username,
      },
    });

    if (isHasThisUserInDatabase) {
      throw new AppError(400, "this username have already taken");
    }

    const hashPassword = await bcrypt.hash(password, +process.env.BCRYPT_SALT);
    const newUser = await User.create(
      {
        username: username,
        password: hashPassword,
        balance: 0,
      },
      {
        transaction: transaction,
      }
    );

    const firstTransaction = await Transaction.create(
      {
        userId: newUser.id,
        transactionType: "deposit",
        balance: newUser.balance,
        description: "open an account",
      },
      {
        transaction: transaction,
      }
    );

    const payload = {
      id: newUser.id,
      username: newUser.username,
    };

    const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: +process.env.JWT_EXPIRES_IN,
    });

    await transaction.commit();
    return res.status(201).json({
      userId: newUser.id,
      token: token,
      firstTransaction: firstTransaction,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ message: "username is required" });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: "password is required" });
    }
    // if (!passwordIsNumber.test(password)) {
    //   return res
    //     .status(400)
    //     .json({ message: "this password is invalid format; digit only" });
    // }

    const loginUser = await User.findOne({
      where: {
        username: username,
      },
    });

    if (!loginUser) {
      return res
        .status(400)
        .json({ message: "username or password incorrect" });
    }

    const isPasswordMatch = await bcrypt.compare(password, loginUser.password);

    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ message: "username or password incorrect" });
    }

    const payload = {
      id: loginUser.id,
      username: loginUser.username,
    };

    const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: +process.env.JWT_EXPIRES_IN,
    });

    return res.status(200).json({ userId: loginUser.id, token: token });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await User.findAll({
      attributes: ["id", "username", "balance", "createdAt", "updatedAt"],
    });

    return res.status(200).json({
      allUsers: allUsers,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const thisUserIsBalance = await User.findOne({
      where: {
        id: req.user.id,
      },
    });

    return res.status(200).json({
      user: {
        id: req.user.id,
        username: req.user.username,
        currentBalance: thisUserIsBalance.balance,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ["id", "username", "balance", "createdAt", "updatedAt"],
    });

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    return res.status(200).json({ user: user });
  } catch (err) {
    next(err);
  }
};
