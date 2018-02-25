import * as bodyParser from "body-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import errorHandler = require("errorhandler");

import { QueryBundleRoute } from "./routes/get/query-bundle";
import { RegisterBundleRoute } from "./routes/post/register-bundle";
import { RegisterKeyRoute } from "./routes/post/register-key";

export class Server {
  public app: express.Application;

  public static bootstrap() : Server {
    return new Server()
  }

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.api();
  }

  private api() {
  }


  private config() {
    this.app.use(logger("dev"));
    this.app.use(bodyParser.json());

    if (process.env.NODE_ENV = "development") {
      this.app.use(errorHandler());
    }
  }

  private routes() {
    const router : express.Router = express.Router();

    RegisterBundleRoute.create(router);
    RegisterKeyRoute.create(router);
    QueryBundleRoute.create(router);

    this.app.use(router);
  }
}
