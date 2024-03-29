#!/usr/bin/env node
"use strict"

require("dotenv").config();

var server = require("../dist/server");
var debug = require("debug")("express:server");
var http = require("http");

require("source-map-support").install();

var httpPort = normalisedPort(process.env.SERVER_PORT || 8080);
var app = server.Server.bootstrap().app;
app.set("port", httpPort);
var httpServer = http.createServer(app);

httpServer.listen(httpPort)
httpServer.on("error", onError);
httpServer.on("listening", onListening);

function normalisedPort(value) {
  var port = parseInt(value, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var port = error.port;

  var bind = typeof port === "string"
    ? "Pipe " + port
    : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = httpServer.address();
  var bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;

  debug("Listening on " + bind);
}
