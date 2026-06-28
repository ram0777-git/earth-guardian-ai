import app from "./app";
import { logger } from "./lib/logger";

console.log("Gemini API Loaded:", !!process.env.GEMINI_API_KEY);

if (!process.env.GEMINI_API_KEY) {
  console.error("[Raksh] GEMINI_API_KEY is missing from environment — Raksh AI will not function.");
} else {
  console.log("[Raksh] GEMINI_API_KEY detected, Gemini will initialize on first request.");
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
