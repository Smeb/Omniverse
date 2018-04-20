import { getVersions } from "../../controllers/version";

import { Request, Response, Router } from "express";

export class GetVersionsRoute {
  public static create(router: Router) {
    router.get("/GET/versions", getVersions);
  }
}
