import { Request, Response } from "express";

import { KeyController } from "./key";

import { BundleAccess } from "../database/access/bundles";
import {
  IBundleRecord,
  IBundleRegistration,
  IBundleUpdate,
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

  public static async update(
    request: Request,
    response: Response
  ): Promise<void>  {
    const update: IBundleUpdate = request.body;
    await BundleAccess.updateBundle(update).then(result => {
      BundleController.bundleUpdateSuccessResponse(result, response);
    });
  }

  public static async getBundle(request: Request, response: Response) {
    const name = request.get("name");
    const version = request.get("version");

    const bundle =
      version === undefined
        ? await BundleAccess.fromName(name)
        : await BundleAccess.fromNameVersionPair(name, version);

    if (bundle == null && version != null) {
      throw new UserError(bundleVersionNotFound(name, version));
    } else if (bundle == null) {
      throw new UserError(bundleNotFound(name));
    }

    /*
    const loadOrder = [bundle, ...dependencies].map(item => {
      const { name, version } = item;
      return { name, version };
    });

    response.status(200);
    response.json (loadOrder);
    response.send();
    */
  }

  private static bundleAddSuccessResponse(result, response: Response) {
    response.status(201).send("Bundle version added successfully");
  }

  private static bundleUpdateSuccessResponse(result, response: Response) {
    throw new UserError("Not implemented - response");
  }
}

const bundleNotFound = name => `Bundle ${name} doesn't exist in the database`;

const bundleVersionNotFound = (name, version) =>
  `Bundle (${name}, ${version}) pair doesn't exist in the database`;
