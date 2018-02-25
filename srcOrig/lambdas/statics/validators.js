import Ajv from "ajv";
import encryptedSchema from "../../jsonSchemas/encrypted-schema";
import bundleSchema from "../../jsonSchemas/bundle-schema";
import bundleRegistrationSchema from "../../jsonSchemas/bundle-registration-schema";
const ajv = new Ajv();

export const encryptedBundleValidator = ajv.compile(encryptedSchema);
export const bundleMessageValidator = ajv.compile(bundleSchema);
export const bundleRegistrationValidator = ajv.compile(
  bundleRegistrationSchema
);
