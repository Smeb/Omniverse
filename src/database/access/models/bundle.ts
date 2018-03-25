/* tslint:disable:object-literal-sort-keys */
import * as Sequelize from "sequelize";

import { Key } from "./key";

import { versionRegex } from "../datatypes/version";

import { sequelize } from "../sequelize";

export const Bundle = sequelize.define("bundleVersions", {
  name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    },
    references: {
      model: Key,
      key: "name"
    }
  },
  hash: {
    type: Sequelize.STRING,
    unique: true,
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
        msg: "Version number must be a sequence of three '.' separated digits 0-999 (e.g 1.12.132)"
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
    },
  ]
});
