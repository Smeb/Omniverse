export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    message: { type: "string" },
    name: { type: "string" }
  },
  required: ["name", "message"]
};
