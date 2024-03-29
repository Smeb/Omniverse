import { Request, Response } from "express";

import { validateVersion } from "../database/access/datatypes/version";
import * as VersionAccess from "../database/access/versions";
import UserError from "../errors/user";
import {
  IBundleManifest,
  IDependency,
  IVersionRegistration,
  IVersionUpdate
} from "../routes/types";

export async function registerVersion(
  request: Request,
  response: Response
): Promise<void> {
  const registration: IVersionRegistration = request.body;
  await VersionAccess.registerVersion(registration).then(result =>
    versionAddSuccessResponse(registration, response)
  );
}

export async function getVersion(request: Request, response: Response) {
  const name = request.get("name");
  const version = request.get("version");

  if (name === undefined || version === undefined) {
    throw new UserError("Request needs to contain name and version parameters");
  }

  if (!validateVersion(version)) {
    throw new UserError(
      `Version ${version} is not a valid version of the form x.x.x`
    );
  }

  const environment = await VersionAccess.getVersionWithDependencies(
    name,
    version
  );

  if (environment == null) {
    throw new UserError(environmentVersionNotFound(name, version));
  }

  const environmentManifest = prepareEnvironmentJson(environment);

  response.status(200);
  response.json(environmentManifest);
  response.send();
}

export async function getVersions(request: Request, response: Response) {
  const versions = await VersionAccess.getVersions();

  response.status(200);
  response.json(versions);
  response.send();
}

function prepareEnvironmentJson(environment) {
  const versionManifest = prepareVersionManifest(environment);

  const dependencies = environment.dependencies.map(prepareVersionManifest);

  return { ...versionManifest, dependencies };
}

function prepareVersionManifest(environmentVersion) {
  const { name } = environmentVersion.environmentName;
  const { version, bundleManifests } = environmentVersion;
  const bundles = formatManifests(bundleManifests);
  return { name, version, bundles };
}

function formatManifests(bundleManifests: IBundleManifest[]) {
  return bundleManifests.map(manifest => {
    const { crc, hash, type, uri } = manifest;
    return { crc, hash, type, uri };
  });
}

function versionAddSuccessResponse(registration, response: Response) {
  response.status(201);
  response.json(
    `Environment (${registration.name}, ${ registration.version }) added successfully`
  );
  response.send();
}

const environmentVersionNotFound = (name, version) =>
  `Environment (${name}, ${version}) doesn't exist in the database`;
