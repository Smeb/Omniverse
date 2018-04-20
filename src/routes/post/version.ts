import { registerVersion } from "../../controllers/version";

import registerBundleSchema from "../schemas/bundle-registration";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class PostVersionRoute {
  public static create(router: Router) {
    router.post(
      "/POST/version",
      validate({ body: registerBundleSchema }),
      registerVersion
    );
  }
}
