import { BundleController } from "../../controllers/bundle";

import { BaseRoute } from "../route";
import bundleSchema from "../schemas/bundle";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class RegisterBundleRoute extends BaseRoute {
  public static create(router: Router) {
    router.post(
      "/POST/RegisterBundle",
      validate({ body: bundleSchema }),
      async (req: Request, res: Response, next) => {
        await BundleController.verifyRegistration(req.body, res);
        if (res.headersSent) {
          return;
        }
        next();
      },
      (req: Request, res: Response) => {
        BundleController.registerBundle(req.body, res);
      }
    );
  }
}
