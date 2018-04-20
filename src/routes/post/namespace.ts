import { registerNamespace } from "../../controllers/namespace";

import namespaceRegistrationSchema from "../schemas/namespace-registration";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class PostNamespaceRoute {
  public static create(router: Router) {
    router.post(
      "/POST/namespace",
      validate({ body: namespaceRegistrationSchema }),
      registerNamespace
    );
  }
}
