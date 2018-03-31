export interface IDependency {
  name: string,
  version: string
}

export interface IBundleRegistration {
  dependencies: IDependency[];
  bundles: IBundleInstance[];
  signature: string;
  name: string;
  version: string;
}

export interface IBundleInstance {
  type: string;
  uri: string;
  crc: string;
  hash: string;
}

export interface IBundleRecord {
  id: number;
  name: string;
  uri: string;
  version: string;
  isLatest: boolean;
}

export interface IBundleUpdate {
  name: string;
  uri: string;
  version: string;
  signature: string;
};
