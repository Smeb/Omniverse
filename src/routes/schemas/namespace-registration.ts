export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    key: { type: "string" },
    namespace: { type: "string" }
  },
  required: ["namespace", "key"]
};
