// ===== lib/prisma.ts =====
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient;
}
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
if (process.env.NODE_ENV !== "production") global.prisma = prisma;
