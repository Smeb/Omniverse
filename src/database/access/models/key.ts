/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { sequelize } from "../sequelize";

export const Key = sequelize.define("bundleKey", {
  name: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
    validate: {
      notEmpty: {
        args: false,
        msg: "Bundle name cannot be an empty string"
      }
    }
  },
  key: {
    type: Sequelize.TEXT,
    allowNull: false
  }
});
