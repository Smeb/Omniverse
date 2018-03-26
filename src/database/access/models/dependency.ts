/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { Bundle } from "./bundle";

import { sequelize } from "../sequelize";

export const Dependency = sequelize.define("bundleDependencies", {
  dependent: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: Bundle,
      key: "id"
    }
  },
  dependency: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: Bundle,
      key: "id"
    }
  }
}, {
  validate: {
    cantDependOnSelf() {
      if (this.dependent === this.dependency) {
        throw new Error("A bundle cannot depend on itself")
      }
    },
  }
});