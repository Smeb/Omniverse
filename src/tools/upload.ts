import * as fs from "fs";
import * as fetch from "node-fetch";

import { signKeyRequest } from "./crypt";

import config from "./config";

async function uploadDeveloperKey(adminKeyPath, developerKeyPath, namespace) {
  const adminKey = fs.readFileSync(adminKeyPath).toString();
  const developerKey = fs.readFileSync(developerKeyPath).toString("base64");

  const signature = signKeyRequest(namespace, developerKey, adminKey);

  const url = `http://${config.server.ip}:${config.server.port}/POST/namespace`;
  const body = {
      key: developerKey,
      namespace,
      signature: Buffer.from(signature).toString("base64")
  }

  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });

  return response.json();
}

function usage() {
  console.log( "usage: <path to admin key> <path to developer key> <namespace>");
  console.log( "to generate a key, on the command line use:");
  console.log( "\tssh-keygen -t rsa -b 4096");
}

function main(argv) {
  if (argv.length !== 5) {
    usage();
    return;
  }

  const adminKey = argv[2];
  const developerKey = argv[3];
  const namespace = argv[4];

  if (!fs.existsSync(adminKey)) {
    throw new Error("Couldn't find admin key at " + adminKey);
  } else if (!fs.existsSync(developerKey)) {
    throw new Error("Couldn't find developer key at " + developerKey);
  } else if (namespace.length === 0) {
    throw new Error("namespace can't be an empty string");
  }

  uploadDeveloperKey(adminKey, developerKey, namespace)
    .then(result => console.log(result))
    .catch(error => console.log(error.message));
}

try {
  main(process.argv)
} catch (e) {
  console.log("Error: " + e.message);
}
