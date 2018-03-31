import * as crypto from "crypto";
import { BaseError, UniqueConstraintError, ValidationError } from "sequelize";

import UserError from "../../errors/user";

import { Version } from "./datatypes/version";
import { BundleManifests } from "./models/bundleManifests";
import { Dependency, EnvironmentVersions } from "./models/environmentVersions";
import { NamespacesAccess } from "./namespaces";
import { sequelize } from "./sequelize";
import {
  IBundleRecord,
  IBundleRegistration,
  IBundleUpdate,
  IDependency
} from "./types";

export class BundleAccess {
  public static async fromName(name: string) {
    const result = await EnvironmentVersions.findOne({
      raw: true,
      where: { name, latest: "t" }
    });

    if (result == null) {
      return null;
    }

    return result;
  }

  public static async getBundleWithDependencies(
    name: string,
    version: string = null
  ) {
    const queryString = version != null ? { name, version } : { name };
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

  public static async fromNameVersionPair(name: string, version: string) {
    const result = await EnvironmentVersions.findOne({
      raw: true,
      where: { name, version }
    });

    if (result == null) {
      return null;
    }

    return result;
  }

  public static async registerBundle(registration: IBundleRegistration) {
    // await BundleAccess.authenticateRegistration(registration);

    const version = new Version(registration);

    if (!version.valid) {
      throw new UserError("Bundle version is incorrectly formatted");
    }
    const isLatest = await version.isLatest();

    const dependencyIds = await BundleAccess.getDependencyIds(registration);

    if (dependencyIds == null) {
      throw new UserError("Named dependencies were missing in the database");
    }

    return BundleAccess.insertBundleTransaction(
      registration,
      isLatest,
      dependencyIds
    );
  }

  public static async updateBundle(update: IBundleUpdate) {
    this.authenticateUpdate(update);

    const { name, uri, version } = update;

    const bundleVersion = await this.fromNameVersionPair(name, version);
    if (bundleVersion) {
      return bundleVersion.updateAttributes({ uri });
    } else {
      throw new UserError(environmentVersionNotFound(name, version));
    }
  }

  public static getLatestVersion(bundleName: string) {
    return EnvironmentVersions.findOne({
      where: {
        latest: true,
        name: bundleName
      }
    });
  }

  private static authenticateUpdate(update: IBundleUpdate) {
    const { name, version, uri, signature } = update;

    const message = name + version + uri;

    return NamespacesAccess.authenticateBundleFromName(
      name,
      message,
      signature
    );
  }

  private static authenticateRegistration(registration: IBundleRegistration) {
    const { name, version, bundles, dependencies, signature } = registration;

    const message =
      name +
      version +
      bundles.map(
        bundle => bundle.type + bundle.uri + bundle.crc + bundle.hash
      ) +
      dependencies.map(dependency => dependency.name + dependency.version);

    return NamespacesAccess.authenticateBundleFromName(
      name,
      message,
      signature
    );
  }

  private static async insertBundleTransaction(
    registration: IBundleRegistration,
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
          bundleLocations: bundles
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
      BundleAccess.transactionsErrorMapper(e, registration);
      throw e;
    }
  }

  private static transactionsErrorMapper(
    error: BaseError,
    registration: IBundleRegistration
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

  private static setOtherEnvironmentVersionsToFalse(
    name: string,
    version: string,
    transaction
  ) {
    return EnvironmentVersions.update(
      {
        latest: false
      },
      {
        fields: ["latest"],
        transaction,
        where: {
          latest: true,
          name,
          version: {
            [sequelize.Op.ne]: version
          }
        }
      }
    );
  }

  private static async getDependencyIds(registration: IBundleRegistration) {
    const dependencyIdResults = await Promise.all(
      registration.dependencies.map(dependency => {
        const { name, version } = dependency;
        if (!BundleAccess.validateDependencyPrefix(registration.name, name)) {
          throw new UserError("Environment dependency names must be prefixes of the environment name");
        }

        return BundleAccess.fromNameVersionPair(name, version);
      })
    );

    if (dependencyIdResults.includes(null)) {
      return null;
    }

    // Typecast resolves issue with typescript inference when using promises
    return (dependencyIdResults as any[]).map(result => result.id);
  }

  private static validateDependencyPrefix(environmentName: string, dependencyName: string) {
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
}

const duplicateTypesInEnvironment = () =>
  "Environment contained duplicate bundle types of 'env' or 'dll'";

const environmentVersionAlreadyExists = (name, version) =>
  `Environment (${name}, ${version}) already exists in the database`;

const environmentVersionNotFound = (name, version) =>
  `Environment (${name}, ${version}) pair doesn't exist in the database`;
