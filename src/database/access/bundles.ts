import * as crypto from "crypto";
import { UniqueConstraintError, ValidationError } from "sequelize";

import UserError from "../../errors/user";

import { Version } from "./datatypes/version";
import { KeyAccess } from "./keys";
import { Bundle } from "./models/bundle";
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
    const result = await Bundle.findOne({
      raw: true,
      where: { name, latest: "t" }
    });

    if (result == null) {
      return null;
    }

    return result;
  }

  public static async fromNameVersionPair(name: string, version: string) {
    const result = await Bundle.findOne({
      raw: true,
      where: { name, version }
    });

    if (result == null) {
      return null;
    }

    return result;
  }

  public static async bundleDependencies(bundle: IBundleRecord) {
    const dependencyIds = [];
    let nextId = bundle.id;
    let query;
    do {
      query = await Dependency.findOne({
        attributes: ["dependency"],
        where: { dependent: nextId }
      });

      if (query === null) {
        break;
      }

      nextId = query.dependency;
      dependencyIds.push(nextId);
    } while (nextId);

    const dependencyQueries = await Promise.all(
      dependencyIds.map(async id => {
        return Bundle.findOne({
          where: { id }
        });
      })
    );

    return dependencyQueries.map(q => q.dataValues);
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

    await sequelize
      .transaction(transaction =>
        BundleAccess.insertBundleTransaction(
          registration,
          isLatest,
          dependencyIds,
          transaction
        )
      )
      .catch(UniqueConstraintError, err => {
        const { name } = registration;
        throw new UserError(
          `Bundle (${name}, ${version.toString()}) already exists`
        );
      });

    return;
  }

  public static async updateBundle(update: IBundleUpdate) {
    this.authenticateUpdate(update);

    const { name, uri, version } = update;

    const bundleVersion = await this.fromNameVersionPair(name, version)
    if (bundleVersion) {
      return bundleVersion.updateAttributes({ uri });
    } else {
      throw new UserError(bundleVersionNotFound(name, version));
    }
  }

  public static getLatestVersion(bundleName: string) {
    return Bundle.findOne({
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
    const { name, version, uri, dependencies, signature } = registration;

    const message =
      name +
      version +
      uri +
      dependencies.map(dependency => dependency.name + dependency.version);

    return KeyAccess.authenticateBundleFromName(name, message, signature);
  }

  private static insertBundleTransaction(
    registration: IBundleRegistration,
    isLatest: boolean,
    dependencyIds: number[],
    transaction
  ) {
    const { name, version, uri } = registration;
    const bundleNamespace = name.split(".")[0];

    return Bundle.create(
      {
        bundleNamespace,
        latest: isLatest,
        name,
        uri,
        version
      },
      { transaction }
    )
      .then(bundle => {
        const dependentBundleId = bundle.get("id");

        return Promise.all(
          dependencyIds.map(dependencyId => {
            return Dependency.create(
              {
                dependency: dependencyId,
                dependent: dependentBundleId
              },
              { transaction }
            );
          })
        );
      })
      .then(() => {
        if (isLatest) {
          return BundleAccess.setOtherBundleVersionsToFalse(
            name,
            version,
            transaction
          );
        }
      });
  }

  private static async getBundleDependencyChain(id) {
    const dependencyInformation = await Dependency.find({
      where: { dependent: id }
    });

    if (dependencyInformation == null) {
      return [];
    }

    const { dependency } = dependencyInformation.dataValues;

    return [dependency, ...BundleAccess.getBundleDependencyChain(dependency)];
  }

  private static setOtherBundleVersionsToFalse(
    name: string,
    version: string,
    transaction
  ) {
    return Bundle.update(
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

const bundleVersionNotFound = (name, version) =>
  `Bundle (${name}, ${version}) pair doesn't exist in the database`;
