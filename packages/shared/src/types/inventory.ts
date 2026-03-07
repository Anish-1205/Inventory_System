export interface InventoryItem {
  id: string;
  tenantId: string;
  productId: string;
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
