import { config } from "./config.js";
import { logger } from "./logger.js";
import { createBot } from "./bot/bot.js";
import { createServer } from "./server.js";

const start = async () => {
  if (!config.botToken || config.botToken === "ISI_TOKEN_BOT_DISINI") {
    logger.error("botToken di config.js belum diisi");
    process.exit(1);
  }

  createBot();

  const app = createServer();
  app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`);
  });
};

start().catch((err) => {
  logger.error({ err }, "Fatal error");
  process.exit(1);
});
