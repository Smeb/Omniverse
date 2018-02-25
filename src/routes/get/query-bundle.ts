import { Request, Response, Router } from "express";
import { BaseRoute } from "../route";

export class QueryBundleRoute extends BaseRoute {
  constructor() {
    super();
  }

  public process(req: Request, res: Response) {
    console.log("Query on QueryBundleRoute");
  }

  public static create(router: Router) {
    console.log("[QueryBundleRoute::create] creating QueryBundle route");

    router.get("/GET/QueryBundle", (req: Request, res: Response) => {
        new QueryBundleRoute().process(req, res);
    });
  }
}
