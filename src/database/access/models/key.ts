/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { sequelize } from "../sequelize";

// Checks bundle namespace for alphanumeric characters
export const bundleNamespaceRegex = /^[a-z0-9]+$/i;

export const Key = sequelize.define("bundleKey", {
  bundleNamespace: {
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
},
{
  validate: {
    keyNameIsAlphanumeric: () => {
      if (this.bundleNamespace && bundleNamespaceRegex.test(this.bundleNamespace)) {
        throw new Error("Namespace failed validation");
      }
    }
  }
});
