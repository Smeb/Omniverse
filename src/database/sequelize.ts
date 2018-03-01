import sequelizeConfig from "./config.js";

import * as Sequelize from "sequelize";

// TODO: Will eventually need to be moved to a migration based scheme

const config = sequelizeConfig[process.env.NODE_ENV];

const { database, username, password, dialect, port } = config;

export const sequelize = new Sequelize(database, username, password, {
  dialect,
  port
})

sequelize.authenticate();

