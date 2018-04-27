import { expect } from "chai";
import { after, before, beforeEach, describe, it } from "mocha";
import * as MockExpressRequest from "mock-express-request";
import { stub } from "sinon";

import { createNamespace, namespaceRegistration } from "./fixtures/db_setup";

import { sequelize } from "../../../src/database/access/sequelize";

const cryptoStubs = {
  authenticate: stub(),
  verifyKey: stub()
};

const NamespaceAccess = proxyquire("../src/database/access/namespaces", {
  "./crypto": cryptoStubs
});

describe("namespaces access", () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
    cryptoStubs.authenticate.reset();
    cryptoStubs.verifyKey.reset();
  });

  after(async () => {
    await sequelize.sync({ force: true });
  });

  describe("create", () => {
    it("converts key from base64 and calls verifyKey to check the key is in the PEM format", async () => {
      await NamespaceAccess.create(namespaceRegistration);

      const convertedKey = Buffer.from(
        namespaceRegistration.key,
        "base64"
      ).toString();

      expect(cryptoStubs.verifyKey).to.be.calledOnce;
      expect(cryptoStubs.verifyKey).to.be.calledWith(convertedKey);
    });

    it("returns the registered namespace", async () => {
      const result = await NamespaceAccess.create(namespaceRegistration);
      expect(result).to.equal(namespaceRegistration.namespace);
    });

    it("throws an error if the namespace has already been registered", async () => {
      await createNamespace(namespaceRegistration);
      try {
        await NamespaceAccess.create(namespaceRegistration);
        expect.fail();
      } catch (e) {
        expect(e.message).to.contain(namespaceRegistration.namespace);
        expect(e.message).to.contain("already been registered");
      }
    });

    it("throws an error if the namespace is not a lowercase word", async () => {
      const badRegistration = { ...namespaceRegistration, namespace: "123bad" };
      try {
        await NamespaceAccess.create(badRegistration);
        expect.fail();
      } catch (e) {
        expect(e.message).to.contain(badRegistration.namespace);
        expect(e.message).to.contain("lowercase word");
      }
    });
  });

  describe("authenticate version from name", () => {
    it("returns the namespace for the passed environment name if it exists", async () => {
      await createNamespace(namespaceRegistration);
      const result = await NamespaceAccess.authenticateVersionFromName("sample.top.new", "dummy-msg", "dummy-sig");

      expect(result).to.equal(namespaceRegistration.namespace);
    })

    it("calls the crypto authenticate method with the found key, message, and decoded signature", async () => {
      const name = "sample.top";
      const msg = "dummy-msg";
      const signature = "dummy-sig";
      const decodedSignature = Buffer.from(signature, "base64");

      await createNamespace(namespaceRegistration);
      await NamespaceAccess.authenticateVersionFromName(name, msg, signature);

      expect(cryptoStubs.authenticate).to.be.calledOnce;
      expect(cryptoStubs.authenticate).to.be.calledWith(namespaceRegistration.key, msg, decodedSignature);
    })

    it("throws an error if the namespace for the passed environment doesn't exist", async () => {
      const name = "sample.top.new";
      try {
        await NamespaceAccess.authenticateVersionFromName(name, "dummy-msg", "dummy-sig");
        expect.fail();
      } catch (e) {
        expect(e.message).to.contain(name);
      }
    })
  });
});
