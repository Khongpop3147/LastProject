/* services/productService.ts */
import * as model from "@/models/productModel";
import * as favModel from "@/models/favoriteModel";

export async function listProducts() {
  return model.findAllProducts();
}

export async function getProduct(id: string) {
  const product = await model.findProductById(id);
  if (!product) throw new Error("Product not found");
  return product;
}

export async function addFavorite(userId: string, productId: string) {
  const product = await model.findProductById(productId);
  if (!product) throw new Error("Product not found");

  try {
    await favModel.addFavorite(userId, productId);
    return { ok: true };
  } catch (err) {
    // If already exists, treat as success
    return { ok: false, error: (err as Error).message };
  }
}

export async function removeFavorite(userId: string, productId: string) {
  await favModel.removeFavorite(userId, productId);
  return { ok: true };
}

export async function listFavorites(userId: string) {
  const rows = await favModel.listFavoritesByUser(userId);
  return rows.map((r) => r.product);
}
