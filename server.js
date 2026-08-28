// Server Node.js custom, necessario in molti hosting Plesk (come
// Serverplan) dove l'app va avviata come processo Node persistente
// invece che con "next start" direttamente.
//
// In Plesk, imposta questo file come "Application Startup File".

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> EvolutionTrip pronto su http://${hostname}:${port}`);
  });
});
