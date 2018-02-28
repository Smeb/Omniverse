/* tslint:disable:object-literal-sort-keys */

import { sequelize } from "../sequelize";

import { IDependencyPair } from "./dependencies";
import { Key } from "./key";

import * as Sequelize from "sequelize";

export interface IEncryptedBundle {
  name: string;
  message: string;
}

export interface IBundleRegistration {
  name: string;
  hash: string;
  version: string;
  dependencies: IDependencyPair[]
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

Bundle.sync({ force: true }).then(() => {
  return Bundle.create({
    name: "sampleBundle",
    hash: "dummyHash1",
    version: "0.1.1",
    latest: true
  })
  .then(() => {
    return Bundle.create({
      name: "sampleBundle2",
      hash: "dummyHash2",
      version: "0.1.1",
      latest: true
    });
  });
});
