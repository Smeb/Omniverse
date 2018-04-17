import * as crypto from "crypto";
import { UniqueConstraintError, ValidationError } from "sequelize";

import {
  EnvironmentNamespaces,
  namespaceRegex
} from "./models/environmentNamespaces";
import { sequelize } from "./sequelize";

import UserError from "../../errors/user";
import { trimValidationMessage } from "../../errors/utils/formatting";
import { INamespaceRegistration } from "../../routes/types";

export class NamespaceAccess {
  public static async create(registration: INamespaceRegistration) {
    // TODO: Add authentication logic to test against server admin key
    const { namespace } = registration;

    console.log(namespace);
    if (!namespaceRegex.test(namespace)) {
      throw new UserError("Environment namespace should be separated by periods");
    }

    try {
      const key = this.decodeAndVerifyKey(registration);
      const result = await EnvironmentNamespaces.create({ namespace, key });
      return result.dataValues.namespace;
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new UserError(`Environment namespace has already been registered`, err);
      } else if (err instanceof ValidationError) {
        const message = trimValidationMessage(err);
        throw new UserError(message, err);
      } else {
        throw err;
      }
    }
  }

  public static async authenticateVersionFromName(
    name: string,
    message: string,
    signature: string
  ) {
    return true;
    const publicKey = await NamespaceAccess.getKey(name);

    if (publicKey == null) {
      throw new UserError(
        "Environment namespace hasn't been registered in the database"
      );
    }

    const verifier = crypto.createVerify("SHA256");

    verifier.update(message);

    const signatureFromBase64 = Buffer.from(signature, "base64");

    if (!verifier.verify(publicKey, signatureFromBase64)) {
      throw new UserError("Authentication Failed");
    }
  }

  private static async getKey(name: string) {

    while (name !== "") {
      const query = await EnvironmentNamespaces.findOne({
        attributes: ["key"],
        where: { namespace: name }
      });

      if (query == null) {
        name = name.split('.').slice(0, -1).join('.');
      } else {
        return query.dataValues.key;
      }
    }
    return null;
  }

  private static decodeAndVerifyKey(registration: INamespaceRegistration) {
    try {
      const key = Buffer.from(registration.key, "base64").toString();
      crypto.publicEncrypt(key, Buffer.from("Test"));
      return key;
    } catch (e) {
      throw new UserError(
        "Key should be sent as base64, decoded base64 should be .pem format",
        e
      );
    }
  }
}
