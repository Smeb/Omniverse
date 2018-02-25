export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  properties: {
    hash: { type: "string" },
    version: { type: "string" },
    dependencies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          version: { type: "string" }
        },
        required: ["name", "version"],
        additionalProperties: false
      }
    }
  },
  required: ["hash", "version", "dependencies"],
  additionalProperties: false
};
