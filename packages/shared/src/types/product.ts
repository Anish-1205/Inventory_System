export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  parentId: string | null;
  version: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string | null;
  name: string;
  sku: string;
  barcode: string | null;
  unitPrice: string;
  costPrice: string | null;
  version: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  parentId?: string | null;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  categoryId?: string | null;
  barcode?: string | null;
  unitPrice: string;
  costPrice?: string | null;
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  categoryId?: string | null;
  barcode?: string | null;
  unitPrice?: string;
  costPrice?: string | null;
}
