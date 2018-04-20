/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { EnvironmentNamespaces } from "./environmentNamespaces";

import { versionRegex } from "../datatypes/version";
import { sequelize } from "../sequelize";

export const EnvironmentNames = sequelize.define(
  "environmentNames",
  {
    namespace: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "The Environment Version's name string can't be empty"
        },
      },
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "The EnvironmentVersion's version string can't be empty"
        },
      },
      unique: true
    },
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
    }
  }
);

EnvironmentNames.belongsTo(EnvironmentNamespaces, {
  foreignKey: { name: "namespace", allowNull: false },
  onDelete: "CASCADE"
});

