export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    bundleNamespace: { type: "string" },
    key: { type: "string" }
  },
  required: ["bundleNamespace", "key"]
};
