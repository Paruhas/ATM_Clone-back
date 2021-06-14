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
      return res
        .status(400)
        .json({
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
  } catch (err) {
    next(err);
  }
};

exports.createTransfer = async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
};
