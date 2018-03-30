import * as crypto from "crypto";
import { UniqueConstraintError, ValidationError } from "sequelize";

import UserError from "../../errors/user";

import { Version } from "./datatypes/version";
import { KeyAccess } from "./keys";
import { BundleLocations } from "./models/bundleLocations";
import { BundleVersions } from "./models/bundleVersions";
import { Dependency } from "./models/dependency";
import { sequelize } from "./sequelize";
import {
  IBundleRecord,
  IBundleRegistration,
  IBundleUpdate,
  IDependency
} from "./types";

export class BundleAccess {
  public static async fromName(name: string) {
    const result = await BundleVersions.findOne({
      raw: true,
      where: { name, latest: "t" }
    });

    if (result == null) {
      return null;
    }

    return result;
  }

  public static async getBundleWithDependencies(name: string, version: string = null) {
    const queryString = (version !=  null) ? { name, version }: { name };
    const result = await BundleVersions.findOne({
      include: [{
        as: "dependencies",
        include: [{
          model: BundleLocations,
          where: {
            type: "dll"
          }
        }],
        model: BundleVersions
      }],
      where: queryString
    })
  }

  public static async fromNameVersionPair(name: string, version: string) {
    const result = await BundleVersions.findOne({
      raw: true,
      where: { name, version }
    });

    if (result == null) {
      return null;
    }

    return result;
  }

  public static async registerBundle(registration: IBundleRegistration) {
    await BundleAccess.authenticateRegistration(registration);

    const version = new Version(registration);

    if (!version.valid) {
      throw new UserError("Bundle version is incorrectly formatted");
    }
    const isLatest = await version.isLatest();

    const dependencyIds = await BundleAccess.getDependencyIds(
      registration.dependencies
    );

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
      throw new UserError(bundleVersionNotFound(name, version));
    }
  }

  public static getLatestVersion(bundleName: string) {
    return BundleVersions.findOne({
      where: {
        latest: true,
        name: bundleName
      }
    });
  }

  private static authenticateUpdate(update: IBundleUpdate) {
    const { name, version, uri, signature } = update;

    const message = name + version + uri;

    return KeyAccess.authenticateBundleFromName(name, message, signature);
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

    return KeyAccess.authenticateBundleFromName(name, message, signature);
  }

  private static async insertBundleTransaction(
    registration: IBundleRegistration,
    latest: boolean,
    dependencyIds: number[]
  ) {
    const { name, version, bundles } = registration;
    const bundleNamespace = name.split(".")[0];

    const transaction = await sequelize.transaction();

    try {
      let bundleVersionId;
      try {
        const result = await BundleVersions.create(
          { bundleNamespace, latest, name, version },
          { transaction }
        );

        bundleVersionId = result.id;
      } catch (e) {
        if (e instanceof UniqueConstraintError) {
          throw new UserError(bundleVersionAlreadyExists(name, version));
        }
        throw e;
      }

      try {
        await Promise.all(
          bundles.map(async bundle => {
            return BundleLocations.create(
              { ...bundle, bundleVersionId },
              { transaction }
            );
          })
        );
      } catch (e) {
        if (e instanceof UniqueConstraintError) {
          throw new UserError(duplicateTypesInBundle());
        }
        throw e;
      }

      try {
        await Promise.all(
          dependencyIds.map(async dependency => {
            return Dependency.create(
              {
                dependency,
                dependent: bundleVersionId
              },
              { transaction }
            );
          })
        );
      } catch (e) {
        throw e;
      }
      return transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  private static setOtherBundleVersionsToFalse(
    name: string,
    version: string,
    transaction
  ) {
    return BundleVersions.update(
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

  private static async getDependencyIds(dependencies: IDependency[]) {
    const dependencyIdResults = await Promise.all(
      dependencies.map(dependency => {
        const { name, version } = dependency;
        return BundleAccess.fromNameVersionPair(name, version);
      })
    );

    if (dependencyIdResults.includes(null)) {
      return null;
    }

    // Typecast resolves issue with typescript inference when using promises
    return (dependencyIdResults as any[]).map(result => result.id);
  }
}

const duplicateTypesInBundle = () =>
  "Bundle contained duplicate types of 'env' or 'dll'"

const bundleVersionAlreadyExists = (name, version) =>
  `Bundle (${name}, ${version}) already exists in the database`;

const bundleVersionNotFound = (name, version) =>
  `Bundle (${name}, ${version}) pair doesn't exist in the database`;
