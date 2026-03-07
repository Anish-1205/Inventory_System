import Dexie, { type EntityTable } from 'dexie';
import type { Category, InventoryItem, Product } from '@inventory-saas/shared';
import type { OutboxEntry, SyncMeta } from '@inventory-saas/shared';

interface LocalProduct extends Product {
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
}

interface LocalCategory extends Category {
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
}

interface LocalInventory extends InventoryItem {
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
}

class InventoryDatabase extends Dexie {
  products!: EntityTable<LocalProduct, 'id'>;
  categories!: EntityTable<LocalCategory, 'id'>;
  inventory!: EntityTable<LocalInventory, 'id'>;
  outbox!: EntityTable<OutboxEntry, 'id'>;
  syncMeta!: EntityTable<SyncMeta & { id: number }, 'id'>;

  constructor() {
    super('InventoryDB');
    this.version(1).stores({
      products: 'id, tenantId, sku, categoryId, syncStatus',
      categories: 'id, tenantId, slug, syncStatus',
      inventory: 'id, tenantId, productId, syncStatus',
      outbox: 'id, entityType, entityId, syncStatus, createdAt',
      syncMeta: 'id',
    });
  }
}

export const localDb = new InventoryDatabase();
export type { LocalProduct, LocalCategory, LocalInventory };
