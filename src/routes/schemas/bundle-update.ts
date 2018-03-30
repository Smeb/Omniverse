export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    signature: { type: "string" },
    uri: { type: "string" },
    version: { type: "string" }
  },
  required: ["name", "uri", "version", "signature"]
};
