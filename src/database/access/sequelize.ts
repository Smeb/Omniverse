import * as sequelizeConfig from "../config";
import { serverPublicKey } from "./datatypes/server_key";


import * as Sequelize from "sequelize";


const config = sequelizeConfig[process.env.NODE_ENV];

const { database, username, password } = config;

export const sequelize = new Sequelize(database, username, password, config)

sequelize.authenticate()
  .catch(err => {
    throw new Error(`Couldn't connect to database on ${config.host}:${config.port}`)
  });

