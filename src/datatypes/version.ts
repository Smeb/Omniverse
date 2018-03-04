import { Bundle, IBundleRegistration, versionRegex } from "../database/models/bundle";

export class Version {
  public valid;
  private name: string;
  private version: string;

  constructor(registration: IBundleRegistration) {
    const { name, version } = registration;
    this.name = name;
    this.version = version;
    this.valid = versionRegex.test(version);
  }

  public async isLatest() {
    const latestVersion = await this.getLatestVersion();

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

  private getLatestVersion() {
    return Bundle.findOne({
      where: {
        latest: true,
        name: this.name
      }
    });
  }
}
