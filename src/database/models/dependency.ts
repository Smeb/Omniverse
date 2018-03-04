/* tslint:disable:object-literal-sort-keys */

import { sequelize } from "../sequelize";

import { Bundle } from "./bundle";

import * as Sequelize from "sequelize";

export interface IDependency {
  name: string,
  version: string
}

export const Dependency = sequelize.define("bundleDependencies", {
  dependent: {
    type: Sequelize.INTEGER,
    references: {
      model: Bundle,
      key: "id"
    }
  },
  dependency: {
    type: Sequelize.INTEGER,
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
