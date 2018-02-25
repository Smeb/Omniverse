import { addBundle, addBundleKey } from "./statics/database";
import { authenticate } from "./authenticate";

import {
  bundleRegistrationValidator,
  encryptedBundleValidator
} from "./statics/validators";

import ValidationError from "../errors/validation-error.js";
import RegistrationError from "../errors/registration-error.js";

export async function registerBundleKey(registration) {
  if (!bundleRegistrationValidator(registration)) {
    throw new ValidationError(bundleRegistrationValidator.errors);
  }

  try {
    await addBundleKey(registration);
  } catch (e) {
    throw new RegistrationError(e.detail);
  }
}

export async function registerBundle(encryptedBundle) {
  if (!encryptedBundleValidator(encryptedBundle)) {
    throw new ValidationError(encryptedBundleValidator.errors);
  }

  const decryptedBundle = authenticate(encryptedBundle);

  addBundle(decryptedBundle);
}

export async function requestBundle() {}
