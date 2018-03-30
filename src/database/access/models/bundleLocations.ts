/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { BundleVersions } from "./bundleVersions";

import { versionRegex } from "../datatypes/version";
import { sequelize } from "../sequelize";

export const BundleLocations = sequelize.define(
  "bundleLocations",
  {
    type: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    uri: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    crc: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    hash: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    }
  },
  {
    validate: {
      typeIsDllOrEnv() {
        if (this.type && (this.type !== "env" && this.type !== "dll")) {
          throw new Error("Bundles can only contain environment or dll values");
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ["bundleVersionId", "type"]
      }
    ]
  }
);

BundleLocations.belongsTo(BundleVersions, {
  foreignKey: { allowNull: false },
  onDelete: "CASCADE"
});

BundleVersions.hasMany(BundleLocations);
