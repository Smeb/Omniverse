import { Request, Response } from "express";

import { KeyController } from "./key";

import { BundleAccess } from "../database/access/bundles";
import {
  IBundleRecord,
  IBundleRegistration,
  IDependency
} from "../database/access/types";
import UserError from "../errors/user";

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

    if (bundle == null && version != null) {
      throw new UserError(bundleVersionNotFound(name, version));
    } else if (bundle == null) {
      throw new UserError(bundleNotFound(name));
    }

    const dependencies = BundleAccess.bundleDependencies(bundle);
  }

  private static bundleAddSuccessResponse(result, response: Response) {
    response.status(201).send("Bundle version added successfully");
  }
}

const bundleNotFound = name =>
  `Bundle ${name} doesn't exist in the database`

const bundleVersionNotFound = (name, version) =>
  `Bundle (${name}, ${version}) pair doesn't exist in the database`
