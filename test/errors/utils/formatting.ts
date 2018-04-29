import { expect } from "chai";
import { after, before, beforeEach, describe, it } from "mocha";
import * as MockExpressRequest from "mock-express-request";
import { stub } from "sinon";

import { trimValidationMessage } from "../../../src/errors/utils/formatting";

describe("src/errors/utils/formatting", () => {
  it("removes the string 'Validation error: ' from a validationError", () => {
    const validationError = new Error("Validation error: test error");
    const result = trimValidationMessage(validationError);

    expect(result).to.equal("test error");
  })
});
