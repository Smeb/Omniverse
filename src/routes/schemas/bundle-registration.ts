export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    bundles: {
      items: {
        additionalProperties: false,
        minItems: 1,
        properties: {
          crc: { type: "string", minLength: 1 },
          hash: { type: "string", minLength: 1 },
          type: { type: "string", minLength: 1 },
          uri: { type: "string", minLength: 1 }
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
          name: { type: "string", minLength: 1 },
          version: { type: "string", minLength: 1 }
        },
        required: ["name", "version"],
        type: "object"
      },
      type: "array"
    },
    name: { type: "string", minLength: 1 },
    signature: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 }
  },
  required: ["name", "bundles", "version", "dependencies", "signature"]
};
