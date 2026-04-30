# Beyblade Telegram Bot

This project runs a Telegram bot in Node.js and reads note data from the Google Sheet below:

- https://docs.google.com/spreadsheets/d/18zmgvI4P13ddm8xQLN7Fru2c8Ea6305Olr8g5tYJlos/edit?gid=2041609797#gid=2041609797

When the bot receives a Telegram message like `/BX-01`, it looks for a matching value in the sheet's `code` column and replies with:

```text
[code] [name]
[notes]
零售價：[price]
合理溢價：[over_price]
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Fill in `.env`:

```dotenv
TG_BOT_TOKEN=your_telegram_bot_token
TG_BOT_WEBHOOK_URL=
PORT=3000
TG_BOT_COMMANDS=/start:顯示使用方式,/help:查詢格式說明
```

- Leave `TG_BOT_WEBHOOK_URL` empty to use polling.
- Set `TG_BOT_WEBHOOK_URL` to your public HTTPS base URL to use webhook mode.
- `TG_BOT_COMMANDS` is optional and controls Telegram's preset slash-command list.

3. Start the bot:

```bash
npm start
```

## Telegram Command Presets

Telegram can show a preset command list when the user types `/`.

Example:

```dotenv
TG_BOT_COMMANDS=/start:顯示使用方式,/help:查詢格式說明
```

Notes:

- These commands are registered with Telegram using `setMyCommands`.
- They are static suggestions only. Users can still type any `/CODE`.
- Telegram preset command names must use only lowercase letters, digits, and underscores.
- Telegram does not provide live autocomplete from every Google Sheet row in the message box.
