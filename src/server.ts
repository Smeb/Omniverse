import * as bodyParser from "body-parser";
import * as express from "express";
import * as expressWinston from "express-winston";
import * as fs from "fs";
import * as winston from "winston";

import { JsonSchemaValidation } from "express-jsonschema";

import ExpectedError from "./errors/expected";
import { GetBundleRoute } from "./routes/get/bundle";
import { PostBundleRoute } from "./routes/post/bundle";
import { PostKeyRoute } from "./routes/post/key";

import { sequelize } from "./database/access/sequelize";

export class Server {
  public static bootstrap(): Server {
    return new Server();
  }

  public errorLogger;

  public app: express.Application;

  constructor() {
    this.app = express();
    this.database();
    this.config();
    this.logging();
    this.routes();
  }

  private config() {
    this.app.use(bodyParser.json());
  }

  private async database() {
    sequelize.sync({ force: true });
  }

  private routes() {
    const router: express.Router = require("express-promise-router")();

    GetBundleRoute.create(router);
    PostBundleRoute.create(router);
    PostKeyRoute.create(router);

    this.errors(router);

    this.app.use(router);
  }

  private mkdirs(directories: string[]) {
    directories.map(directory => {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
      }
    });
  }

  private logging() {
    const logdir = process.env.logdir ? process.env.logdir : "./logs";
    const errorsLogDir = `${logdir}/errors`;
    const requestsLogDir = `${logdir}/requests`;

    this.mkdirs([logdir, errorsLogDir, requestsLogDir]);

    const error = `${logdir}/-requests`;
    const level = process.env.NODE_ENV === "development" ? "debug" : "info";

    // Requests logging
    this.app.use(
      expressWinston.logger({
        transports: [
          new (require("winston-daily-rotate-file"))({
            filename: `${requestsLogDir}/%DATE%.log`,
            level,
            prepend: true
          })
        ]
      })
    );

    // Error logging
    this.errorLogger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,
          json: true
        }),
        new (require("winston-daily-rotate-file"))({
          filename: `${errorsLogDir}/%DATE%.log`,
          json: true,
          level,
          prepend: true
        })
      ]
    });
  }

  private errors(router: express.Router) {
    this.schemaErrorsMiddleware(router);
    this.expectedErrorsMiddleware(router);
    this.fallbackErrorMiddleware(router);
  }

  private schemaErrorsMiddleware(router: express.Router) {
    router.use((err, req, res, next) => {
      if (err instanceof JsonSchemaValidation) {
        res.status(400);

        let failures = "";
        if (
          err.validations &&
          err.validations.body &&
          err.validations.body[0]
        ) {
          failures = err.validations.body.map(detail =>
            `${detail.property} failed validation because "${detail.messages}"`
          )
        }
        const responseData = {
          failures,
          statusText: "Request body failed schema validation"
        };

        res.json(responseData);
        res.send();
      } else {
        next(err);
      }
    });
  }

  private logError(err, req, priority) {
    const errorMetadata: any = {
      body: req.body,
      headers: req.headers,
      priority
    };

    if (priority !== 0) {
      errorMetadata.error = {
        ...err,
        stack: err.stack ? err.stack.split("\n") : "no stack information"
      };
    }

    this.errorLogger.error(err.message, errorMetadata);
  }

  private expectedErrorsMiddleware(router: express.Router) {
    router.use((err, req, res, next) => {
      if (err instanceof ExpectedError) {
        this.logError(err, req, 0);
        res.status(400);

        const responseData = {
          statusText: err.message
        };

        res.json(responseData);
        res.send();
      } else {
        next(err);
      }
    });
  }

  private fallbackErrorMiddleware(router: express.Router) {
    router.use((err, req, res, next) => {
      this.logError(err, req, 1);
      res.status(503);

      res.json({
        errorRef: 0,
        statusText: "An application error occurred, could not complete request"
      });

      res.send();
    });
  }
}
