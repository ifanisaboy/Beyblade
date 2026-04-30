const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const { DEFAULT_PORT } = require("./config");
const { SheetStore } = require("./sheetStore");

const WEBHOOK_PATH = "/telegram/webhook";

async function createBot({ token, webhookUrl, port = DEFAULT_PORT }) {
  const store = new SheetStore();
  const useWebhook = Boolean(webhookUrl);

  const bot = new TelegramBot(token, {
    polling: useWebhook
      ? false
      : {
          autoStart: false,
          interval: 1000,
          params: {
            timeout: 10,
          },
        },
    request: {
      family: 4,
    },
  });
  await registerCommands(bot);

  if (useWebhook) {
    const app = express();
    app.use(express.json());

    app.post(WEBHOOK_PATH, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });

    app.get("/health", (_req, res) => {
      res.json({ ok: true });
    });

    app.listen(port, () => {
      console.log(`Webhook server listening on port ${port}`);
    });

    await bot.setWebHook(`${trimTrailingSlash(webhookUrl)}${WEBHOOK_PATH}`);
  } else {
    await bot.deleteWebHook({ drop_pending_updates: false });
    await bot.startPolling();
  }

  bot.on("message", async (msg) => {
    const code = normalizeLookupCode(extractCodeCommand(msg.text));
    if (!code) {
      return;
    }

    if (isHelpCommand(code)) {
      await bot.sendMessage(
        msg.chat.id,
        "請輸入 /[code] 查詢，例如：/CX-16"
      );
      return;
    }

    try {
      const rows = await store.findByCode(code);
      if (rows.length === 0) {
        await bot.sendMessage(msg.chat.id, "沒有此Model資料");
        return;
      }

      await bot.sendMessage(msg.chat.id, formatRowsMessage(rows));
    } catch (error) {
      console.error("Failed to process message", error);
      await bot.sendMessage(msg.chat.id, "讀取資料時發生錯誤，請稍後再試。");
    }
  });

  bot.on("polling_error", (error) => {
    console.error("Polling error", error);
  });

  return bot;
}

async function registerCommands(bot) {
  const commands = parseBotCommands(process.env.TG_BOT_COMMANDS);
  if (commands.length === 0) {
    return;
  }

  await bot.setMyCommands(commands);
}

function extractCodeCommand(text) {
  if (!text) {
    return null;
  }

  const match = text.trim().match(/^\/([^\s@]+)(?:@\S+)?(?:\s|$)/);
  return match ? match[1] : null;
}

function normalizeLookupCode(code) {
  if (!code) {
    return null;
  }

  const trimmed = String(code).trim();
  const compactMatch = trimmed.match(/^([a-zA-Z]{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}`;
  }

  return trimmed;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function formatRowsMessage(rows) {
  return rows
    .map((row) => {
      const lines = [
        `${row.displayCode} ${row.name}`.trim(),
        row.notes,
        `零售價：${row.price}`,
        `合理溢價：${row.overPrice}`,
      ];

      return lines.join("\n");
    })
    .join("\n\n");
}

function parseBotCommands(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [command, ...descriptionParts] = item.split(":");
      const normalizedCommand = command.replace(/^\//, "").trim();
      const description = descriptionParts.join(":").trim();

      if (!normalizedCommand || !description) {
        return null;
      }

      if (!isValidTelegramCommand(normalizedCommand)) {
        console.warn(
          `Skipping invalid Telegram preset command "${normalizedCommand}". ` +
            "Telegram commands must be 1-32 characters using lowercase letters, digits, and underscores."
        );
        return null;
      }

      return {
        command: normalizedCommand,
        description,
      };
    })
    .filter(Boolean);
}

function isHelpCommand(code) {
  const normalized = String(code || "").trim().toLowerCase();
  return normalized === "start" || normalized === "help";
}

function isValidTelegramCommand(command) {
  return /^[a-z0-9_]{1,32}$/.test(command);
}

module.exports = {
  createBot,
};
