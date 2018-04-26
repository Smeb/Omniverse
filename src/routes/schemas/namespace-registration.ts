export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    key: { type: "string", minLength: 1 },
    namespace: { type: "string", minLength: 1 },
    signature: { type: "string", minLength: 1 }
  },
  required: ["namespace", "key", "signature"]
};
