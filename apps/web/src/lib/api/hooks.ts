'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Product, Category, InventoryItem } from '@inventory-saas/shared';

// ── Products ──────────────────────────────────────────────────────────────────
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/products');
      return data.data as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/${id}`);
      return data.data as Product;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await apiClient.post('/products', payload);
      return data.data as Product;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await apiClient.patch(`/products/${id}`, payload);
      return data.data as Product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

// ── Categories ────────────────────────────────────────────────────────────────
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories');
      return data.data as Category[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await apiClient.post('/categories', payload);
      return data.data as Category;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export function useInventory() {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory');
      return data.data as InventoryItem[];
    },
  });
}

export function useAdjustInventory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { adjustment: number; reason: string }) => {
      const { data } = await apiClient.post(`/inventory/${id}/adjust`, payload);
      return data.data as InventoryItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/me');
      return data.data;
    },
    retry: false,
  });
}
