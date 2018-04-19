import * as crypto from "crypto";
import { BaseError, UniqueConstraintError, ValidationError } from "sequelize";

import { compareVersions, validateVersion } from "./datatypes/version";
import { BundleManifests } from "./models/bundleManifests";
import { EnvironmentNames } from "./models/environmentNames";
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
  const result = await EnvironmentVersions.findAll({
    include: { model: EnvironmentNames },
    raw: true,
    where: { name }
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
  return EnvironmentVersions.findOne({
    include: [
      {
        attributes: ["name"],
        model: EnvironmentNames,
        where: { name }
      },
      {
        attributes: ["crc", "hash", "type", "uri"],
        model: BundleManifests
      },
      {
        as: "dependencies",
        include: [
          {
            attributes: ["name"],
            model: EnvironmentNames
          },
          {
            attributes: ["crc", "hash", "type", "uri"],
            model: BundleManifests,
            where: {
              "type": "dll"
            }
          }
        ],
        model: EnvironmentVersions
      }
    ],
    where: { version }
  });
}

export function fromNameVersionPair(name: string, version: string) {
  return EnvironmentVersions.findOne({
    include: { model: EnvironmentNames, where: { name } },
    raw: true,
    where: { version }
  });
}

export async function registerVersion(registration: IVersionRegistration) {
  const namespace = await authenticateRegistration(registration);


  if (!validateVersion(registration.version)) {
    throw new UserError("Environment version is incorrectly formatted");
  }

  const dependencyIds = await getDependencyIds(registration);

  if (dependencyIds == null) {
    throw new UserError("Named dependencies were missing in the database");
  }

  return insertVersionTransaction(registration, namespace, dependencyIds);
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

function authenticateUpdate(update: IVersionUpdate) {
  const { name, version, uri, signature } = update;

  const message = name + version + uri;

  return NamespaceAccess.authenticateVersionFromName(name, message, signature);
}

function authenticateRegistration(registration: IVersionRegistration) {
  const { name, version, bundles, dependencies, signature } = registration;

  const bundleString = bundles
    .map(bundle => bundle.type + bundle.uri + bundle.crc + bundle.hash)
    .join("");

  const dependencyString = dependencies
    .map(dependency => dependency.name + dependency.version)
    .join("");
  const message = name + version + bundleString + dependencyString;

  return NamespaceAccess.authenticateVersionFromName(name, message, signature);
}

async function insertVersionTransaction(
  registration: IVersionRegistration,
  namespace: string,
  dependencyIds: number[]
) {
  const { name, version, bundles } = registration;

  let nameResult = await EnvironmentNames.findOne({ where: { name } });

  const transaction = await sequelize.transaction();

  try {
    if (nameResult == null) {
      nameResult = await EnvironmentNames.create({ name, namespace }, transaction);
    }

    const environmentVersion = { environmentNameId: nameResult.id, version };

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
    transaction.rollback();
    if (e.errors) {
      transactionsErrorMap(e, registration);
    }
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
    if (error.errors.length === 2) {
      // Custom validators on indexes aren't allowed, so we set a custom message
      throw new UserError(`(${name}, ${version}) pair already exists in the database`);
    } else {
      throw new UserError(firstError.message);
    }
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
        throw new UserError(
          "Environment dependency names must be prefixes of the environment name"
        );
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

function validateDependencyPrefix(
  environmentName: string,
  dependencyName: string
) {
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
