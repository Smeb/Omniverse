/* tslint:disable:object-literal-sort-keys */

import { sequelize } from "../sequelize";

import { Bundle } from "./bundle";

import * as Sequelize from "sequelize";

export interface IDependency {
  name: string,
  version: string
}

export interface IDependencyPair {
  dependent: IDependency,
  dependency: IDependency
}

export const Dependency = sequelize.define("bundleDependencies", {
  dependent: {
    type: Sequelize.STRING,
    references: {
      model: Bundle,
      key: "hash"
    }
  },
  dependency: {
    type: Sequelize.STRING,
    references: {
      model: Bundle,
      key: "hash"
    }
  }
}, {
  validate: {
    cantDependOnSelf() {
      if (this.dependent !== this.dependency) {
        throw new Error("A bundle cannot depend on itself")
      }
    },
  }
});
