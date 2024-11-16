import { Prisma, PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  // log: ["query", "info", "warn", "error"],
  log: ["warn", "error"],
  transactionOptions: {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // lock both read and write
    maxWait: 60000, // 60 seconds
    timeout: 5 * 60000, // 5 mins
  },
});
