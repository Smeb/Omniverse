/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";


import { BundleVersions } from "./bundleVersions";

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

BundleVersions.belongsToMany(BundleVersions, { as: "dependencies", through: Dependency, foreignKey: "dependent", otherKey: "dependency" });
