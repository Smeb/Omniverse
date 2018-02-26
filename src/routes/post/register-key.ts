import keyRegistrationSchema from "../schemas/key-registration";
import { validate } from "express-jsonschema";
import { Request, Response, Router } from "express";
import { BaseRoute } from "../route";
import { KeyController } from "../../controllers/key";

export class RegisterKeyRoute extends BaseRoute {
  constructor() {
    super();
  }

  public process(req: Request, res: Response) {
    KeyController.RegisterKey(req.body);
  }

  public static create(router: Router) {
    console.log("[RegisterKeyRoute::create] creating RegisterKey route");

    router.get(
      "/POST/RegisterKey",
      validate({ body: keyRegistrationSchema }),
      (req: Request, res: Response) => {
        new RegisterKeyRoute().process(req.body, res);
      }
    );
  }
}
