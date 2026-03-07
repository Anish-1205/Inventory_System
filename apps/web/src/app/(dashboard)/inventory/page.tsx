'use client';

import { useState } from 'react';
import { useInventory, useAdjustInventory } from '@/lib/api/hooks';
import type { InventoryItem } from '@inventory-saas/shared';

export default function InventoryPage() {
  const { data: items, isLoading } = useInventory();
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState('');
  const [reason, setReason] = useState('');
  const adjustMutation = useAdjustInventory(adjusting ?? '');

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading inventory...</div>;
  }

  async function handleAdjust(id: string) {
    await adjustMutation.mutateAsync({ adjustment: Number(adjustment), reason });
    setAdjusting(null);
    setAdjustment('');
    setReason('');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                On Hand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reserved
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reorder Point
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(items ?? []).map((item: InventoryItem) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-600">
                  {item.productId.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={
                      item.quantityOnHand <= item.reorderPoint
                        ? 'text-red-600 font-semibold'
                        : 'text-gray-900'
                    }
                  >
                    {item.quantityOnHand}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.quantityReserved}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.reorderPoint}</td>
                <td className="px-6 py-4 text-right">
                  {adjusting === item.id ? (
                    <div className="flex items-center gap-2 justify-end">
                      <input
                        type="number"
                        value={adjustment}
                        onChange={(e) => setAdjustment(e.target.value)}
                        placeholder="±qty"
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason"
                        className="w-32 px-2 py-1 border rounded text-sm"
                      />
                      <button
                        onClick={() => handleAdjust(item.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setAdjusting(null)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdjusting(item.id)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Adjust
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
