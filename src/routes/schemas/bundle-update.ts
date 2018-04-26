export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1 },
    signature: { type: "string", minLength: 1 },
    uri: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 }
  },
  required: ["name", "uri", "version", "signature"]
};
