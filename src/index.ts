import dotenvx from "@dotenvx/dotenvx";
dotenvx.config();
import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import { createTerminus } from "@godaddy/terminus";
import { client as redisClient } from "@config/redis";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";
import { limiter } from "@middleware/rateLimit";
import goldPricesRouter from "@routes/goldPrices";
import { initTelegramBot } from "@services/telegram";
import path from "path";

const PORT = process.env.PORT || 3000;

const app = express();
app.set("trust proxy", 1);
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Add Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

// rate limit api
app.use(limiter);

// Add the gold prices router
app.use("/v1/gold-prices", goldPricesRouter);

function onHealthCheck() {
  return Promise.all([
    // check redis connection
    redisClient.ping().then((res) => {
      return {
        redis: "ok",
      };
    }),
  ]);
}

function onSignal() {
  console.log("server is starting cleanup");
  // close db connections, etc
  return Promise.all([
    redisClient
      .quit()
      .then(() => console.log("redis disconnected successfully"))
      .catch((err) =>
        console.error("error during redis disconnection", err.stack)
      ),
  ]);
}

function onShutdown() {
  console.log("cleanup finished, server is shutting down");
  return Promise.resolve();
}

const terminusOptions = {
  signals: ["SIGINT", "SIGTERM"],
  timeout: 10000,
  healthChecks: { "/": onHealthCheck },
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
  },
  onSignal,
  onShutdown,
};

const server = http.createServer(app);

// graceful shutdown
createTerminus(server, terminusOptions);

server.listen(PORT, () => {
  console.log(`Server is running on port :${PORT}`);
  // Initialize Telegram bot
  setTimeout(() => {
    initTelegramBot();
  }, 30_000);
});
