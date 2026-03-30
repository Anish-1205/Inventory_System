'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateProduct, useCategories } from '@/lib/api/hooks';
import { CreateProductSchema } from '@inventory-saas/shared';

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { data: categories } = useCategories();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    unitPrice: '',
    costPrice: '',
    barcode: '',
    categoryId: '',
  });
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const normalizeRequired = (v: string) => v.trim();
    const normalizeOptional = (v: string) => {
      const t = v.trim();
      return t ? t : undefined;
    };

    const payload = {
      name: normalizeRequired(form.name),
      sku: normalizeRequired(form.sku),
      unitPrice: normalizeRequired(form.unitPrice),
      costPrice: normalizeOptional(form.costPrice),
      barcode: normalizeOptional(form.barcode),
      categoryId: normalizeOptional(form.categoryId),
    };

    const parsed = CreateProductSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Validation error');
      return;
    }

    try {
      await createProduct.mutateAsync(parsed.data);
      router.push('/products');
    } catch (err: unknown) {
      const responseData = (err as { response?: { data?: unknown } })?.response?.data as
        | { error?: string; details?: unknown }
        | undefined;

      const apiErrorMessage = responseData?.error;

      // Fastify zod error handler returns: { error: 'Validation failed', details: fieldErrors }
      const details = responseData?.details as Record<string, unknown> | undefined;
      const detailsFirstMessage =
        details && typeof details === 'object'
          ? Object.values(details)
              .flatMap((v) => (Array.isArray(v) ? v : []))
              .find((v) => typeof v === 'string' && v.length > 0)
          : undefined;

      setError(
        apiErrorMessage ?? detailsFirstMessage ?? (err as { message?: string }).message ?? 'Failed to create product',
      );
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Product</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
          <input
            name="sku"
            value={form.sku}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
          <input
            name="unitPrice"
            value={form.unitPrice}
            onChange={handleChange}
            required
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
          <input
            name="costPrice"
            value={form.costPrice}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
          <input
            name="barcode"
            value={form.barcode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">— None —</option>
            {(categories ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createProduct.isPending}
            className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {createProduct.isPending ? 'Creating...' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
