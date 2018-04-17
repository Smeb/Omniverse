import * as crypto from "crypto";
import { BaseError, UniqueConstraintError, ValidationError } from "sequelize";

import { Version } from "./datatypes/version";
import { BundleManifests } from "./models/bundleManifests";
import { Dependency, EnvironmentVersions } from "./models/environmentVersions";
import { NamespaceAccess } from "./namespaces";
import { sequelize } from "./sequelize";

import UserError from "../../errors/user";

import {
  IDependency,
  IVersionRegistration,
  IVersionUpdate
} from "../../routes/types";

export async function fromName(name: string) {
  const result = await EnvironmentVersions.findOne({
    raw: true,
    where: { name, latest: "t" }
  });

  if (result == null) {
    return null;
  }

  return result;
}

export async function getVersionWithDependencies(
  name: string,
  version: string
) {
  const queryString = { name, version };
  return EnvironmentVersions.findOne({
    include: [
      {
        as: "dependencies",
        include: [
          {
            attributes: ["crc", "hash", "type", "uri"],
            model: BundleManifests,
            where: {
              type: "dll"
            }
          }
        ],
        model: EnvironmentVersions
      },
      {
        attributes: ["crc", "hash", "type", "uri"],
        model: BundleManifests
      }
    ],
    where: queryString
  });
}

export async function fromNameVersionPair(name: string, version: string) {
  const result = await EnvironmentVersions.findOne({
    raw: true,
    where: { name, version }
  });

  if (result == null) {
    return null;
  }

  return result;
}

export async function registerVersion(registration: IVersionRegistration) {
  await authenticateRegistration(registration);

  const version = new Version(registration);

  if (!version.valid) {
    throw new UserError("Environment version is incorrectly formatted");
  }
  const isLatest = await version.isLatest();

  const dependencyIds = await getDependencyIds(registration);

  if (dependencyIds == null) {
    throw new UserError("Named dependencies were missing in the database");
  }

  return insertVersionTransaction(
    registration,
    isLatest,
    dependencyIds
  );
}

export async function updateVersion(update: IVersionUpdate) {
  this.authenticateUpdate(update);

  const { name, uri, version } = update;

  const environmentVersion = await fromNameVersionPair(name, version);
  if (version) {
    return environmentVersion.updateAttributes({ uri });
  } else {
    throw new UserError(environmentVersionNotFound(name, version));
  }
}

export async function getLatestVersion(name: string) {
  return EnvironmentVersions.findOne({
    where: { latest: true, name }
  });
}

function authenticateUpdate(update: IVersionUpdate) {
  const { name, version, uri, signature } = update;

  const message = name + version + uri;

  return NamespaceAccess.authenticateVersionFromName(
    name,
    message,
    signature
  );
}

function authenticateRegistration(registration: IVersionRegistration) {
  const { name, version, bundles, dependencies, signature } = registration;

  const message =
    name +
    version +
    bundles.map(
      bundle => bundle.type + bundle.uri + bundle.crc + bundle.hash
    ) +
    dependencies.map(dependency => dependency.name + dependency.version);

  return NamespaceAccess.authenticateVersionFromName(
    name,
    message,
    signature
  );
}

async function insertVersionTransaction(
  registration: IVersionRegistration,
  latest: boolean,
  dependencyIds: number[]
) {
  const { name, version, bundles } = registration;
  const namespace = name.split(".")[0];
  const environmentVersion = { namespace, latest, name, version };

  const transaction = await sequelize.transaction();

  try {
    const { id } = await EnvironmentVersions.create(
      {
        ...environmentVersion,
        bundleManifests: bundles
      },
      {
        include: [
          {
            model: BundleManifests
          }
        ],
        transaction
      }
    );

    await Promise.all(
      dependencyIds.map(async dependency => {
        return Dependency.create(
          {
            dependency,
            dependent: id
          },
          { transaction }
        );
      })
    );

    return transaction.commit();
  } catch (e) {
    await transaction.rollback();
    transactionsErrorMap(e, registration);
    throw e;
  }
}

function transactionsErrorMap(
  error: BaseError,
  registration: IVersionRegistration
) {
  // Attempts to map a transaction error to a user error
  const { name, version } = registration;
  const firstError = error.errors[0];

  // Validations can have custom error messages set
  if (error instanceof ValidationError) {
    throw new UserError(firstError.message)
  }

  // Other errors need to be mapped into specific error messages
  if (firstError.instance instanceof EnvironmentVersions) {
    if (error instanceof UniqueConstraintError) {
      throw new UserError(environmentVersionAlreadyExists(name, version));
    }
  } else if (firstError.instance instanceof BundleManifests) {
    if (error instanceof UniqueConstraintError) {
      throw new UserError(duplicateTypesInEnvironment());
    }
  }
}

async function getDependencyIds(registration: IVersionRegistration) {
  const dependencyIdResults = await Promise.all(
    registration.dependencies.map(dependency => {
      const { name, version } = dependency;
      if (!validateDependencyPrefix(registration.name, name)) {
        throw new UserError("Environment dependency names must be prefixes of the environment name");
      }

      return fromNameVersionPair(name, version);
    })
  );

  if (dependencyIdResults.includes(null)) {
    return null;
  }

  // Typecast resolves issue with typescript inference when using promises
  return (dependencyIdResults as any[]).map(result => result.id);
}

function validateDependencyPrefix(environmentName: string, dependencyName: string) {
  const environmentNameArray = environmentName.split(".");
  const dependencyNameArray = dependencyName.split(".");

  if (dependencyNameArray.length >= environmentNameArray.length) {
    return false;
  }

  dependencyNameArray.forEach((word, index) => {
    if (word !== environmentNameArray[index]) {
      return false;
    }
  });

  return true;
}

const duplicateTypesInEnvironment = () =>
  "Environment contained duplicate bundle types of 'env' or 'dll'";

const environmentVersionAlreadyExists = (name, version) =>
  `Environment (${name}, ${version}) already exists in the database`;

const environmentVersionNotFound = (name, version) =>
  `Environment (${name}, ${version}) pair doesn't exist in the database`;
