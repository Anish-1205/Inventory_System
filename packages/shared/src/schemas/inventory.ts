import { z } from 'zod';

export const AdjustInventorySchema = z.object({
  adjustment: z.number().int(),
  reason: z.string().min(1).max(500),
});

export const UpdateInventorySchema = z.object({
  reorderPoint: z.number().int().min(0).optional(),
});

export type AdjustInventoryInput = z.infer<typeof AdjustInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof UpdateInventorySchema>;
