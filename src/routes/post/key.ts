import { KeyController } from "../../controllers/key";

import { BaseRoute } from "../route";
import keyRegistrationSchema from "../schemas/key-registration";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class PostKeyRoute extends BaseRoute {
  public static create(router: Router) {
    router.post(
      "/POST/Key",
      validate({ body: keyRegistrationSchema }),
      KeyController.registerKey
    );
  }
}
