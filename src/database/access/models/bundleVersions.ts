/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { Key } from "./key";

import { versionRegex } from "../datatypes/version";
import { sequelize } from "../sequelize";

export const BundleVersions = sequelize.define(
  "bundleVersions",
  {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    version: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        is: {
          args: versionRegex,
          msg:
            "Version number must be a sequence of three '.' separated digits 0-999 (e.g 1.12.132)"
        }
      }
    },
    latest: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    }
  },
  {
    validate: {
      namespaceIsPrefix() {
        if (
          this.name &&
          this.bundleNamespace &&
          !this.name.startsWith(this.bundleNamespace)
        ) {
          throw new Error("Bundle namespace should be a prefix of bundle name");
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ["name", "version"]
      },
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

BundleVersions.belongsTo(Key, {
  foreignKey: { name: "bundleNamespace", allowNull: false },
  onDelete: "CASCADE"
});
