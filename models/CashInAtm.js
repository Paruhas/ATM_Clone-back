module.exports = (sequelize, DataTypes) => {
  const CashInAtm = sequelize.define(
    "CashInAtm",
    {
      cashType: {
        type: DataTypes.ENUM,
        values: ["1000", "500", "100"],
        allowNull: false,
      },
      cashAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      underscored: true,
      timestamps: false,
    }
  );

  return CashInAtm;
};
