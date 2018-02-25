import pgPromiseInitializer from "pg-promise";
import ValidationError from "../../errors/validation-error";
import DependencyError from "../../errors/dependency-error";

export const pgp = pgPromiseInitializer();
export const databaseErrors = pgp.errors;

const connection = {
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
};

// exported only for testing
export const db = pgp(connection);

/* VALIDATION */
function validateVersionNumber(version) {
  // Allows triplet strings of numbers 0-999, i.e 2.1.1
  return /\d{1,3}.\d{1,3}.\d{1,3}/.test(version);
}

function isVersionNumberGreater(versionA, versionB) {
  // Returns true if versionA > versionB, false otherwise
  const versionAValue = versionToInt(versionA);
  const versionBValue = versionToInt(versionB);
  if (versionAValue > versionBValue) return true;
  return false;
}

function versionToInt(version) {
  return version.split(".").reduce((accumulator, input, index) => {
    return accumulator + input * Math.pow(1000, 2 - index);
  }, 0);
}

async function checkNewBundleVersionIsLatestVersion(bundle) {
  const latestMatchingVersion = await getLatestVersion(bundle);

  if (latestMatchingVersion) {
    const newVersion = bundle.message.version;
    const oldVersion = latestMatchingVersion.version;
    return isVersionNumberGreater(newVersion, oldVersion);
  }

  return true;
}

/* INSERT */
export function addBundleKey(registration) {
  const { name, key } = registration;
  return db.none({
    name: "addBundleKey",
    text: "INSERT INTO bundleKeys(name, key) VALUES ($1, $2)",
    values: [name, key]
  });
}

export async function addBundle(bundle) {
  const { dependencies, hash } = bundle.message;

  const dependencyHashes = await getDependenciesFromNameVersionPairs(
    dependencies
  );

  if (dependencyHashes.length != dependencies.length) {
    throw new DependencyError("Couldn't resolve all bundle dependencies");
  }

  await db.tx(async t => {
    const isLatest = await checkNewBundleVersionIsLatestVersion(bundle);
    const addBundleQuery = addBundleVersion(bundle, isLatest, t);

    const dependencyQueries = dependencyHashes.map(dependencyHash =>
      addDependency(hash, dependencyHash.toString(), t)
    );

    return t.batch([addBundleQuery, ...dependencyQueries]);
  });
}

export function addBundleVersion(bundle, isLatest, transaction) {
  const { name } = bundle;
  const { hash, version } = bundle.message;

  if (!validateVersionNumber(version)) {
    throw new ValidationError(
      `Version number ${version} is not a valid format (xxx.xxx.xxx)`
    );
  }

  const queries = [];

  if (isLatest) {
    queries.push(
      transaction.none({
        name: "setLatestFalse",
        text:
          "UPDATE bundleVersions SET latest='f' WHERE latest='t' AND name=$1",
        values: bundle.name
      })
    );
  }

  queries.push(
    transaction.none({
      name: "addBundleVersion",
      text:
        "INSERT INTO bundleversions(name, hash, version, latest) VALUES ($1, $2, $3, $4)",
      values: [name, hash, version, isLatest]
    })
  );

  return queries;
}

async function addDependency(bundleHash, dependencyHash, dbConn = db) {
  return dbConn.none({
    name: "addDependency",
    text:
      "INSERT INTO bundledependencies(dependent, dependency) VALUES($1, $2)",
    values: [bundleHash, dependencyHash]
  });
}

/* SELECT */
export async function getLatestVersion(bundle) {
  return db.oneOrNone({
    name: "getLatestVersion",
    text: "SELECT * FROM bundleVersions WHERE name=$1 AND latest='t'",
    values: bundle.name
  });
}

export function getBundleKey(name) {
  return db.one({
    name: "getBundleKey",
    text: "SELECT key FROM bundleKeys WHERE name=$1",
    values: name
  });
}

export function getHashFromNameVersionPair(pair) {
  return db.one({
    name: "getHashFromNameVersionPair",
    text: "SELECT hash FROM bundleVersions WHERE name=$1 and version=$2",
    values: [pair.name, pair.version]
  });
}

export function getBundleInformationFromHash(hash) {
  return db.one({
    name: "getBundleInformationFromHash",
    text: "SELECT name, version FROM bundleversions WHERE hash=$1",
    values: hash
  });
}

export async function getDependenciesFromNameVersionPairs(dependencies) {
  if (dependencies.length == 0) return [];
  if (dependencies.length > 1) throw new Error();

  try {
    const dependencyQueryResults = await Promise.all(
      dependencies.map(
        async dependency => await getHashFromNameVersionPair(dependency)
      )
    );
    return dependencyQueryResults.map(query => query.hash);
  } catch (e) {
    return [];
  }
}

export function getDependencyInformation(bundleHash) {
  return db.oneOrNone({
    name: "getDependencyInformation",
    text:
      "SELECT bundleVersions.* FROM bundleVersions INNER JOIN bundleDependencies " +
      "ON bundleVersions.hash = bundleDependencies.dependency " +
      "WHERE bundleDependencies.dependent = $1",
    values: bundleHash
  });
}

export async function resolveBundleDependencies(bundleNameVersionPair) {
  const { name, version } = bundleNameVersionPair;

  let hash;
  try {
    const queryResult = await getHashFromNameVersionPair(bundleNameVersionPair);
    hash = queryResult.hash;
  } catch (err) {
    if (err instanceof pgp.errors.QueryResultError) {
      if (err.code === pgp.errors.queryResultErrorCode.noData) {
        throw new Error("no data error");
      }
    }
  }

  const dependencies = [{ name, version, hash }];

  while (true) {
    let nextDependency = await getDependencyInformation(
      dependencies[dependencies.length - 1].hash
    );

    if (nextDependency == null) {
      break;
    }

    const { name, hash, version } = nextDependency;

    dependencies.push({ name, hash, version });
  }

  return dependencies.reverse();
}

/* DELETE */
export async function clearDatabase() {
  await db.result({
    name: "deleteBundleDependencies",
    text: "delete from bundledependencies"
  });

  await db.result({
    name: "deleteBundleDependencies",
    text: "delete from bundleversions"
  });

  await db.result({
    name: "deleteBundleKeys",
    text: "delete from bundleKeys"
  });
}
