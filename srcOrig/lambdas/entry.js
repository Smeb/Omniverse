import http from "http";

http
  .createServer((request, response) => {
    const buffers = [];
    request.on("data", chunk => buffers.push(chunk)).on("end", () => {
      const body = Buffer.concat(buffers).toString();
      console.log(body);
    });
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.write("Hello, world!");
    response.end();
  })
  .listen(process.env.HOST_PORT);

console.log("listening at http://0.0.0.0", process.env.HOST_PORT);
