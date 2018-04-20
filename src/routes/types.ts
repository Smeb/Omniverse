export interface INamespaceRegistration {
  namespace: string;
  key: string;
};

export interface IDependency {
  name: string,
  version: string
}

export interface IVersionRegistration {
  dependencies: IDependency[];
  bundles: IBundleManifest[];
  signature: string;
  name: string;
  version: string;
}

export interface IBundleManifest {
  type: string;
  uri: string;
  crc: string;
  hash: string;
}

export interface IVersionUpdate {
  name: string;
  uri: string;
  version: string;
  signature: string;
};
