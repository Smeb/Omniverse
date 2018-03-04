/* tslint:disable:object-literal-sort-keys */

import { sequelize } from "../sequelize";

import { IDependency } from "./dependency";
import { Key } from "./key";

import * as Sequelize from "sequelize";

export interface IBundleRegistration extends IBundleRecord {
  dependencies: IDependency[];
  signature: string;
}

export interface IBundleRecord {
  name: string;
  hash: string;
  version: string;
}

export const versionRegex = /^(\d{1,3}.){2}\d{1,3}$/;

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

