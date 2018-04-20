import { IVersionRegistration } from "../../../routes/types";

export const versionRegex = /^(\d{1,3}.){2}\d{1,3}$/;

export function validateVersion(version: string) {
  return versionRegex.test(version);
}

function versionStringToInt(version: string) {
  // Version format is "xxx.xxx.xxx"
  return version
    .split(".")
    .reduce(
      (accumulator, input, index) =>
        accumulator + Number(input) * Math.pow(1000, 2 - index),
      0
    );
}

export function compareVersions(versionA: string, versionB: string) {
  // Returns the result of versionA > versionB, where both versions are strings
  const versionAValue = this.versionStringToInt(versionA);
  const versionBValue = this.versionStringToInt(versionB);

  return versionAValue > versionBValue;
}
