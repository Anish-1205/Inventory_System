import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  parentId: z.string().uuid().nullable().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  categoryId: z.string().uuid().nullable().optional(),
  barcode: z.string().max(100).nullable().optional(),
  unitPrice: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid price format'),
  costPrice: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/, 'Invalid price format')
    .nullable()
    .optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
