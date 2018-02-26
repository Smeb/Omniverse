import { Request, Response, Router } from "express";
import { BaseRoute } from "../route";

export class RegisterBundleRoute extends BaseRoute {
  constructor() {
    super();
  }

  public process(req: Request, res: Response) {
  }

  public static create(router: Router) {
    console.log("[RegisterBundleRoute::create] creating RegisterBundle route");

    router.get("/POST/RegisterBundle", (req: Request, res: Response) => {
        new RegisterBundleRoute().process(req, res);
    });
  }
}
