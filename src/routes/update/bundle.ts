import { VersionController } from "../../controllers/version";

import { BaseRoute } from "../route";
import updateBundleSchema from "../schemas/bundle-update";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class UpdateBundleRoute extends BaseRoute {
  public static create(router: Router) {
    router.post(
      "/UPDATE/version",
      validate({ body: updateBundleSchema }),
      VersionController.update
    );
  }
}

