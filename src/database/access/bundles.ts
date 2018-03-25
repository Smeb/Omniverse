import * as crypto from "crypto";
import { UniqueConstraintError } from "sequelize";

import ExpectedError from "../../errors/expected";

import { Version } from "./datatypes/version";
import { KeyAccess } from "./keys";
import { Bundle } from "./models/bundle";
import { Dependency } from "./models/dependency";
import { sequelize } from "./sequelize";
import { IBundleRegistration, IDependency } from "./types";

export class BundleAccess {
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

  public static bundleDependencies(bundle) {
    throw new Error("NotImplementedException");
  }

  public static async registerBundle(registration: IBundleRegistration) {
    const authenticated = await BundleAccess.authenticate(registration);

    if (authenticated === false) {
      throw new Error("Authentication failed");
    }

    const version = new Version(registration);

    if (!version.valid) {
      throw new Error("Bundle version is incorrectly formatted");
    }
    const isLatest = await version.isLatest();

    const dependencyIds = await BundleAccess.getDependencyIds(
      registration.dependencies
    );

    if (dependencyIds == null) {
      throw new Error("Named dependencies were missing in the database");
    }

    await sequelize.transaction(transaction =>
      BundleAccess.insertBundleTransaction(
        registration,
        isLatest,
        dependencyIds,
        transaction
      )
    ).catch(UniqueConstraintError, err => {
      const { name, version } = registration;
      throw new ExpectedError(`Bundle (${name}, ${version}) already exists`);
    });

    return;
  }

  public static getLatestVersion(bundleName: string) {
    return Bundle.findOne({
      where: {
        latest: true,
        name: bundleName
      }
    });
  }

  private static async authenticate(registration: IBundleRegistration) {
    const { name, version, hash, dependencies, signature } = registration;

    const publicKey = await KeyAccess.getKey(name);

    if (publicKey == null) {
      return false;
    }

    const verifier = crypto.createVerify("SHA256");

    const message = BundleAccess.formatMessage(
      name,
      version,
      hash,
      dependencies
    );
    verifier.update(message);

    const signatureFromBase64 = Buffer.from(signature, "base64");

    return verifier.verify(publicKey, signatureFromBase64);
  }

  private static formatMessage(
    name: string,
    version: string,
    hash: string,
    dependencies: IDependency[]
  ) {
    return (
      name +
      version +
      hash +
      dependencies.map(dependency => dependency.name + dependency.version)
    );
  }

  private static insertBundleTransaction(
    registration: IBundleRegistration,
    isLatest: boolean,
    dependencyIds: number[],
    transaction
  ) {
    const { name, version, hash } = registration;

    return Bundle.create(
      {
        hash: registration.hash,
        latest: isLatest,
        name: registration.name,
        version: registration.version
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
