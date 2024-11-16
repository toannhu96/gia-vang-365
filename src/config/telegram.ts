import dotenvx from "@dotenvx/dotenvx";
dotenvx.config();
import { Telegraf } from "telegraf";

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
