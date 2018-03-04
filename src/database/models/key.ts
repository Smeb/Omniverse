/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";
import { sequelize } from "../sequelize";

export interface IKeyRegistration {
  name: string;
  key: string;
};

export const Key = sequelize.define("bundleKey", {
  name: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  key: {
    type: Sequelize.TEXT,
    allowNull: false
  }
});
