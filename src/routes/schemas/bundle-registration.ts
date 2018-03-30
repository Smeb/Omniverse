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
    name: { type: "string" },
    signature: { type: "string" },
    uri: { type: "string" },
    version: { type: "string" }
  },
  required: ["name", "uri", "version", "dependencies", "signature"]
};
