export interface InventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  // Present when the server includes product details for human-friendly display.
  // In offline mode / older records these may be null/undefined.
  productName?: string | null;
  productSku?: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustInventoryRequest {
  adjustment: number;
  reason: string;
}

export interface UpdateInventoryRequest {
  reorderPoint?: number;
}
