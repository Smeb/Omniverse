export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    bundles: {
      items: {
        additionalProperties: false,
        minItems: 1,
        properties: {
          crc: { type: "string"},
          hash: { type: "string"},
          type: { type: "string"},
          uri: { type: "string"}
        },
        required: ["crc", "hash", "type", "uri"],
        type: "object"
      },
      type: "array"
    },
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
    version: { type: "string" }
  },
  required: ["name", "bundles", "version", "dependencies", "signature"]
};
