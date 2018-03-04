export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    dependencies: {
      items: {
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          version: { type: "string" }
        },
        required: ["name", "version"],
        type: "object"
      },
      type: "array"
    },
    hash: { type: "string" },
    name: { type: "string" },
    signature: { type: "string" },
    version: { type: "string" }
  },
  required: ["name", "hash", "version", "dependencies", "signature"]
};
