import * as Sequelize from "sequelize";
import { sequelize } from "../sequelize";
import { Key } from "./key";

export const Bundle = sequelize.define("bundleVersions", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
    references: {
      model: Key,
      key: "name",
      deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
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
        args: /^(\d{1,3}.){2}\d{1,3}$/,
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
    name: "bundleName",
    hash: "dummyHash",
    version: "0.1.1",
    latest: false
  });
});
