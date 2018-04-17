import { BaseRoute } from "../route";

import { getVersion } from "../../controllers/version";

import { Request, Response, Router } from "express";

export class GetVersionRoute extends BaseRoute {
  public static create(router: Router) {
    router.get("/GET/version", getVersion);
  }

  constructor() {
    super();
  }
}
