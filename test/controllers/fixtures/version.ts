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

const environmentManifest = (
  name: string,
  version: string,
  bundleManifests,
  dependencies = undefined
) => ({ bundleManifests, dependencies, name, version });

export const dllManifest = bundleManifest("1", "dll");
export const envManifest = bundleManifest("2", "env");
export const dependencyManifest = bundleManifest("3", "dll");

export const versionLookupResult = environmentManifest(
  requestHeaders.name,
  requestHeaders.version,
  [dllManifest, envManifest],
  [environmentManifest("testEnvironment", "0.0.1", [dependencyManifest])]
);

export const versionLookupTransform = {
  bundles: [dllManifest, envManifest],
  dependencies: [{
    bundles: [dependencyManifest],
    name: "testEnvironment",
    version: "0.0.1"
  }],
  name: requestHeaders.name,
  version: requestHeaders.version
}
