export interface IDependency {
  name: string,
  version: string
}

export interface IBundleRegistration {
  dependencies: IDependency[];
  signature: string;
  name: string;
  uri: string;
  version: string;
}

export interface IBundleRecord {
  id: number;
  name: string;
  uri: string;
  version: string;
  isLatest: boolean;
}

export interface IKeyRegistration {
  bundleNamespace: string;
  key: string;
};

export interface IBundleUpdate {
  name: string;
  uri: string;
  version: string;
  signature: string;
};
