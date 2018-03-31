import { VersionController } from "../../controllers/version";

import { BaseRoute } from "../route";
import registerBundleSchema from "../schemas/bundle-registration";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class PostVersionRoute extends BaseRoute {
  public static create(router: Router) {
    router.post(
      "/POST/version",
      validate({ body: registerBundleSchema }),
      VersionController.register
    );
  }
}
