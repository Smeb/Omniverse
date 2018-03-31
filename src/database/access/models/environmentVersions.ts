/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { EnvironmentNamespaces } from "./environmentNamespaces";

import { versionRegex } from "../datatypes/version";
import { sequelize } from "../sequelize";

export const EnvironmentVersions = sequelize.define(
  "environmentVersions",
  {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "The Environment Version's name string can't be empty"
        },
      },
      unique: "nameVersion"
    },
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
      unique: "nameVersion"
    },
    latest: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  },
  {
    validate: {
      namespaceIsPrefix() {
        if (
          this.name &&
          this.namespace &&
          !this.name.startsWith(this.namespace)
        ) {
          throw new Error("Environment namespace should be a prefix of environment name");
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ["name", "latest"],
        where: {
          latest: true
        }
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

EnvironmentVersions.belongsToMany(EnvironmentVersions, { as: "dependencies", through: Dependency, foreignKey: "dependent", otherKey: "dependency" });

EnvironmentVersions.belongsTo(EnvironmentNamespaces, {
  foreignKey: { name: "namespace", allowNull: false },
  onDelete: "CASCADE"
});
