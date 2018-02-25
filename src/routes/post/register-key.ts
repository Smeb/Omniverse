import { Request, Response, Router } from "express";
import { BaseRoute } from "../route";

export class RegisterKeyRoute extends BaseRoute {
  constructor() {
    super();
  }

  public process(req: Request, res: Response) {
    console.log("Query on RegisterKeyRoute");
  }

  public static create(router: Router) {
    console.log("[RegisterKeyRoute::create] creating RegisterKey route");

    router.get("/POST/RegisterKey", (req: Request, res: Response) => {
        new RegisterKeyRoute().process(req, res);
    });
  }
}
