/* tslint:disable:object-literal-sort-keys */
import * as fs from "fs";

const errorMessages = [];
if (process.env.DATABASE_USERNAME === undefined) {
  errorMessages.push("Environment variable \"DATABASE_USERNAME\" is undefined");
}

if (process.env.DATABASE_PASSWORD === undefined) {
  errorMessages.push("Environment variable \"DATABASE_PASSWORD\" is undefined");
}

if (process.env.DATABASE_HOSTNAME === undefined) {
  errorMessages.push("Environment variable \"DATABASE_HOSTNAME\" is undefined");
}

if (process.env.DATABASE_PORT === undefined) {
  errorMessages.push("Environment variable \"DATABASE_PORT\" is undefined");
}

if (errorMessages.length > 0) {
  throw new Error(errorMessages.join(", "));
}

module.exports = {
  development: {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: "omniverse_development",
    host: process.env.DATABASE_HOSTNAME,
    port: process.env.DATABASE_PORT,
    dialect: "postgres"
  },
  test: {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: "omniverse_test",
    host: process.env.DATABASE_HOSTNAME,
    port: process.env.DATABASE_PORT,
    dialect: "postgres"
  },
  production: {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: "omniverse_production",
    host: process.env.DATABASE_HOSTNAME,
    port: process.env.DATABASE_PORT,
    dialect: "postgres"
  }
};
