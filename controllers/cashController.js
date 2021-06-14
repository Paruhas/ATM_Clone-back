const { CashInAtm, sequelize } = require("../models");
const AppError = require("../utils/AppError");

const cashAmountIsNumber = /^[0-9]*$/;

exports.getAllCash = async (req, res, next) => {
  try {
    const allCash = await CashInAtm.findAll();

    return res.status(200).json({ allCash });
  } catch (err) {
    next(err);
  }
};

exports.creatCash = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { cashType } = req.body;

    if (cashType !== "1000" && cashType !== "500" && cashType !== "100") {
      throw new AppError(400, "cash must be 1000, 500 or 100");
    }

    const isThisCashTypeInDB = await CashInAtm.findOne({
      where: { cashType: cashType },
    });

    if (isThisCashTypeInDB) {
      throw new AppError(400, "this cashType already in DB");
    }

    const creatNewCash = await CashInAtm.create(
      { cashType: cashType, cashAmount: 0 },
      {
        transaction: transaction,
      }
    );

    await transaction.commit();
    return res
      .status(201)
      .json({ message: `successful createCash type: ${cashType}` });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.editCashAmount = async (req, res, next) => {
  try {
    const { cashType, cashAmount } = req.body;

    if (!cashAmount || !cashAmount.trim()) {
      return res.status(400).json({ message: "cashAmount is required" });
    }
    if (!cashAmountIsNumber.test(cashAmount)) {
      return res.status(400).json({ message: "cashAmount must be digit" });
    }

    const isThisCashTypeInDB = await CashInAtm.findOne({
      where: { cashType: cashType },
    });

    if (!isThisCashTypeInDB) {
      return res.status(400).json({ message: "cashType not found" });
    }

    // console.log(isThisCashTypeInDB.cashAmount, "isThisCashTypeInDB - cash");
    const sumCashAmount = +cashAmount + isThisCashTypeInDB.cashAmount;
    // console.log(sumCashAmount, "sumCashAmount");

    const updateCashAmount = await CashInAtm.update(
      {
        cashAmount: sumCashAmount,
      },
      {
        where: {
          cashType: cashType,
        },
      }
    );

    return res.status(200).json({
      message: `successful updateCashAmount for cashType: ${cashType}`,
    });
  } catch (err) {
    next(err);
  }
};
