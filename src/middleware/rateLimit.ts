import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60000, // 60 seconds
  max: 100, // 100 reqs per windowMs
  message: {
    error: "Too many requests",
    message: "Please wait a second before making another request",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
