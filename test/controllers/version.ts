import { expect } from "chai";
import * as MockExpressRequest from "mock-express-request";
import { stub } from "sinon";

import {
  requestHeaders,
  versionLookupResult,
  versionLookupTransform
} from "./fixtures/version";

import UserError from "../../src/errors/user";

const VersionAccessStubs = {
  getVersionWithDependencies: stub(),
  registerVersion: stub()
};

const VersionController = proxyquire("../src/controllers/version", {
  "../database/access/versions": VersionAccessStubs
});

import { describe, it } from "mocha";

const mockRequest = (method, url, headers, body = undefined) => {
  const request = new MockExpressRequest({ method, url, headers });

  if (body !== undefined) {
    request["content-type"] = "application/json";
    request.body = body;
  }

  return request;
};

describe("the version controller", () => {
  describe("getVersion", () => {
    it("returns", async () => {
      const response = {
        json: stub(),
        send: stub(),
        status: stub()
      };
      const request = mockRequest("GET", "/get/version", requestHeaders);

      VersionAccessStubs.getVersionWithDependencies.returns(
        versionLookupResult
      );

      await VersionController.getVersion(request, response);

      expect(response.status).to.be.calledWith(200);
      expect(response.json).to.be.calledWith(versionLookupTransform);
      expect(response.send).to.be.calledOnce;
    });

    it("throws an error if the version doesn't exist", async () => {
      const request = mockRequest("GET", "/get/version", requestHeaders);

      VersionAccessStubs.getVersionWithDependencies.returns(null);

      try {
        await VersionController.getVersion(request, null);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceof(Error);
        expect(e.message.includes(requestHeaders.name)).to.equal(true);
        expect(e.message.includes(requestHeaders.version)).to.equal(true);
      }
    });

    it("throws an error if the request is missing parameters", async () => {
      const request = mockRequest("GET", "/get/version", {});

      VersionAccessStubs.getVersionWithDependencies.returns(null);

      try {
        await VersionController.getVersion(request, null);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceof(Error);
        expect(
          e.message.includes(
            "Request needs to contain name and version parameters"
          )
        ).to.equal(true);
      }
    });
  });

  describe("registerVersion", () => {
    it("calls the registerVersion method of VersionAccess with the registration message", async () => {
      const registration = "test-object";

      const sendStub = stub();
      const response = {
        status: stub().returns({ send: sendStub })
      };

      const request = mockRequest("GET", "/get/version", {}, registration);

      VersionAccessStubs.registerVersion.resolves();
      await VersionController.registerVersion(request, response)
      expect(VersionAccessStubs.registerVersion).to.be.calledWith(registration);
      expect(response.status).to.be.calledWith(201);
      expect(sendStub).to.be.calledWith("Environment version added successfully")
    });
  });
});
