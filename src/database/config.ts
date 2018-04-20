/* tslint:disable:object-literal-sort-keys */
import * as fs from "fs";

module.exports = {
  development: {
    username: "postgres",
    password: null,
    database: "omniverse_development",
    host: "127.0.0.1",
    port: 5432,
    dialect: "postgres"
  },
  test: {
    username: "postgres",
    password: null,
    database: "omniverse_test",
    host: "127.0.0.1",
    port: 5432,
    dialect: "postgres"
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT,
    dialect: "postgres"
  }
};
