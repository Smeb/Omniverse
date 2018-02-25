import { bundleMessageValidator } from "./statics/validators";

import { databaseErrors, getBundleKey } from "./statics/database";

import ValidationError from "../errors/validation-error";

async function decryptMessage(bundle) {
  let queryResult;
  try {
    queryResult = await getBundleKey(bundle.name);
  } catch (e) {
    if (e instanceof databaseErrors.QueryResultError) {
      if (e.code === databaseErrors.queryResultErrorCode.noData) {
        throw new ValidationError(
          "[BundleNotRegisteredError]: No matching public key for bundleName: ",
          bundle.name
        );
      }
    }
  }

  if (queryResult.key.toString() !== "dummykey") {
    throw new ValidationError(
      "[TemporaryError]: Testing error before implementing encryption"
    );
  }

  return JSON.parse(bundle.message);
}

export async function authenticate(bundle) {
  const message = await decryptMessage(bundle);

  if (!bundleMessageValidator(message)) {
    throw new ValidationError(
      "[AuthenticationError]: Couldn't decrypt payload"
    );
  }

  return { name: bundle.name, message };
}
