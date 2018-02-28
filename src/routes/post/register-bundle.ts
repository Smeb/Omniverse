import { BundleController } from "../../controllers/bundle";

import { BaseRoute } from "../route";
import bundleSchema from "../schemas/bundle";
import encryptedSchema from "../schemas/encrypted-bundle";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class RegisterBundleRoute extends BaseRoute {
  public static create(router: Router) {
    router.post(
      "/POST/RegisterBundle",
      validate({ body: encryptedSchema }),
      async (req: Request, res: Response, next) => {
        await BundleController.DecryptMessage(req);
        next();
      },
      validate({ body: bundleSchema }),
      (req: Request, res: Response) => {
        new RegisterBundleRoute().process(req, res);
      }
    );
  }

  public process(req: Request, res: Response) {
    BundleController.RegisterBundle(req.body, res);
  }
}
