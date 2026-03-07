'use client';

import { useState } from 'react';
import { useProducts, useDeleteProduct } from '@/lib/api/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDb } from '@/lib/db/schema';
import { networkMonitor } from '@/lib/sync/network-monitor';
import type { Product } from '@inventory-saas/shared';

export default function ProductsPage() {
  const isOnline = networkMonitor.isOnline;

  // Online: server data via TanStack Query
  const { data: serverProducts, isLoading } = useProducts();

  // Offline: IndexedDB via Dexie live query
  const localProducts = useLiveQuery(() => localDb.products.toArray(), []);

  const products: Product[] = isOnline
    ? (serverProducts ?? [])
    : ((localProducts as unknown as Product[]) ?? []);

  const deleteProduct = useDeleteProduct();
  const [search, setSearch] = useState('');

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading && isOnline) {
    return <div className="text-center py-12 text-gray-500">Loading products...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <a
          href="/dashboard/products/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          Add product
        </a>
      </div>

      <input
        type="text"
        placeholder="Search by name or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">${product.unitPrice}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => deleteProduct.mutate(product.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isOnline && (
        <p className="mt-3 text-xs text-amber-600">
          Offline mode — showing locally cached data
        </p>
      )}
    </div>
  );
}
