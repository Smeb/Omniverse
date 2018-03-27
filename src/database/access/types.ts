export interface IDependency {
  name: string,
  version: string
}
export interface IBundleRegistration extends IBundleRecord {
  dependencies: IDependency[];
  signature: string;
}
export interface IBundleRecord {
  id: number;
  name: string;
  hash: string;
  version: string;
  isLatest: boolean;
}
export interface IKeyRegistration {
  bundleNamespace: string;
  key: string;
};
