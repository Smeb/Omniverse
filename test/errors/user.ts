import { expect } from "chai";
import { after, before, beforeEach, describe, it } from "mocha";
import * as MockExpressRequest from "mock-express-request";
import { stub } from "sinon";

import UserError from "../../src/errors/user";

describe("src/errors/utils/formatting", () => {
  it("adds the original error if passed to the UserError constructor", () => {
    const originalError = new Error("test error");
    const error = new UserError("message", originalError);

    expect(error.message).to.equal("message");
    expect(error.originalError.message).to.equal(originalError.message);
  })

  it("sets originalError to null if no error is passed", () => {
    const error = new UserError("message");
    expect(error.message).to.equal("message");
  })
});

