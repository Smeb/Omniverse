import { Request, Response } from "express";

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
  ): Promise<void> {
    const update: IBundleUpdate = request.body;
    await BundleAccess.updateBundle(update).then(result => {
      BundleController.bundleUpdateSuccessResponse(result, response);
    });
  }

  public static async getBundle(request: Request, response: Response) {
    const name = request.get("name");
    const version = request.get("version");

    const environment = await BundleAccess.getBundleWithDependencies(
      name,
      version
    );

    if (environment == null) {
      if (version != null) {
        throw new UserError(bundleVersionNotFound(name, version));
      } else {
        throw new UserError(bundleNotFound(name));
      }
    }

    const environmentManifest = BundleController.prepareEnvironmentJson(
      environment
    );

    response.status(200);
    response.json(environmentManifest);
    response.send();
  }

  private static formatBundle(bundleLocations) {
    return bundleLocations.map(bundleManifest => {
      const { crc, hash, type, uri } = bundleManifest;
      return { crc, hash, type, uri };
    });
  }

  private static prepareEnvironmentJson(environment) {
    const versionManifest = BundleController.prepareVersionManifest(environment);

    const dependencies = environment.dependencies.map(
      BundleController.prepareVersionManifest
    );

    return { ...versionManifest, dependencies };
  }

  private static prepareVersionManifest(environmentVersion) {
    const { name, version, bundleLocations } = environmentVersion;
    const bundles = BundleController.formatBundle(bundleLocations);
    return { name, version, bundles };
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
