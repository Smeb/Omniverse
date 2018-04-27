import * as crypto from "crypto";

import UserError from "../../errors/user";

export function authenticate(key, message, signature) {
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(message);
  if (!verifier.verify(key, signature)) {
    throw new UserError("Authentication Failed");
  }
}

export function verifyKey(key) {
  try {
    crypto.publicEncrypt(key, Buffer.from("Test"));
    return key;
  } catch (e) {
    throw new UserError(
      "Key should be sent as base64, decoded base64 should be .pem format",
      e
    );
  }
}
