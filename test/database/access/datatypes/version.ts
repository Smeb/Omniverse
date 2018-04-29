import { expect } from "chai";
import { after, before, beforeEach, describe, it } from "mocha";
import * as MockExpressRequest from "mock-express-request";
import { stub } from "sinon";

import * as crypto from "crypto";

import { compareVersions, validateVersion } from "../../../../src/database/access/datatypes/version";

const versionPart = () => {
  const value = Math.floor(Math.random() * 1000);
  if (value >= 100) {
    return value.toString();
  } else if (value >= 10) {
    return "0" + value.toString();
  } else {
    return "00" + value.toString();
  }
}

const randomVersionNumber = () => {
  return versionPart() + "." + versionPart() + "." + versionPart();
}

describe("src/database/access/datatypes/version", () => {
  describe("validationVersion", () => {
    describe("Only accepts a version in the format xxx.xxx.xxx where x = [0, 9]", () => {
      it("accepts valid strings (tests with 1000 random correct version numbers)", () => {
        for (let run = 0; run < 1000; run++) {
          expect(validateVersion(randomVersionNumber())).to.equal(true);
        }
      });

      it("rejects non-valid strings (tests with 1000 random incorrect version numbers)", () => {
        const versionRegex = /^(\d{1,3}.){2}\d{1,3}$/;
        for (let run = 0; run < 1000; run++) {
          const numBytes = Math.floor(Math.random() * 10) + 5;
          let badVersionNumber = crypto.randomBytes(numBytes).toString("hex");

          while (badVersionNumber[3] === ".") {
            // ensures the random bytes aren't valid (unlikely to be the case)
            badVersionNumber = crypto.randomBytes(numBytes).toString("hex");
          }

          expect(validateVersion(badVersionNumber)).to.equal(false);
        }
      })
    });
  });

  describe("compareVersions", () => {
    it("compares two versions to see if the first version is larger than the second (1000 tries)", () => {
      for (let run = 0; run < 1000; run++) {
        const versionNumberA = randomVersionNumber();
        const versionNumberB = randomVersionNumber();

        const Anumbers = versionNumberA.split(".");
        const Bnumbers = versionNumberB.split(".");

        let AgreaterThanB = false;

        for(let i = 0; i < 3; i++) {
          if(Anumbers[i] > Bnumbers[i]) {
            AgreaterThanB = true;
          }

          if (Anumbers[i] !== Bnumbers[i]) {
            break;
          }
        }

        expect(compareVersions(versionNumberA, versionNumberB)).to.equal(AgreaterThanB);
      }
    })
  })
});
