/* models/favoriteModel.ts */
import { prisma } from "@/lib/prisma";
import type { Favorite, Product } from "@prisma/client";

export async function addFavorite(userId: string, productId: string) {
  return prisma.favorite.create({ data: { userId, productId } });
}

export async function removeFavorite(userId: string, productId: string) {
  // use deleteMany to be idempotent
  const result = await prisma.favorite.deleteMany({ where: { userId, productId } });
  return result.count > 0;
}

export async function isFavorite(userId: string, productId: string) {
  const f = await prisma.favorite.findFirst({ where: { userId, productId } });
  return !!f;
}

export async function listFavoritesByUser(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          translations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
