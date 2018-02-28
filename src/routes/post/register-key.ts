import { KeyController } from "../../controllers/key";

import { BaseRoute } from "../route";
import keyRegistrationSchema from "../schemas/key-registration";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class RegisterKeyRoute extends BaseRoute {
  public static create(router: Router) {
    router.post(
      "/POST/RegisterKey",
      validate({ body: keyRegistrationSchema }),
      (req: Request, res: Response) => {
        new RegisterKeyRoute().process(req, res);
      }
    );
  }

  public process(req: Request, res: Response) {
    KeyController.RegisterKey(req.body, res);
  }
}
