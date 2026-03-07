'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory } from '@/lib/api/hooks';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createCategory.mutateAsync({ name, slug });
    setName('');
    setSlug('');
    setShowForm(false);
  }

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'Add category'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 bg-white rounded-xl shadow p-4 flex gap-3 items-end"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={createCategory.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Create
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
        {(categories ?? []).length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-400 text-sm">No categories yet</p>
        ) : (
          (categories ?? []).map((cat) => (
            <div key={cat.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.slug}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
