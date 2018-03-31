import { NamespaceController } from "../../controllers/namespace";

import { BaseRoute } from "../route";
import namespaceRegistrationSchema from "../schemas/namespace-registration";

import { Request, Response, Router } from "express";
import { validate } from "express-jsonschema";

export class PostNamespaceRoute extends BaseRoute {
  public static create(router: Router) {
    router.post(
      "/POST/namespace",
      validate({ body: namespaceRegistrationSchema }),
      NamespaceController.registerNamespace
    );
  }
}
