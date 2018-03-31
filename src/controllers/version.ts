import { Request, Response } from "express";

import {
  IBundleRecord,
  IBundleRegistration,
  IBundleUpdate,
  IDependency
} from "../database/access/types";
import { VersionAccess } from "../database/access/versions";
import UserError from "../errors/user";

export class VersionController {
  public static async register(
    request: Request,
    response: Response
  ): Promise<void> {
    const registration: IBundleRegistration = request.body;
    await VersionAccess.registerBundle(registration).then(result =>
      VersionController.versionAddSuccessResponse(result, response)
    );
  }

  public static async update(
    request: Request,
    response: Response
  ): Promise<void> {
    const update: IBundleUpdate = request.body;
    await VersionAccess.updateBundle(update).then(result => {
      VersionController.versionUpdateSuccessResponse(result, response);
    });
  }

  public static async getBundle(request: Request, response: Response) {
    const name = request.get("name");
    const version = request.get("version");

    const environment = await VersionAccess.getVersionWithDependencies(
      name,
      version
    );

    if (environment == null) {
      if (version != null) {
        throw new UserError(environmentVersionNotFound(name, version));
      } else {
        throw new UserError(environmentNotFound(name));
      }
    }

    const environmentManifest = VersionController.prepareEnvironmentJson(
      environment
    );

    response.status(200);
    response.json(environmentManifest);
    response.send();
  }

  private static formatBundle(bundleManifests) {
    return bundleManifests.map(manifest => {
      const { crc, hash, type, uri } = manifest;
      return { crc, hash, type, uri };
    });
  }

  private static prepareEnvironmentJson(environment) {
    const versionManifest = VersionController.prepareVersionManifest(environment);

    const dependencies = environment.dependencies.map(
      VersionController.prepareVersionManifest
    );

    return { ...versionManifest, dependencies };
  }

  private static prepareVersionManifest(environmentVersion) {
    const { name, version, bundleManifests } = environmentVersion;
    const bundles = VersionController.formatBundle(bundleManifests);
    return { name, version, bundles };
  }

  private static versionAddSuccessResponse(result, response: Response) {
    response.status(201).send("Bundle version added successfully");
  }

  private static versionUpdateSuccessResponse(result, response: Response) {
    throw new UserError("Not implemented - response");
  }
}

const environmentNotFound = name => `Environment ${name} doesn't exist in the database`;

const environmentVersionNotFound = (name, version) =>
  `Environment (${name}, ${version}) pair doesn't exist in the database`;
