import {
  Bundle,
  IBundleRecord,
  IBundleRegistration
} from "../database/models/bundle";
import { Dependency, IDependency } from "../database/models/dependency";
import { sequelize } from "../database/sequelize";
import { Version } from "../datatypes/version";

import { KeyController } from "./key";

import * as crypto from "crypto";
import { Request, Response } from "express";

export class BundleController {
  public static async register(
    request: Request,
    response: Response
  ): Promise<void> {
    const registration: IBundleRegistration = request.body;

    const version = new Version(registration);

    if (!version.valid) {
      BundleController.bundleAddFailResponse(
        new Error(errors.invalidSignature),
        response
      );
      return;
    }

    const isLatest = await version.isLatest();

    const dependencyIds = await BundleController.findDependencyIds(
      registration.dependencies
    );

    if (dependencyIds == null) {
      BundleController.bundleAddFailResponse(
        new Error("Bundle references dependencies not in database"),
        response
      );
      return;
    }

    sequelize
      .transaction(transaction =>
        BundleController.insertBundleTransaction(
          registration,
          isLatest,
          dependencyIds,
          transaction
        )
      )
      .then(result =>
        BundleController.bundleAddSuccessResponse(result, response)
      )
      .catch(err => BundleController.bundleAddFailResponse(err, response));
  }

  public static async validateRegistrationSignature(
    request: Request,
    response: Response,
    next
  ) {
    const registration: IBundleRegistration = request.body;

    const { name, version, hash, dependencies, signature } = registration;

    const publicKey = await KeyController.getKey(name);

    if (publicKey == null) {
      return BundleController.notRegisteredErrorResponse(response);
    }

    const verifier = crypto.createVerify("SHA256");

    const message = BundleController.formatMessage(
      name,
      version,
      hash,
      dependencies
    );
    verifier.update(message);

    const signatureFromBase64 = Buffer.from(signature, "base64");

    if (verifier.verify(publicKey, signatureFromBase64) === false) {
      return BundleController.invalidSignatureResponse(response);
    } else {
      next();
    }
  }

  public static async getBundle(request: Request, response: Response) {
    const name = request.get("name");
    const version = request.get("version");

    const bundle = await Bundle.findOne({
      where: { name, version }
    });

    if (bundle == null) {
      return BundleController.getBundleFailResponse(response);
    }

    const { id } = bundle.dataValues;

    const dependencyChain = [
      id,
      ...(await BundleController.getBundleDependencyChain(id))
    ];

    console.log(dependencyChain);
  }

  private static async getBundleDependencyChain(id) {
    console.log("Looking up dependency");
    const dependencyInformation = await Dependency.find({
      where: { dependent: id }
    });

    if (dependencyInformation == null) {
      return [];
    }

    const { dependency } = dependencyInformation.dataValues;

    return [
      dependency,
      ...BundleController.getBundleDependencyChain(dependency)
    ];
  }

  private static async findDependencyIds(dependencies) {
    const dependencyIdResults = await Promise.all(
      dependencies.map(dependency =>
        BundleController.findIdFromNameVersionPair(dependency)
      )
    );

    if (dependencyIdResults.includes(null)) {
      return null;
    }

    // Typecast resolves issue with typescript inference when using promises
    return (dependencyIdResults as any[]).map(result => result.id);
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
          return BundleController.setOtherBundleVersionsToFalse(
            name,
            version,
            transaction
          );
        }
      });
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

  private static findIdFromNameVersionPair(dependency: IDependency) {
    return Bundle.findOne({
      raw: true,
      where: {
        name: dependency.name,
        version: dependency.version
      }
    });
  }

  private static getBundleFailResponse(response: Response) {
    response.status(403).send(errors.versionNotFound);
  }

  private static notRegisteredErrorResponse(response: Response) {
    response.status(403).send(errors.notRegistered);
  }

  private static invalidSignatureResponse(response: Response) {
    response.status(403).send(errors.invalidSignature);
  }

  private static bundleAddSuccessResponse(result, response: Response) {
    response.status(201).send("Bundle version added successfully");
  }

  private static bundleAddFailResponse(err, response: Response) {
    if (err instanceof sequelize.UniqueConstraintError) {
      response
        .status(403)
        .send("Error: " + err.errors.map(error => error.message));
    } else {
      response.status(403).send(`Bundle version add failed: ${err.message}`);
    }
  }
}

const errors = {
  invalidSignature: "Signature didn't match sent message",
  notRegistered: "Named bundle doesn't exist in database",
  versionNotFound: "Bundle (name, version) pair doesn't exist in database",
  versionMalformed:
    "Malformed version number. Version number should be xxx.xxx.xxx, x = [0, 9]"
};
