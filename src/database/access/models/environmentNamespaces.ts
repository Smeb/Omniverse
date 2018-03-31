/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { sequelize } from "../sequelize";

// Checks bundle namespace for alphanumeric characters
export const namespaceRegex = /^[a-z0-9]+$/i;

export const EnvironmentNamespaces = sequelize.define("environmentNamespaces", {
  namespace: {
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
      if (this.namespace && namespaceRegex.test(this.namespace)) {
        throw new Error("Environment namespace failed validation");
      }
    }
  }
});
