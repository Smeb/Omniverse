import * as Sequelize from "sequelize";
import { sequelize } from "../sequelize";

export const Key = sequelize.define("bundleKey", {
  name: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  key: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  }
});

Key.sync({ force: true }).then(() => {
  return Key.create({
    name: "bundleName",
    key: "bundleKey"
  });
});
