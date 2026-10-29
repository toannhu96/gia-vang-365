import fs from "fs";
import dotenvx from "@dotenvx/dotenvx";

if (fs.existsSync(".env")) {
  dotenvx.config();
}
import { Telegraf } from "telegraf";

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
