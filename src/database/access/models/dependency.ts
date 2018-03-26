/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { Bundle } from "./bundle";

import { sequelize } from "../sequelize";

export const Dependency = sequelize.define("bundleDependencies", {
}, {
  validate: {
    cantDependOnSelf() {
      if (this.dependent === this.dependency) {
        throw new Error("A bundle cannot depend on itself")
      }
    },
  }
});

Bundle.belongsToMany(Bundle, { as: "dependency", through: Dependency, foreignKey: "dependent", otherKey: "dependency" });
