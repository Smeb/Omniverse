import { BundleAccess } from "../database/access/bundles";

import {
  IBundleRecord,
  IBundleRegistration,
  IDependency
} from "../database/access/types";

import { KeyController } from "./key";

import { Request, Response } from "express";

export class BundleController {
  public static async register(
    request: Request,
    response: Response
  ): Promise<void> {
    const registration: IBundleRegistration = request.body;
    await BundleAccess.registerBundle(registration).then(result =>
      BundleController.bundleAddSuccessResponse(result, response)
    );
  }

  public static async getBundle(request: Request, response: Response) {
    const name = request.get("name");
    const version = request.get("version");

    const bundle = await BundleAccess.fromNameVersionPair(name, version);

    if (bundle == null) {
      return BundleController.getBundleFailResponse(response);
    }

    const dependencies = BundleAccess.bundleDependencies(bundle);
  }

  private static getBundleFailResponse(response: Response) {
    response.status(403).send(errors.versionNotFound);
  }

  private static notRegisteredErrorResponse(response: Response) {
    response.status(403).send(errors.notRegistered);
  }

  private static invalidSignatureResponse(response: Response) {
    response.status(403).send(errors.invalidSignature);
  }

  private static bundleAddSuccessResponse(result, response: Response) {
    response.status(201).send("Bundle version added successfully");
  }

  private static bundleAddFailResponse(err, response: Response) {
    /*
    if (err instanceof sequelize.UniqueConstraintError) {
      response
        .status(403)
        .send("Error: " + err.errors.map(error => error.message));
    } else {
      response.status(403).send(`Bundle version add failed: ${err.message}`);
    }
    */
  }
}

const errors = {
  invalidSignature: "Signature didn't match sent message",
  notRegistered: "Named bundle doesn't exist in database",
  versionMalformed:
    "Malformed version number. Version number should be xxx.xxx.xxx, x = [0, 9]",
  versionNotFound: "Bundle (name, version) pair doesn't exist in database"
};
