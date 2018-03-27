import * as crypto from "crypto";
import { UniqueConstraintError, ValidationError } from "sequelize";

import { bundleNamespaceRegex, Key } from "./models/key";
import { sequelize } from "./sequelize";
import { IKeyRegistration } from "./types";

import UserError from "../../errors/user";
import { trimValidationMessage } from "../../errors/utils/formatting";

export class KeyAccess {
  public static async getKey(bundleName: string) {
    const query = await Key.findOne({ where: { name: bundleName } });

    if (query == null) {
      return null;
    }

    return query.dataValues.key;
  }

  public static async create(registration: IKeyRegistration) {
    // TODO: Add authentication logic to test against server admin key
    const { bundleNamespace } = registration;
    if (!bundleNamespaceRegex.test(bundleNamespace)) {
      throw new UserError("Bundle namespace should be alphanumeric");
    }

    try {
      const key = this.decodeAndVerifyKey(registration);
      const result = await Key.create({ bundleNamespace, key });
      return result.dataValues.name;
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new UserError(`Bundle name has already been registered`, err);
      } else if (err instanceof ValidationError) {
        const message = trimValidationMessage(err);
        throw new UserError(message, err);
      } else {
        throw err;
      }
    }
  }

  private static decodeAndVerifyKey(registration: IKeyRegistration) {
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
