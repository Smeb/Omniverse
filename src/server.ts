import * as bodyParser from "body-parser";
import * as errorHandler from "errorhandler";
import * as express from "express";
import * as logger from "morgan";

import { GetBundleRoute } from "./routes/get/bundle";
import { PostBundleRoute } from "./routes/post/bundle";
import { PostKeyRoute } from "./routes/post/key";

import { sequelize } from "./database/sequelize";

process.on("unhandledRejection", (p, reason) => {
  console.log(`Unhandled rejection at promise: ${p}, reason: ${reason}`)
});

export class Server {
  public static bootstrap(): Server {
    return new Server();
  }

  public app: express.Application;

  constructor() {
    this.app = express();
    this.database();
    this.config();
    this.routes();
  }

  private config() {
    this.app.use(logger("dev"));
    this.app.use(bodyParser.json());

    if (process.env.NODE_ENV === "development") {
      this.app.use(errorHandler());
    }
  }

  private async database() {
    sequelize.sync({ force: true });
  }

  private routes() {
    const router: express.Router = express.Router();

    GetBundleRoute.create(router);
    PostBundleRoute.create(router);
    PostKeyRoute.create(router);

    this.errors(router);

    this.app.use(router);
  }

  private errors(router: express.Router) {
    this.schemaErrorsMiddleware(router);
    this.bundleErrorsMiddleware(router);
  }

  private schemaErrorsMiddleware(router: express.Router) {
    router.use((err, req, res, next) => {
      if (err.name === "BundleControllerError") {
        res.status(400);

        const responseData = {
          jsonSchemaValidation: true,
          statusText: "Bad Request",
          validations: err.validations
        };

        res.json(responseData);
      } else {
        next(err);
      }
    });
  }

  private bundleErrorsMiddleware(router: express.Router) {
    router.use((err, req, res, next) => {
      if (err.name === "BundleControllerError") {
        res.status(400);

        const responseData = {
          jsonSchemaValidation: true,
          statusText: "Bad Request",
          validations: err.validations
        };

        res.json(responseData);
      } else {
        next(err);
      }
    });
  }
}
