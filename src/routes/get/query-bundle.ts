import { Request, Response, Router } from "express";
import { BaseRoute } from "../route";

export class QueryBundleRoute extends BaseRoute {
  public static create(router: Router) {
    router.get("/GET/QueryBundle", (req: Request, res: Response) => {
        new QueryBundleRoute().process(req, res);
    });
  }

  constructor() {
    super();
  }

  public process(req: Request, res: Response) {
    throw new Error("NotImplemented");
  }
}
