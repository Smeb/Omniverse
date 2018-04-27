export const requestHeaders = {
  name: "testEnvironment.a",
  version: "0.0.1"
};

const bundleManifest = (id: string, type: string) => ({
  crc: `test-crc-${id}`,
  hash: `test-hash-${id}`,
  type,
  uri: `test-uri-${id}`
});

export const dllManifest = bundleManifest("1", "dll");
export const envManifest = bundleManifest("2", "env");
export const dependencyDllManifest = bundleManifest("3", "dll");

const makeName = name => ({ name });

const makeEnvironmentVersion = (
  name: string,
  version: string,
  bundleManifests,
  dependencies = undefined
) => {
  const environmentVersion = {
    bundleManifests,
    environmentName: { name },
    version
  };

  if (dependencies === undefined) {
    return environmentVersion
  } else {
    return { ...environmentVersion, dependencies };
  }
};

const dependencyVersionLookupResult = makeEnvironmentVersion(
  "testEnvironment", "0.0.1", [dependencyDllManifest]
);

export const environmentVersionLookupResult = makeEnvironmentVersion(
  requestHeaders.name,
  requestHeaders.version,
  [dllManifest, envManifest],
  [dependencyVersionLookupResult]
);


export const versionLookupTransform = {
  bundles: [dllManifest, envManifest],
  dependencies: [{
    bundles: [dependencyDllManifest],
    name: "testEnvironment",
    version: "0.0.1"
  }],
  name: requestHeaders.name,
  version: requestHeaders.version
}
