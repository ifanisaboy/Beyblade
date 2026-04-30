require("dotenv").config();

const { createBot } = require("./bot");
const { DEFAULT_PORT, requireEnv } = require("./config");

async function main() {
  const token = requireEnv("TG_BOT_TOKEN");
  const webhookUrl = process.env.TG_BOT_WEBHOOK_URL?.trim() || "";
  const port = Number(process.env.PORT || DEFAULT_PORT);

  await createBot({ token, webhookUrl, port });

  if (webhookUrl) {
    console.log(`Bot started in webhook mode on port ${port}`);
  } else {
    console.log("Bot started in polling mode");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
