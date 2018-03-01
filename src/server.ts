import * as bodyParser from "body-parser";
import * as errorHandler from "errorhandler";
import * as express from "express";
import * as logger from "morgan";

import { QueryBundleRoute } from "./routes/get/query-bundle";
import { RegisterBundleRoute } from "./routes/post/register-bundle";
import { RegisterKeyRoute } from "./routes/post/register-key";

import { sequelize } from "./database/sequelize";

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
    sequelize.sync();
  }

  private routes() {
    const router: express.Router = express.Router();

    RegisterBundleRoute.create(router);
    RegisterKeyRoute.create(router);
    QueryBundleRoute.create(router);

    this.errors(router);

    this.app.use(router);
  }

  private errors(router: express.Router) {
    this.schemaErrorsMiddleware(router);
  }

  private schemaErrorsMiddleware(router: express.Router) {
    router.use((err, req, res, next) => {
      if (err.name === "JsonSchemaValidation") {
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
