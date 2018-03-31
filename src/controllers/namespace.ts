import { NamespacesAccess } from "../database/access/namespaces";
import { INamespaceRegistration } from "../routes/types";

import { Request, Response } from "express";
import sequelize from "sequelize";

export class NamespaceController {
  public static async registerNamespace(
    request: Request,
    response: Response
) : Promise<void> {
    const registration: INamespaceRegistration = request.body;
    await NamespacesAccess.create(registration)
      .then(result => NamespaceController.keyAddSuccessResponse(result, response));
  }

  private static keyAddSuccessResponse(result: string, response: Response) {
    response.status(201).send(`Environment namespace ${result} registered.`);
  }
}
