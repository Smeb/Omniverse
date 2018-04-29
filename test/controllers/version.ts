import { expect } from "chai";
import { beforeEach, describe, it } from "mocha";
import * as MockExpressRequest from "mock-express-request";
import { stub } from "sinon";

import {
  environmentVersionLookupResult,
  requestHeaders,
  versionLookupTransform
} from "./fixtures/version";

const VersionAccessStubs = {
  getVersions: stub(),
  getVersionWithDependencies: stub(),
  registerVersion: stub()
};

const VersionController = proxyquire("../src/controllers/version", {
  "../database/access/versions": VersionAccessStubs
});

const mockRequest = (method, url, headers, body = undefined) => {
  const request = new MockExpressRequest({ method, url, headers });

  if (body !== undefined) {
    request["content-type"] = "application/json";
    request.body = body;
  }

  return request;
};

describe("the version controller", () => {
  beforeEach(() => {
    VersionAccessStubs.getVersionWithDependencies.reset();
    VersionAccessStubs.registerVersion.reset();
  });

  describe("getVersions", () => {
    it("calls the version access controller to get all versions", async () => {
      const response = {
        json: stub(),
        send: stub(),
        status: stub()
      };

      await VersionController.getVersions({}, response);

      expect(VersionAccessStubs.getVersions).to.be.calledOnce;
      expect(response.json).to.be.calledOnce;
      expect(response.send).to.be.calledOnce;
      expect(response.status).to.be.calledOnce;
    })

    it("sends the response with status 200 and json which is the returned data from getVersions", async () => {
      const response = {
        json: stub(),
        send: stub(),
        status: stub()
      };
      const data = [{ name: "name", version: "0.0.1" }]
      VersionAccessStubs.getVersions.returns(data);

      await VersionController.getVersions({}, response);

      expect(response.json).to.be.calledOnce;
      expect(response.json).to.be.calledWith(data);

      expect(response.status).to.be.calledOnce;
      expect(response.status).to.be.calledWith(200);

      expect(response.send).to.be.calledOnce;
    })
  });

  describe("getVersion", () => {
    it("returns a correctly formatted result as defined in fixtures", async () => {
      const response = {
        json: stub(),
        send: stub(),
        status: stub()
      };

      const request = mockRequest("GET", "/get/version", requestHeaders);

      VersionAccessStubs.getVersionWithDependencies.returns(
        environmentVersionLookupResult
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
        expect(e.message.includes(requestHeaders.name)).to.equal(true);
        expect(e.message.includes(requestHeaders.version)).to.equal(true);
      }
    });

    it("throws an error if the version number formatting is not x.x.x", async () => {
      const version = "212"
      const request = mockRequest("GET", "/get/version", {...requestHeaders, version });

      VersionAccessStubs.getVersionWithDependencies.returns(null);

      try {
        await VersionController.getVersion(request, null);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceof(Error);
        expect(e.message.includes( "x.x.x")).to.equal(true);
        expect(e.message.includes(version)).to.equal(true);
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
      const registration = {
        name: "testName",
        version: "0.0.1"
      };

      const response = {
        json: stub(),
        send: stub(),
        status: stub()
      };

      const request = mockRequest("GET", "/get/version", {}, registration);

      VersionAccessStubs.registerVersion.resolves();
      await VersionController.registerVersion(request, response)
      expect(VersionAccessStubs.registerVersion).to.be.calledWith(registration);
    });

    it("sends a 201 with response message in JSON if the registration suceeded", async () => {
      const registration = {
        name: "testName",
        version: "0.0.1"
      };

      const response = {
        json: stub(),
        send: stub(),
        status: stub()
      };

      const request = mockRequest("GET", "/get/version", {}, registration);

      VersionAccessStubs.registerVersion.resolves();
      await VersionController.registerVersion(request, response)

      expect(response.status).to.be.calledWith(201);

      const jsonMessage = response.json.getCalls()[0].args[0];
      expect(jsonMessage).to.contain(registration.name);
      expect(jsonMessage).to.contain(registration.version);
    });
  });
});
