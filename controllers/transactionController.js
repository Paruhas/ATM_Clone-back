const { User, CashInAtm, Transaction, sequelize } = require("../models");
const AppError = require("../utils/AppError");

const IsNumber = /^[0-9]*$/;

exports.getTransactionByUserId = async (req, res, next) => {
  try {
    const { id } = req.user;

    const userTransaction = await Transaction.findAll({
      where: { userId: id },
    });

    return res.status(200).json({ userTransaction: userTransaction });
  } catch (err) {
    next(err);
  }
};

exports.createDeposit = async (req, res, next) => {
  try {
    const { deposits } = req.body;
    const { id } = req.user;

    const cashData = await CashInAtm.findAll();

    const cashTypeForValidate = [];
    for (let values of cashData) {
      cashTypeForValidate.push(values.cashType);
    }

    //validate
    for (let values of deposits) {
      const hasThisCashTypeInDB = cashTypeForValidate.findIndex((item) => {
        return item === Object.keys(values)[0];
      });
      if (hasThisCashTypeInDB === -1) {
        return res
          .status(400)
          .json({ message: "cashType from req doesn't match cashType in DB" });
      }
      if (!Object.values(values)[0] || !Object.values(values)[0].trim()) {
        return res.status(400).json({ message: "deposit values is required" });
      }
      if (!IsNumber.test(Object.values(values)[0])) {
        return res.status(400).json({ message: "deposit values be digit" });
      }
    }

    // แปลง req.body ให้ใช้งานง่ายๆ?
    const newBody = deposits.reduce((acc, item) => {
      return {
        ...acc,
        [Object.keys(item)]: Object.values(item)[0],
      };
    }, {});

    // หาผลรวมของจำนวนเงินที่ฝาก
    const totalMoney = deposits.reduce((acc, item) => {
      const sum = Object.keys(item) * Object.values(item);
      return (acc = acc + sum);
    }, 0);

    if (totalMoney === 0) {
      return res.status(400).json({ message: "cannot deposit 0 bath" });
    }
    if (totalMoney % 100) {
      return res.status(400).json({
        message: "cannot deposit this totalMoney; not receive coin and 20,50",
      });
    }

    // หา balance เดิม เพื่อสร้าง balance ใหม่ที่จะทำการเพิ่ม/แก้ไข ลงDB
    const userData = await User.findOne({ where: { id: id } });

    const newBalance = totalMoney + +userData.balance;

    // สร้าง transaction
    const userCreateTransaction = await Transaction.create({
      transactionType: "deposit",
      increase: totalMoney,
      balance: newBalance,
      userId: id,
    });

    const userUpdateBalance = await User.update(
      { balance: newBalance },
      { where: { id: id } }
    );

    // หา จำนวนเงิน เดิม เพื่อสร้าง จำนวนเงิน ใหม่ที่จะทำการแก้ไข ลงDB
    // cashData อยู่ด้านบน

    const newCashData = cashData.reduce((acc, item) => {
      return {
        ...acc,
        [item.cashType]: item.cashAmount,
      };
    }, {});

    // HardCode
    const new1000 = newCashData[1000] + +newBody[1000];
    const new500 = newCashData[500] + +newBody[500];
    const new100 = newCashData[100] + +newBody[100];
    console.log(new1000, "new1000");
    console.log(new500, "new500");
    console.log(new100, "new100");

    const updateAtmCash1000 = await CashInAtm.update(
      { cashAmount: new1000 },
      { where: { cashType: "1000" } }
    );
    const updateAtmCash500 = await CashInAtm.update(
      { cashAmount: new500 },
      { where: { cashType: "500" } }
    );
    const updateAtmCash100 = await CashInAtm.update(
      { cashAmount: new100 },
      { where: { cashType: "100" } }
    );

    return res.status(200).json({ message: "deposit successful" });
  } catch (err) {
    next(err);
  }
};

exports.createWithdraw = async (req, res, next) => {
  try {
    const { withdraw } = req.body;

    if (withdraw % 100) {
      return res.status(400).json({
        message: "cannot withdraw this moneyValues; not give coin and 20,50",
      });
    }

    return;

    return res.status(200).json({ message: "withdraw successful" });
  } catch (err) {
    next(err);
  }
};

exports.createTransfer = async (req, res, next) => {
  try {
    const { transferValues, toUserId } = req.body;
    const { id } = req.user;

    if (id === +toUserId) {
      return res.status(400).json({ message: "cannot transfer to your Id" });
    }

    const fromUser = await User.findOne({ where: { id: id } });

    if (!fromUser) {
      return res.status(400).json({ message: "User made transfer not found" });
    }

    const toUser = await User.findOne({ where: { id: toUserId } });

    if (!toUser) {
      return res
        .status(400)
        .json({ message: "User who will got transfer not found" });
    }

    console.log(fromUser.balance, "fromUser.balance");
    console.log(transferValues, "transferValues");
    const newFromBalance = +fromUser.balance - +transferValues;
    console.log(newFromBalance, "newFromBalance");

    if (newFromBalance < 0) {
      return res
        .status(400)
        .json({ message: "your currentBalance is not enough" });
    }

    const newToBalance = +toUser.balance + +transferValues;
    console.log(newToBalance, "newToBalance");

    // throw Error;

    const createTransferFromTransaction = await Transaction.create({
      transactionType: "madeTransfer",
      decrease: +transferValues,
      balance: newFromBalance,
      description: `made transfer to "${toUser.username}"`,
      userId: id,
    });

    const createTransferToTransaction = await Transaction.create({
      transactionType: "gotTransfer",
      increase: +transferValues,
      balance: newToBalance,
      description: `got transfer from "${fromUser.username}"`,
      userId: toUserId,
    });

    const updateUserFromBalance = await User.update(
      { balance: newFromBalance },
      { where: { id: id } }
    );

    const updateUserToBalance = await User.update(
      { balance: newToBalance },
      { where: { id: toUserId } }
    );

    return res.status(200).json({ message: "transfer successful" });
  } catch (err) {
    next(err);
  }
};
