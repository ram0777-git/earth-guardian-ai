import app from "./app";
import { logger } from "./lib/logger";

const geminiKeyPresent = !!process.env.GEMINI_API_KEY;
console.log("Gemini Loaded:", geminiKeyPresent);
console.log("[Raksh] Model: gemini-2.5-flash-lite |", geminiKeyPresent ? "Key detected — Gemini ready" : "GEMINI_API_KEY not set — AI will not function");

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
