import { KeyAccess } from "../database/access/keys";
import { IKeyRegistration } from "../database/access/types";

import { Request, Response } from "express";
import sequelize from "sequelize";

export class KeyController {
  public static async registerKey(
    request: Request,
    response: Response
) : Promise<void> {
    const registration: IKeyRegistration = request.body;
    await KeyAccess.create(registration)
      .then(result => KeyController.keyAddSuccessResponse(result, response));
  }

  private static keyAddSuccessResponse(result, response: Response) {
    response.status(201).send(`Bundle name ${result} registered.`);
  }
}
