import { expect } from "chai";
import { after, before, beforeEach, describe, it } from "mocha";
import * as MockExpressRequest from "mock-express-request";
import { stub } from "sinon";

import { createNamespace, namespaceRegistration } from "./fixtures/db_setup";

import { sequelize } from "../../../src/database/access/sequelize";

const nodeCryptoStubs = {
  createVerify: stub(),
  publicEncrypt: stub()
};

const Crypto = proxyquire("../src/database/access/crypto", {
  crypto: nodeCryptoStubs
});

const key = "dummy-key";
const msg = "dummy-msg";
const sig = "dummy-sig";

const verifier = {
  update: stub(),
  verify: stub()
};

describe("Crypto", () => {
  beforeEach(() => {
    nodeCryptoStubs.publicEncrypt.reset();
    nodeCryptoStubs.createVerify.reset();
    verifier.update.reset();
    verifier.verify.reset();

    nodeCryptoStubs.createVerify.returns(verifier);
    verifier.verify.returns(true);
  });

  describe("authenticate", () => {
    it("creates an RSA-SHA256 verifier", () => {
      Crypto.authenticate(key, msg, sig);
      expect(nodeCryptoStubs.createVerify).to.be.calledOnce;
      expect(nodeCryptoStubs.createVerify).to.be.calledWith("RSA-SHA256");
    });

    it("adds the message to the verifier", () => {
      Crypto.authenticate(key, msg, sig);
      expect(verifier.update).to.be.calledOnce;
      expect(verifier.update).to.be.calledWith(msg);
    });

    it("calls the verify method of the verifier with the key and signature", () => {
      Crypto.authenticate(key, msg, sig);
      expect(verifier.verify).to.be.calledOnce;
      expect(verifier.verify).to.be.calledWith(key, sig);
    });

    it("throws an error if verifier.verify fails", () => {
      verifier.verify.returns(false);
      try {
        Crypto.authenticate(key, msg, sig);
        expect.fail();
      } catch (e) {
        expect(e.message).to.contain("Authentication Failed");
      }
    });
  });

  describe("verifyKey", () => {
    it("should return the key", () => {
      const result = Crypto.verifyKey(key);
      expect(result).to.equal(key);
    });

    it("should use the key to encrypt a buffer to test the key is valid", () => {
      Crypto.verifyKey(key);
      expect(nodeCryptoStubs.publicEncrypt).to.be.calledOnce;
      expect(nodeCryptoStubs.publicEncrypt).to.be.calledWith(key);
    });

    it("should throw an error if the key is not valid", () => {
      nodeCryptoStubs.publicEncrypt.throws();
      try {
        Crypto.verifyKey(key);
        expect.fail();
      } catch (e) {
        expect(e.message).to.include("should be sent as base64")
        expect(e.message).to.include("should be .pem format")
      }
    });
  });
});
