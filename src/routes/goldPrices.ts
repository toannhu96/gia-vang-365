import { Router } from "express";
import { getDojiGoldPrices } from "@services/doji";
import { prisma } from "@config/db";
import { z } from "zod";
import { groupBy } from "lodash";
import { getOrSet } from "@config/redis";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const router = Router();

/**
 * @swagger
 * /v1/gold-prices:
 *   get:
 *     summary: Get current Vietnamese gold prices
 *     description: Retrieves current Vietnamese gold prices
 *     tags: [Gold Prices]
 *     responses:
 *       200:
 *         description: Successful response with Vietnamese gold prices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currency:
 *                   type: object
 *                   properties:
 *                     dateTime:
 *                       type: string
 *                       format: date-time
 *                     prices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           key:
 *                             type: string
 *                           sell:
 *                             type: number
 *                           buy:
 *                             type: number
 *                 jewelry:
 *                   type: object
 *                   properties:
 *                     dateTime:
 *                       type: string
 *                       format: date-time
 *                     prices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           key:
 *                             type: string
 *                           sell:
 *                             type: number
 *                           buy:
 *                             type: number
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const goldPrices = await getDojiGoldPrices();
    res.json(goldPrices);
  } catch (error) {
    console.error("Error fetching gold prices:", error);
    res.status(500).json({
      error: "Failed to fetch gold prices",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /v1/gold-prices/historical:
 *   get:
 *     summary: Get historical gold prices
 *     description: Retrieves historical gold prices
 *     tags: [Gold Prices]
 *     parameters:
 *       - in: query
 *         name: timerange
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         required: true
 *         description: Timerange to get historical prices
 *     responses:
 *       200:
 *         description: Historical gold prices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   buy:
 *                     type: number
 *                   sell:
 *                     type: number
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get("/historical", async (req, res) => {
  try {
    const querySchema = z.object({
      timerange: z.enum(["day", "week", "month"]).default("week"),
    });

    const query = querySchema.parse(req.query);

    const now = dayjs().startOf("day");

    const prices = await getOrSet(
      `doji:historical:${query.timerange}:${now.toISOString()}`,
      async () =>
        prisma.goldPriceHistory.findMany({
          where: {
            createdAt: {
              gt: now.subtract(1, query.timerange).toDate(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
      5 * 60 // 5 mins
    );
    if (!prices.length) {
      res.json([]);
      return;
    }

    const groupedByDate = groupBy(prices, "createdAt");
    const result = Object.values(groupedByDate)
      .map((item) => {
        return {
          date: item[0].createdAt,
          buy: item.find((i) => !i.isSell)?.price,
          sell: item.find((i) => i.isSell)?.price,
        };
      })
      .sort((a, b) => (dayjs(a.date).isBefore(dayjs(b.date)) ? 1 : -1));

    res.json(result);
  } catch (error) {
    console.error("Error fetching historical prices:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Invalid parameters",
        message: error.format(),
      });
    } else {
      res.status(500).json({
        error: "Failed to fetch historical prices",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

export default router;
