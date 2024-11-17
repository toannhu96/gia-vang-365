import { bot } from "@config/telegram";
import { getDojiGoldPrices } from "@services/doji";
import { Context } from "telegraf";
import { formatGoldPrices } from "../../utils/format";
import { PrismaClient } from "@prisma/client";
import { uuidv7 } from "uuidv7";
import schedule from "node-schedule";
import dayjs from "dayjs";

const prisma = new PrismaClient();

export const broadcastGoldPrices = async () => {
  try {
    console.time("Start broadcasting gold prices");
    const subscribers = await prisma.subscribedTeleUser.findMany({
      where: {
        deletedAt: null,
      },
    });
    const goldPrices = await getDojiGoldPrices();
    const message = formatGoldPrices(goldPrices);

    for (const subscriber of subscribers) {
      try {
        await bot.telegram.sendMessage(subscriber.chatId.toString(), message, {
          parse_mode: "HTML",
        });
      } catch (error) {
        console.error(`Failed to send message to ${subscriber.chatId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error broadcasting gold prices:", error);
  } finally {
    console.timeEnd("Start broadcasting gold prices");
  }
};

export const snapshotGoldPrice = async () => {
  try {
    console.time("Start snapshot gold price");
    const goldPrices = await getDojiGoldPrices();

    const dojiHCMPrice = goldPrices.jewelry.prices.find(
      (price) => price.name === "DOJI HCM lẻ"
    );
    if (!dojiHCMPrice) {
      return;
    }

    const now = dayjs().startOf("minute").toDate();

    await prisma.goldPriceHistory.createMany({
      data: [
        {
          id: uuidv7(),
          price: dojiHCMPrice.buy || 0,
          isSell: false,
          createdAt: now,
        },
        {
          id: uuidv7(),
          price: dojiHCMPrice.sell || 0,
          isSell: true,
          createdAt: now,
        },
      ],
    });
  } catch (error) {
    console.error("Error snapshot gold price:", error);
  } finally {
    console.timeEnd("Start snapshot gold price");
  }
};

export const initTelegramBot = () => {
  bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "gold", description: "Get current gold prices" },
    { command: "subscribe", description: "Subscribe to daily updates" },
    { command: "unsubscribe", description: "Unsubscribe from daily updates" },
    { command: "help", description: "Show this help message" },
  ]);

  // Command to start the bot
  bot.command("start", (ctx: Context) => {
    ctx.reply(
      "🏆 Welcome to Vietnamese Gold Price Bot!\n" +
        "Use /gold to get current gold prices\n" +
        "Use /subscribe to get daily updates at 7 AM\n" +
        "Use /help to see all available commands"
    );
  });

  // Help command
  bot.command("help", (ctx: Context) => {
    ctx.reply(
      "👉 Available commands:\n" +
        "/start - Start the bot\n" +
        "/gold - Get current gold prices\n" +
        "/subscribe - Get daily updates at 7 AM\n" +
        "/unsubscribe - Stop daily updates\n" +
        "/help - Show this help message"
    );
  });

  // Subscribe command
  bot.command("subscribe", async (ctx: Context) => {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        return ctx.reply("Sorry, couldn't get your chat ID.");
      }

      const username = ctx.chat?.username;
      const name = String(
        ctx.chat?.first_name || "" + " " + ctx.chat?.last_name || ""
      ).trim();

      await prisma.subscribedTeleUser.upsert({
        where: { chatId },
        create: {
          chatId,
          username,
          name,
        },
        update: {
          username,
          name,
          deletedAt: null,
        },
      });

      ctx.reply(
        "✅ Subscribed! You'll get daily gold updates at 7 AM (GMT+7).\n" +
          "Use /unsubscribe to opt-out anytime."
      );
    } catch (error) {
      console.error("Error subscribing:", error);
      ctx.reply("Sorry, there was an error processing your subscription.");
    }
  });

  // Unsubscribe command
  bot.command("unsubscribe", async (ctx: Context) => {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        return ctx.reply("Sorry, couldn't get your chat ID.");
      }

      await prisma.subscribedTeleUser.update({
        where: { chatId },
        data: { deletedAt: new Date() },
      });

      ctx.reply(
        "✅ You've been unsubscribed from daily updates.\n" +
          "You can subscribe again anytime using /subscribe."
      );
    } catch (error) {
      console.error("Error unsubscribing:", error);
      ctx.reply("Sorry, there was an error processing your unsubscription.");
    }
  });

  // Gold prices command
  bot.command("gold", async (ctx: Context) => {
    try {
      const goldPrices = await getDojiGoldPrices();
      const formattedMessage = formatGoldPrices(goldPrices);
      await ctx.reply(formattedMessage, { parse_mode: "HTML" });
    } catch (error) {
      console.error("Error fetching gold prices for Telegram:", error);
      await ctx.reply(
        "Sorry, there was an error fetching gold prices. Please try again later."
      );
    }
  });

  // Schedule daily updates at 7 AM (GMT+7)
  const rule = new schedule.RecurrenceRule();
  rule.hour = 7;
  rule.minute = 0;
  rule.tz = "Asia/Ho_Chi_Minh";
  schedule.scheduleJob(rule, broadcastGoldPrices);

  // Schedule snapshot gold price every 6 hours
  schedule.scheduleJob("0 */6 * * *", snapshotGoldPrice);

  // Start the bot
  bot.launch().then(() => {
    console.log("Telegram bot is running");
  });

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
