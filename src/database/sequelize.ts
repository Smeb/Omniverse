import * as Sequelize from "sequelize";
import pg from "pg";

// TODO: Move to environment variables
const db = "omniverse";
const username = "postgres";
const password = "";
const host = "localhost";

export const sequelize = new Sequelize(db, username, password, {
  dialect: "postgres",
  port: 5432
});

sequelize.authenticate();
