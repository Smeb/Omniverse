import { create } from "../database/access/namespaces";
import { INamespaceRegistration } from "../routes/types";

import { Request, Response } from "express";
import sequelize from "sequelize";

export async function registerNamespace(
  request: Request,
  response: Response
): Promise<void> {
  const registration: INamespaceRegistration = request.body;
  await create(registration).then(result =>
    keyAddSuccessResponse(result, response)
  );
}

function keyAddSuccessResponse(result: string, response: Response) {
  response.status(201);
  response.json(`Environment namespace ${result} registered.`);
}
