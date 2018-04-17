import { IVersionRegistration } from "../../../routes/types";
import { getLatestVersion } from "../versions";

export const versionRegex = /^(\d{1,3}.){2}\d{1,3}$/;

export class Version {
  public valid;
  private name: string;
  private version: string;

  constructor(registration: IVersionRegistration) {
    const { name, version } = registration;
    this.name = name;
    this.version = version;
    this.valid = versionRegex.test(version);
  }

  public toString() {
    return this.version;
  }

  public async isLatest() {
    const latestVersion = await getLatestVersion(this.name);

    if (latestVersion == null) {
      return true;
    }

    return this.versionGreaterThan(
      this.version,
      latestVersion.dataValues.version
    );
  }

  private versionStringToInt(version: string) {
    // Version format is "xxx.xxx.xxx"
    return version
      .split(".")
      .reduce(
        (accumulator, input, index) =>
          accumulator + Number(input) * Math.pow(1000, 2 - index),
        0
      );
  }

  private versionGreaterThan(versionA: string, versionB: string) {
    // Returns the result of versionA > versionB, where both versions are strings
    const versionAValue = this.versionStringToInt(versionA);
    const versionBValue = this.versionStringToInt(versionB);

    return versionAValue > versionBValue;
  }
}
