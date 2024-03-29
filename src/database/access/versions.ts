import * as crypto from "crypto";
import { BaseError, UniqueConstraintError, ValidationError } from "sequelize";

import { compareVersions, validateVersion } from "./datatypes/version";
import { BundleManifests } from "./models/bundleManifests";
import { EnvironmentNames } from "./models/environmentNames";
import { Dependency, EnvironmentVersions } from "./models/environmentVersions";
import { authenticateVersionFromName } from "./namespaces";
import { sequelize } from "./sequelize";

import UserError from "../../errors/user";

import {
  IDependency,
  IVersionRegistration,
  IVersionUpdate
} from "../../routes/types";

export async function getVersions() {
  const nameResults = await EnvironmentNames.findAll();

  const versionsListing = await nameResults.reduce(async (arrPromise, nameResult) => {
    const arr = await arrPromise;

    const { name } = nameResult;

    const versionsQueryResults = await EnvironmentVersions.findAll({
      attribute: ["version"],
      include: {
        model: EnvironmentNames,
        where: { name }
      }
    });

    const versions = versionsQueryResults.map(result => result.version);

    arr.push({ name, versions });
    return arr;
  }, Promise.resolve([]));

  return versionsListing;
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

export async function registerVersion(registration: IVersionRegistration) {
  const namespace = await authenticateRegistration(registration);

  const { version } = registration;

  if (!validateVersion(version)) {
    throw new UserError(`Environment version '${version}' is incorrectly formatted, should be x.x.x`);
  }

  const dependencyIds = await getDependencyIds(registration);

  if (dependencyIds == null) {
    throw new UserError("Named dependencies were missing in the database");
  }

  return insertVersionTransaction(registration, namespace, dependencyIds);
}

function fromNameVersionPair(name: string, version: string) {
  return EnvironmentVersions.findOne({
    include: { model: EnvironmentNames, where: { name } },
    raw: true,
    where: { version }
  });
}

function authenticateUpdate(update: IVersionUpdate) {
  const { name, version, uri, signature } = update;

  const message = name + version + uri;

  return authenticateVersionFromName(name, message, signature);
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

  return authenticateVersionFromName(name, message, signature);
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
      // Custom validators on indexes aren't allowed, so have to set a custom message
      if (firstError.instance instanceof BundleManifests) {
        throw new UserError(duplicateTypesInEnvironment());
      } else {
        throw new UserError(environmentVersionAlreadyExists(name, version));
      }
    } else {
      throw new UserError(firstError.message);
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

  for (let i = 0; i < dependencyNameArray.length; i++) {
    if (dependencyNameArray[i] !== environmentNameArray[i]) {
      return false;
    }
  }

  return true;
}

const duplicateTypesInEnvironment = () =>
  "Environment contained duplicate bundle types of 'env' or 'dll'";

const environmentVersionAlreadyExists = (name, version) =>
  `Environment (${name}, ${version}) already exists in the database`;

const environmentVersionNotFound = (name, version) =>
  `Environment (${name}, ${version}) pair doesn't exist in the database`;
