import { Router } from "express";
import { getDojiGoldPrices } from "@services/doji";

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

export default router;
