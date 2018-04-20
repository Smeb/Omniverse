/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { EnvironmentNames } from "./environmentNames";

import { versionRegex } from "../datatypes/version";
import { sequelize } from "../sequelize";

export const EnvironmentVersions = sequelize.define(
  "environmentVersions",
  {
    version: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "The EnvironmentVersion's version string can't be empty"
        },
        is: {
          args: versionRegex,
          msg:
            "Version number must be a sequence of three '.' separated digits 0-999 (e.g 1.12.132)"
        }
      },
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["environmentNameId", "version"]
      }
    ]
  }
);

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

export const LatestVersions = sequelize.define("latestVersions");

EnvironmentVersions.belongsToMany(EnvironmentVersions, { as: "dependencies", through: Dependency, foreignKey: "dependent", otherKey: "dependency" });

EnvironmentVersions.belongsTo(EnvironmentNames, {
  foreignKey: { allowNull: false },
  onDelete: "CASCADE"
});

