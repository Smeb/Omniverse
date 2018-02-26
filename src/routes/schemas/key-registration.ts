export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  properties: {
    name: { type: "string" },
    key: { type: "string" }
  },
  required: ["name", "key"],
  additionalProperties: false
};
