import { getVersion } from "../../controllers/version";

import { Request, Response, Router } from "express";

export class GetVersionRoute {
  public static create(router: Router) {
    router.get("/GET/version", getVersion);
  }
}
