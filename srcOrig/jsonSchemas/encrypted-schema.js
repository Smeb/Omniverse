export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  properties: {
    name: { type: "string" },
    message: { type: "string" }
  },
  required: ["name", "message"],
  additionalProperties: false
};
