export interface StorefrontProductFile {
  id: number; name: string; contentType: string; fileSize: number; isDefault: boolean; url: string;
}
export interface StorefrontProduct {
  id: number; name: string; code: string; slug: string;
  shortDescription: string | null; fullDescription: string | null;
  price?: number | null; offerPrice?: number | null; currentPrice?: number | null;
  stockCount: number; createdTime: string; lastUpdatedTime: string;
  categories: { id: number; name: string; uniqueKey: string }[];
  files: StorefrontProductFile[];
}
export interface StorefrontProductList {
  categoryId: number | null; categoryName: string | null; totalCount: number; items: StorefrontProduct[];
}
