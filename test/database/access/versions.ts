import { expect } from "chai";
import { after, before, beforeEach, describe, it } from "mocha";
import * as MockExpressRequest from "mock-express-request";
import { stub } from "sinon";

import { registrationFixture, seedDatabase } from "./fixtures/db_setup";

import { sequelize } from "../../../src/database/access/sequelize";
import { getVersions, getVersionWithDependencies } from "../../../src/database/access/versions";
import UserError from "../../../src/errors/user";

const namespacesStubs = {
  authenticateVersionFromName: stub()
};

const VersionAccess = proxyquire("../src/database/access/versions", {
  "./namespaces": namespacesStubs
});

describe("version access", () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await seedDatabase();
  })

  after(async () => {
    await sequelize.sync({ force: true });
  })

  describe("getVersions", () => {
    it("returns all environments as a list of objects wth a name and a list of versions", async () => {
      const results = await getVersions();
      expect(results.length).to.equal(2);
      expect(results[0]).to.deep.equal({ name: "sample", versions: ["0.0.3"]})
      expect(results[1]).to.deep.equal({ name: "sample.top", versions: ["0.0.2", "0.0.3"]})
    })

    it("returns an empty array if the database is empty", async () => {
      await sequelize.sync({ force: true });
      const results = await getVersions();
      expect(results).to.deep.equal([]);
    })
  });

  describe("getVersionWithDependencies", () => {
    describe("returns a version's information (name, version, dependencies)", async () => {
      let result;

      beforeEach(async () => {
        result = await getVersionWithDependencies("sample.top", "0.0.3");
      });

      it("includes an EnvironmentName record with the environment's name", () => {
        expect(result.environmentName).to.not.be.null;
        expect(result.environmentName.name).to.equal("sample.top");
      })

      it("includes the environment's version number", () => {
        expect(result.version).to.equal("0.0.3");
      })

      it("includes BundleManifest records for the environment version", () => {
        expect(result.bundleManifests.length).to.equal(2);
        expect(result.bundleManifests[0].type).to.equal("env");
        expect(result.bundleManifests[1].type).to.equal("dll");
      })

      it("includes dependency manifests for the environment version", () => {
        expect(result.dependencies.length).to.equal(1);
        const dependency = result.dependencies[0];
        expect(dependency.environmentName.name).to.equal("sample");
        expect(dependency.version).to.equal("0.0.3");
      })

      it("dependency manifests should only include the dll bundleManifest", () => {
        const dependency = result.dependencies[0];
        expect(dependency.bundleManifests.length).to.equal(1);
        expect(dependency.bundleManifests[0].type).to.equal("dll");
      })
    });

    it("returns null if no record exists", async () => {
      const result = await getVersionWithDependencies("notthere", "0.0.1");
      expect(result).to.be.null;
    })
  });

  describe("registerVersion", () => {
    beforeEach(() => {
      namespacesStubs.authenticateVersionFromName.reset()
      namespacesStubs.authenticateVersionFromName.returns("sample");
    });

    it("calls authenticate version from name from the namespaces access module", async () => {
      await VersionAccess.registerVersion(registrationFixture);
      expect(namespacesStubs.authenticateVersionFromName).to.be.calledOnce;
      const args = namespacesStubs.authenticateVersionFromName.getCall(0).args;
      expect(args[0]).to.equal(registrationFixture.name);
      expect(args[1].length).to.not.equal(0);
      expect(args[2]).to.equal(registrationFixture.signature);
    })

    it("adds a new version to the database", async () => {
      await VersionAccess.registerVersion(registrationFixture);
      let found = false;
      const versions = await getVersions();

      versions.map(v => {
        if (v.name === registrationFixture.name) {
          if (v.versions[0] === registrationFixture.version) {
            found = true;
          }
        }
      });

      expect(found).to.equal(true);

      const version = await getVersionWithDependencies(registrationFixture.name, registrationFixture.version);

      expect(version.environmentName.name).to.equal(registrationFixture.name);
      expect(version.version).to.equal(registrationFixture.version);
      expect(version.bundleManifests.length).to.equal(2);
      expect(version.dependencies.length).to.equal(2);
    })

    it("throws an error if the version is incorrectly formatted", async () => {
      const badRegistration = { ...registrationFixture, version: "123" }
      try {
        await VersionAccess.registerVersion(badRegistration);
        expect.fail()
      } catch (e) {
        expect(e.message).to.contain(badRegistration.version);
        expect(e.message).to.contain("x.x.x")
      }
    });

    it("throws an error if dependencies are missing", async () => {
      const badRegistration = { ...registrationFixture, dependencies: [{ name: "not", version: "0.0.1" }] }
      try {
        await VersionAccess.registerVersion(badRegistration);
        expect.fail()
      } catch (e) {
        expect(e.message).to.contain("dependencies");
        expect(e.message).to.contain("missing")
      }
    })
  });
});
