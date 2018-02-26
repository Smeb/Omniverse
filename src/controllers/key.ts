import { Key } from "../database/models/key";

export class KeyController {
  static async RegisterKey(requestBody) : Promise<void> {
    console.log(requestBody);
  }
}
