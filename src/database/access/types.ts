export interface IDependency {
  name: string,
  version: string
}
export interface IBundleRegistration extends IBundleRecord {
  dependencies: IDependency[];
  signature: string;
}
export interface IBundleRecord {
  name: string;
  hash: string;
  version: string;
}
export interface IKeyRegistration {
  name: string;
  key: string;
};
