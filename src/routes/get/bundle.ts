import { BaseRoute } from "../route";

import { BundleController } from "../../controllers/bundle";

import { Request, Response, Router } from "express";

export class GetBundleRoute extends BaseRoute {
  public static create(router: Router) {
    router.get("/GET/Bundle", BundleController.getBundle);
  }

  constructor() {
    super();
  }
}
