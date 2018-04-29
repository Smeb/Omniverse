import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

export function signBundleRequest(bundleRequest, privateKey) {
  const message = formatMessage(bundleRequest);
  const signature = sign(message, privateKey);
  return signature;
}

export function signKeyRequest(namespace, developerKey, privateKey) {
  const message = namespace + developerKey;
  const signature = sign(message, privateKey);
  return signature;
}

function sign(message, privateKey) {
  const signatory = crypto.createSign("RSA-SHA256");

  signatory.update(message);

  const publicKeyPath = path.resolve("./credentials/key.pub")
  return signatory.sign(privateKey);
}

function formatMessage(body) {
  const { name, version, bundles, dependencies } = body;

  const bundleString = bundles
    .map(bundle => {
      const { type, uri, crc, hash } = bundle;
      return type + uri + crc + hash;
    })
    .join('');

  const dependencyString = dependencies
    .map(dependency => dependency.name + dependency.version)
    .join('');

  return name + version + bundleString + dependencyString;
}
