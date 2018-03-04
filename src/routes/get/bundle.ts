import { Request, Response, Router } from "express";
import { BaseRoute } from "../route";

export class GetBundleRoute extends BaseRoute {
  public static create(router: Router) {
    router.get("/GET/Bundle", (req: Request, res: Response) => {
      throw new Error("NotImplemented");
    });
  }

  constructor() {
    super();
  }
}
