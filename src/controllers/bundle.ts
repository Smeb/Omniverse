import {
  Bundle,
  IBundleRegistration,
  versionRegex
} from "../database/models/bundle";
import { Dependency, IDependency } from "../database/models/dependency";
import { sequelize } from "../database/sequelize";

import { KeyController } from "./key";

import * as crypto from "crypto";
import { Request, Response } from "express";

export class BundleController {
  public static async registerBundle(
    registration: IBundleRegistration,
    response: Response
  ): Promise<void> {
    if (!versionRegex.test(registration.version)) {
      this.bundleAddFailResponse(
        new Error(
          "Malformed version number. Version number should be xxx.xxx.xxx, x = [0, 9]"
        ),
        response
      );
    }

    const isLatest = await this.checkIfVersionIsLatest(registration);

    const dependencyIds = await this.findDependencyIds(
      registration.dependencies
    );

    if (dependencyIds == null) {
      this.bundleAddFailResponse(
        new Error("Bundle references dependencies not in database"),
        response
      );
      return;
    }

    sequelize
      .transaction(transaction =>
        this.insertBundleTransaction(
          registration,
          isLatest,
          dependencyIds,
          transaction
        )
      )
      .then(result => this.bundleAddSuccessResponse(result, response))
      .catch(err => this.bundleAddFailResponse(err, response));
  }

  public static async verifyRegistration(
    registration: IBundleRegistration,
    response: Response
  ) {
    const { name, version, hash, dependencies, signature } = registration;

    const publicKey = await KeyController.getKey(name);

    if (publicKey == null) {
      return this.notRegisteredErrorResponse(response);
    }

    const verifier = crypto.createVerify("SHA256");

    const message = this.formatMessage(name, version, hash, dependencies);
    verifier.update(message);

    const signatureFromBase64 = Buffer.from(signature, "base64");

    if (verifier.verify(publicKey, signatureFromBase64) === false) {
      return this.invalidSignatureResponse(response);
    }
  }

  private static async findDependencyIds(dependencies) {
    const dependencyIdResults = await Promise.all(
      dependencies.map(dependency => this.findIdFromNameVersionPair(dependency))
    );

    if (dependencyIdResults.includes(null)) {
      return null;
    }

    return dependencyIdResults.map(result => result.dataValues.id);
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
    ).then(bundle => {
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
    }).then(() => {
      if (isLatest) {
        return this.setOtherBundleVersionsToFalse(name, version, transaction);
      }
    })
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

  private static async checkIfVersionIsLatest(bundle: IBundleRegistration) {
    const latestVersion = await this.getLatest(bundle.name);

    if (latestVersion == null) {
      return true;
    }

    return this.versionGreaterThan(
      bundle.version,
      latestVersion.dataValues.version
    );
  }

  private static findIdFromNameVersionPair(dependency: IDependency) {
    return Bundle.findOne({
      where: {
        name: dependency.name,
        version: dependency.version
      }
    });
  }

  private static versionStringToInt(version: string) {
    // Version format is "xxx.xxx.xxx"
    return version
      .split(".")
      .reduce(
        (accumulator, input, index) =>
          accumulator + Number(input) * Math.pow(1000, 2 - index),
        0
      );
  }

  private static versionGreaterThan(versionA: string, versionB: string) {
    // Returns the result of versionA > versionB, where both versions are strings
    const versionAValue = this.versionStringToInt(versionA);
    const versionBValue = this.versionStringToInt(versionB);

    return versionAValue > versionBValue;
  }

  private static getLatest(bundleName: string) {
    return Bundle.findOne({
      where: {
        latest: true,
        name: bundleName
      }
    });
  }

  private static async notRegisteredErrorResponse(response: Response) {
    response.status(403).send("Named bundle is not registered");
  }

  private static async invalidSignatureResponse(response: Response) {
    response.status(403).send("Signature didn't match sent message");
  }

  private static async bundleAddSuccessResponse(result, response: Response) {
    response.status(201).send("Bundle version added successfully");
  }

  private static async bundleAddFailResponse(err, response: Response) {
    if (err instanceof sequelize.UniqueConstraintError) {
      response
        .status(403)
        .send("Error: " + err.errors.map(error => error.message));
    } else {
      response.status(403).send(`Bundle version add failed: ${err.message}`);
    }
  }
}
