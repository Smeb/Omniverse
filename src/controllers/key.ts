import { IKeyRegistration, Key } from "../database/models/key";

import { Response } from "express";
import sequelize from "sequelize";

export class KeyController {
  public static async RegisterKey(registration: IKeyRegistration, response: Response) : Promise<void> {
    Key.create(registration)
      .then(result => this.KeyAddSuccess(result, response))
      .catch(err => this.KeyAddFailed(err, response));
  }

  public static GetKey(bundleName: string) {
    return Key.findOne({ where: { name: bundleName }});
  }

  private static KeyAddSuccess(result, response: Response) {
    response.status(201).send("Bundle name and key registered.");
  }

  private static KeyAddFailed(err, response: Response) {
    if (err instanceof sequelize.UniqueConstraintError) {
      response.status(403).send("Error: " + err.errors.map(
        error => error.message
      ));
    } else {
      response.status(403).send("Couldn't insert key into database");
    }
  }
}
