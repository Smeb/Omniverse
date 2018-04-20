import * as sequelizeConfig from "../config";

import * as Sequelize from "sequelize";

const config = sequelizeConfig[process.env.NODE_ENV];

const { database, username, password, dialect, port } = config;

export const sequelize = new Sequelize(database, username, password, {
  dialect,
  port
})

sequelize.authenticate();

