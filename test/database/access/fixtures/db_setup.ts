import * as crypto from "crypto";

import { BundleManifests } from "../../../../src/database/access/models/bundleManifests";
import { EnvironmentNames } from "../../../../src/database/access/models/environmentNames";
import { EnvironmentNamespaces } from "../../../../src/database/access/models/environmentNamespaces";
import {
  Dependency,
  EnvironmentVersions
} from "../../../../src/database/access/models/environmentVersions";
import { sequelize } from "../../../../src/database/access/sequelize";

export const namespaceRegistration = {
  key: "dummy-key",
  namespace: "sample",
  signature: "dummy-signature"
};

const sampleRegistration = {
  bundles: [
    {
      crc: "1232131231421",
      hash: "ekoilj12321984",
      type: "env",
      uri: "D:/testdirectory/file/sample/env"
    },
    {
      crc: "9420912904",
      hash: "nsa19421nkjo4",
      type: "dll",
      uri: "D:/testdirectory/file/sample/dll"
    }
  ],
  name: "sample",
  version: "0.0.3"
};

export const registrationFixture = {
  bundles: [
    {
      crc: "12312321",
      hash: "jfoijqokjqwe",
      type: "env",
      uri: "D:/testdirectory/file/sample/fixture/env"
    },
    {
      crc: "92193132198",
      hash: "joewqijwoiqejw",
      type: "dll",
      uri: "D:/testdirectory/file/sample/fixture/dll"
    }
  ],
  dependencies: [
    {
      name: "sample",
      version: "0.0.3"
    },
    {
      name: "sample.top",
      version: "0.0.3"
    },
  ],
  name: "sample.top.next",
  signature: "dummy",
  version: "0.0.3"
};

export const sampleTopRegistration = {
  bundles: [
    {
      crc: "2276586136",
      hash: "b032132o1039o213",
      type: "env",
      uri: "D:/testdirectory/file/env"
    },
    {
      crc: "392108231",
      hash: "c912309218421",
      type: "dll",
      uri: "D:/testdirectory/file/dll"
    }
  ],
  dependencies: [
    {
      name: sampleRegistration.name,
      version: sampleRegistration.version
    }
  ],
  name: "sample.top",
  version: "0.0.3"
};

async function insertVersionTransaction(
  registration,
  namespace: string,
  dependencyIds: number[]
) {
  const { name, version, bundles } = registration;

  let nameResult = await EnvironmentNames.findOne({ where: { name } });

  const transaction = await sequelize.transaction();

  try {
    if (nameResult == null) {
      nameResult = await EnvironmentNames.create(
        { name, namespace },
        transaction
      );
    }

    const environmentVersion = { environmentNameId: nameResult.id, version };

    const { id } = await EnvironmentVersions.create(
      {
        ...environmentVersion,
        bundleManifests: bundles
      },
      {
        include: [
          {
            model: BundleManifests
          }
        ],
        transaction
      }
    );

    await Promise.all(
      dependencyIds.map(async dependency => {
        return Dependency.create(
          {
            dependency,
            dependent: id
          },
          { transaction }
        );
      })
    );

    await transaction.commit();
    return id;
  } catch (e) {
    transaction.rollback();
    throw e;
  }
}

const registerSample = () =>
  insertVersionTransaction(sampleRegistration, "sample", []);
const registerSampleTop = (version, id) =>
  insertVersionTransaction({ ...sampleTopRegistration, version }, "sample", [id]);

export const createNamespace = registration =>
  EnvironmentNamespaces.create(registration);

export const seedDatabase = async () => {
  await createNamespace(namespaceRegistration);
  const id = await registerSample();
  await registerSampleTop("0.0.2", id);
  await registerSampleTop("0.0.3", id);
};
