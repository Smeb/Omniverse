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
      async (req: Request, res: Response, next) => {
        await KeyController.decodeAndVerifyKey(req, res);
        if (res.headersSent) {
          return;
        }
        next();
      },
      (req: Request, res: Response) => {
        KeyController.registerKey(req.body, res);
      }
    );
  }
}
