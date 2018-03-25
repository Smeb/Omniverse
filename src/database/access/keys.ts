import * as SequelizeLib from "sequelize";

import { Key } from "./models/key";
import { IKeyRegistration } from "./types";

import { sequelize } from "./sequelize";

export class KeyAccess {
  public static async getKey(bundleName: string) {
    const query = await Key.findOne({ where: { name: bundleName } });

    if (query == null) {
      return null;
    }

    return query.dataValues.key;
  }

  public static async create(registration: IKeyRegistration) {
    // TODO: Add authentication logic to test against server admin key
    return Key.create(registration);
  }
}

