import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

if (process.env.SERVER_KEY === undefined) {
  throw new Error(
    "Server key is not defined. Set environment varibale SERVER_KEY to the server public key path"
  );
}

const keyPath = path.resolve(process.env.SERVER_KEY);

if (!fs.existsSync(keyPath)) {
  throw new Error(
    `Key file ${keyPath} could not be found}`
  );
}

export const serverPublicKey = fs.readFileSync(keyPath).toString();

// Check the key is a valid key in .PEM format
try {
  crypto.publicEncrypt(serverPublicKey, Buffer.from("Test"));
} catch (e) {
  const errorMessage = `Key in file ${keyPath} was not a valid public key in PEM format`;
  const errorInstructions1 = `To create a public/private key pair: ssh-keygen -t rsa -b 4096`;
  const errorInstructions2 = `To encode the produced public key in PEM format: ssh-keygen -f <public key> -e -m pem > key.pub`;
  const errorInstructions3 = `Afterwards, chmod 600 key.pub to set rw (owner only)`;

  throw new Error([errorMessage, errorInstructions1, errorInstructions2, errorInstructions3].join("\n\t"));
}
