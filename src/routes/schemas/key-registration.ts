export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    key: { type: "string" },
    name: { type: "string" }
  },
  required: ["name", "key"]
};