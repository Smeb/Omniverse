import { updateVersion } from "../../controllers/version";

import updateBundleSchema from "../schemas/bundle-update";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class UpdateBundleRoute {
  public static create(router: Router) {
    router.post(
      "/UPDATE/version",
      validate({ body: updateBundleSchema }),
      updateVersion
    );
  }
}

