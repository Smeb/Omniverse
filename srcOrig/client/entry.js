import request from "request";
import { bundleA } from "../../test/lambdas/fixtures/bundle-a";

request(
  {
    url: `http://0.0.0.0:${process.env.HOST_PORT}`,
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    json: bundleA
  },
  (error, response, body) => {
    if (!error && response.statusCode === 200) {
      console.log(body);
    } else {
      console.log("error: ", error);
      if (response) {
        console.log("status code: ", response.statusCode);
        console.log("status text: ", response.statusText);
      }
    }
  }
);
