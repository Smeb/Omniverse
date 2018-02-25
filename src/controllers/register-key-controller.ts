import { KeyService } from "../services/keyService";
import { KeyCreationRequest } from "../models/key";

export class KeyController extends Controller {
  public async RegisterKey(requestBody: KeyCreationRequest) : Promise<void> {
    new KeyService.create(request);
    this.setStatus(201);
    return Promise.resolve();
  }
}
