import {
  Bundle,
  IBundleRegistration,
  IEncryptedBundle,
  versionRegex
} from "../database/models/bundle";
import { Dependency, IDependency } from "../database/models/dependency";
import { sequelize } from "../database/sequelize";

import { KeyController } from "./key";

import { Request, Response } from "express";

export class BundleController {
  public static async RegisterBundle(
    registration: IBundleRegistration,
    response: Response
  ): Promise<void> {
    if (!versionRegex.test(registration.version)) {
      this.BundleAddFail(
        new Error(
          "Malformed version number. Version number should be xxx.xxx.xxx, x = [0, 9]"
        ),
        response
      );
    }

    const isLatest = await this.CheckIfVersionIsLatest(registration);

    sequelize
      .transaction(() => {
        const transactions = Bundle.create({
          hash: registration.hash,
          latest: isLatest,
          name: registration.name,
          version: registration.version
        });

        if (isLatest) {
          transactions.then(() => {
            Bundle.update(
              {
                latest: false
              },
              {
                fields: ["latest"],
                where: {
                  latest: true,
                  name: registration.name
                }
              }
            );
          });
        }

        registration.dependencies.forEach(dependency => {
          const dependencyHash = this.FindHashFromNameVersionPair(dependency);

          transactions.then(() =>
            Dependency.Create({
              dependency: dependencyHash,
              dependent: registration.hash
            })
          );
        });

        return transactions;
      })
      .then(result => this.BundleAddSuccess(result, response))
      .catch(err => this.BundleAddFail(err, response));
  }

  public static async DecryptMessage(request: Request) {
    const key = await KeyController.GetKey(request.body.name);

    if (key == null) {
      return;
    }

    const body = {
      dependencies: [
        {
          name: "sampleBundle",
          version: "0.1.1"
        }
      ],
      hash: "asjdoiqj",
      name: request.body.name,
      version: "0.1.2"
    };

    request.body = body;
  }

  private static async CheckIfVersionIsLatest(bundle: IBundleRegistration) {
    const latestVersion = await this.GetLatest(bundle.name);

    if (latestVersion == null) {
      return true;
    }

    return this.VersionGreaterThan(
      bundle.version,
      latestVersion.dataValues.version
    );
  }

  private static FindHashFromNameVersionPair(dependency: IDependency) {
    return Dependency.findOne({
      where: {
        name: dependency.name,
        version: dependency.version
      }
    });
  }

  private static VersionStringToInt(version: string) {
    // Version format is "xxx.xxx.xxx"
    return version
      .split(".")
      .reduce(
        (accumulator, input, index) =>
          accumulator + Number(input) * Math.pow(1000, 2 - index),
        0
      );
  }

  private static VersionGreaterThan(versionA: string, versionB: string) {
    // Returns the result of versionA > versionB, where both versions are strings
    const versionAValue = this.VersionStringToInt(versionA);
    const versionBValue = this.VersionStringToInt(versionB);

    return versionAValue > versionBValue;
  }

  private static GetLatest(bundleName: string) {
    return Bundle.findOne({
      where: {
        latest: true,
        name: bundleName
      }
    });
  }

  private static BundleAddSuccess(result, response: Response) {
    response.status(201).send("Bundle version added successfully");
  }

  private static BundleAddFail(err, response: Response) {
    if (err instanceof sequelize.UniqueConstraintError) {
      response
        .status(403)
        .send("Error: " + err.errors.map(error => error.message));
    } else {
      response.status(403).send(`Bundle version add failed: ${err.message}`);
    }
  }
}
