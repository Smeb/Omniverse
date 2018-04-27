import { UniqueConstraintError, ValidationError } from "sequelize";

import { authenticate, verifyKey } from "./crypto";
import {
  EnvironmentNamespaces,
  namespaceRegex
} from "./models/environmentNamespaces";
import { sequelize } from "./sequelize";

import UserError from "../../errors/user";
import { trimValidationMessage } from "../../errors/utils/formatting";
import { INamespaceRegistration } from "../../routes/types";
import { serverPublicKey } from "./datatypes/server_key";


export async function create(registration: INamespaceRegistration) {
  authenticateNamespaceRegistration(registration);
  const { namespace } = registration;

  if (!namespaceRegex.test(namespace)) {
    throw new UserError(`Environment namespace '${namespace} is invalid, namespace should be a lowercase word`);
  }

  try {
    const key = Buffer.from(registration.key, "base64").toString();

    verifyKey(key);

    const result = await EnvironmentNamespaces.create({ namespace, key });
    return result.dataValues.namespace;
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new UserError(
        `Namespace "${namespace}" has already been registered`,
        err
      );
    } else if (err instanceof ValidationError) {
      const message = trimValidationMessage(err);
      throw new UserError(message, err);
    } else {
      throw err;
    }
  }
}

export async function authenticateVersionFromName(
  name: string,
  message: string,
  signature: string
) {
  const keyEntry = await getKey(name);

  if (keyEntry == null) {
    throw new UserError(
      `No namespace which is a prefix of "${name}" has been registered in the database`
    );
  }

  const { key, namespace } = keyEntry;
  const decodedSignature = Buffer.from(signature, "base64");

  authenticate(key, message, decodedSignature);

  return namespace;
}

function authenticateNamespaceRegistration(
  registration: INamespaceRegistration
) {
  const { namespace, key, signature } = registration;
  const message = namespace + key;
  const decodedSignature = Buffer.from(signature, "base64");

  authenticate(serverPublicKey, message, signature);

  return namespace;
}

async function getKey(namespace: string) {
  while (namespace !== "") {
    const query = await EnvironmentNamespaces.findOne({
      where: { namespace }
    });

    if (query == null) {
      namespace = namespace
        .split(".")
        .slice(0, -1)
        .join(".");
    } else {
      return query;
    }
  }
  return null;
}
