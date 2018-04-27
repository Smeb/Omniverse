import { expect } from "chai";
import { beforeEach, describe, it } from "mocha";
import * as MockExpressRequest from "mock-express-request";
import { stub } from "sinon";

const NamespaceAccessStubs = {
  create: stub().resolves("test-namespace")
};

const NamespaceController = proxyquire("../src/controllers/namespace", {
  "../database/access/namespaces": NamespaceAccessStubs
});

const response = {
  json: stub(),
  status: stub()
};

describe("the namespace controller", () => {
  beforeEach(() => {
    NamespaceAccessStubs.create.reset();
    NamespaceAccessStubs.create.resolves("test-namespace");
    response.json.reset();
    response.status.reset();
  });

  describe("registerNamespace", () => {
    it("calls create with the registration", async () => {
      await NamespaceController.registerNamespace({ body: { } }, response);
      expect(NamespaceAccessStubs.create).to.be.calledOnce;
    });

    it("returns a json success message including the namespace", async () => {
      await NamespaceController.registerNamespace({ body: { } }, response);
      expect(NamespaceAccessStubs.create).to.be.calledOnce;
      expect(response.json.getCall(0).args[0]).to.contain("test-namespace");
    });
  });
});
