import * as crypto from "crypto";
import { UniqueConstraintError, ValidationError } from "sequelize";

import ExpectedError from "../../errors/expected";

import { Version } from "./datatypes/version";
import { KeyAccess } from "./keys";
import { Bundle } from "./models/bundle";
import { Dependency } from "./models/dependency";
import { sequelize } from "./sequelize";
import { IBundleRecord, IBundleRegistration, IDependency } from "./types";

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

  public static async bundleDependencies(bundle: IBundleRecord) {
    const dependency = await Dependency.findAll({
      include: [Bundle],
      where: {
        Dependent: bundle.id
      }
    });

    console.log(dependency);

    throw new ExpectedError("Not fully implemented");
  }

  public static async registerBundle(registration: IBundleRegistration) {
    const authenticated = await BundleAccess.authenticate(registration);

    if (authenticated === false) {
      throw new ExpectedError("Authentication failed");
    }

    const version = new Version(registration);

    if (!version.valid) {
      throw new ExpectedError("Bundle version is incorrectly formatted");
    }
    const isLatest = await version.isLatest();

    const dependencyIds = await BundleAccess.getDependencyIds(
      registration.dependencies
    );

    if (dependencyIds == null) {
      throw new ExpectedError(
        "Named dependencies were missing in the database"
      );
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
        throw new ExpectedError(
          `Bundle (${name}, ${version.toString()}) already exists`
        );
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

    const bundleNamespace = name.split(".")[0];
    const publicKey = await KeyAccess.getKey(bundleNamespace);

    if (publicKey == null) {
      throw new ExpectedError(
        "Bundle namespace hasn't been registered in the database"
      );
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
    const bundleNamespace = name.split(".")[0];

    return Bundle.create(
      {
        bundleNamespace,
        hash,
        latest: isLatest,
        name,
        version,
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
