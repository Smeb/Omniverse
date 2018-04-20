/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { EnvironmentVersions } from "./environmentVersions";

import { versionRegex } from "../datatypes/version";
import { sequelize } from "../sequelize";

export const BundleManifests = sequelize.define(
  "bundleManifests",
  {
    type: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "bundle type cannot be an empty string"
        }
      },
      unique: "versionIdType"
    },
    uri: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "bundle URI cannot be an empty string"
        }
      }
    },
    crc: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "bundle CRC cannot be an empty string"
        }
      }
    },
    hash: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "bundle hash cannot be an empty string"
        }
      }
    }
  },
  {
    validate: {
      typeIsDllOrEnv() {
        if (this.type && (this.type !== "env" && this.type !== "dll")) {
          throw new Error("Bundles can only be of type 'env' or 'dll'");
        }
      }
    }
  }
);

BundleManifests.belongsTo(EnvironmentVersions, {
  foreignKey: { allowNull: false, unique: "versionIdType" },
  onDelete: "CASCADE"
});

EnvironmentVersions.hasMany(BundleManifests);
