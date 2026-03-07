import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';
import { products } from './products.js';

export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantityOnHand: integer('quantity_on_hand').notNull().default(0),
  quantityReserved: integer('quantity_reserved').notNull().default(0),
  reorderPoint: integer('reorder_point').notNull().default(0),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
