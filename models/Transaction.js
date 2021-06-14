module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      transactionType: {
        type: DataTypes.ENUM,
        values: ["deposit", "withdraw", "madeTransfer", "gotTransfer"],
        allowNull: false,
      },
      decrease: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      increase: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      balance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: {
        name: "userId",
        allowNull: false,
      },
      onDelete: "RESTRICT",
      onUpdate: "RESTRICT",
    });
  };

  return Transaction;
};
