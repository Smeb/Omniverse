import { BundleController } from "../../controllers/bundle";

import { BaseRoute } from "../route";
import bundleSchema from "../schemas/bundle-registration";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class PostBundleRoute extends BaseRoute {
  public static create(router: Router) {
    router.post(
      "/POST/Bundle",
      validate({ body: bundleSchema }),
      BundleController.register
    );
  }
}
