import { KeyAccess } from "../database/access/keys";
import { IKeyRegistration } from "../database/access/types";

import * as crypto from "crypto";
import { Request, Response } from "express";
import sequelize from "sequelize";

export class KeyController {
  public static async registerKey(registration: IKeyRegistration, response: Response) : Promise<void> {
    await KeyAccess.create(registration)
      .then(result => this.keyAddSuccessResponse(result, response))
      .catch(err => this.keyAddFailedResponse(err, response));
  }

  public static async decodeAndVerifyKey(request: Request, response: Response) {
    // Decode the key from base64, check the format is .pem, then alter the request to use the decoded key

    const key = Buffer.from(request.body.key, "base64").toString();

    try {
      crypto.publicEncrypt(key, Buffer.from("Test"));
    } catch (e) {
      this.keyFormatIncorrectResponse(response);
    }

    request.body.key = key;
  }

  private static keyAddSuccessResponse(result, response: Response) {
    response.status(201).send("Bundle name and key registered.");
  }

  private static keyAddFailedResponse(err, response: Response) {
    if (err instanceof sequelize.UniqueConstraintError) {
      response.status(403).send("Error: " + err.errors.map(
        error => error.message
      ));
    } else {
      response.status(403).send("Couldn't insert key into database");
    }
  }

  private static keyFormatIncorrectResponse(response: Response) {
    response.status(403).send("Decoded key wasn't in .PEM format");
  }
}
