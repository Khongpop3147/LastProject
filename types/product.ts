// types/product.ts

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  stock: number;
  salePrice?: number | null;
  categoryId?: string;
  isFeatured: boolean; // ← เพิ่มตรงนี้
}

export interface Category {
  id: string;
  name: string;
  productCount?: number; // จำนวนสินค้าในหมวดหมู่
}
