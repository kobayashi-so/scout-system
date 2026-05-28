import { apiClient } from './client'
import type { checkItem } from '../type/checkItem'

export async function fetchCheckItems(): Promise<checkItem[]> {
  const { data } = await apiClient.get<checkItem[]>('/api/check-items')
  return data.map((item: any) => ({
    id: item.id,
    checkTitle: item.checkTitle,
    display_order: Number(item.display_order ?? item.displayOrder),
    deleted_at: item.deleted_at ?? item.deletedAt ?? null,
  }))
}

export async function createCheckItem(checkTitle: string): Promise<checkItem> {
  const { data } = await apiClient.post<checkItem>('/api/check-items', { checkTitle })
  return {
    id: (data as any).id,
    checkTitle: (data as any).checkTitle,
    display_order: Number((data as any).display_order ?? (data as any).displayOrder),
    deleted_at: (data as any).deleted_at ?? (data as any).deletedAt ?? null,
  }
}

export async function updateCheckItem(id: string, checkTitle: string): Promise<checkItem> {
  const { data } = await apiClient.patch<checkItem>(`/api/check-items/${id}`, { checkTitle })
  return {
    id: (data as any).id,
    checkTitle: (data as any).checkTitle,
    display_order: Number((data as any).display_order ?? (data as any).displayOrder),
    deleted_at: (data as any).deleted_at ?? (data as any).deletedAt ?? null,
  }
}

export async function deleteCheckItem(id: string): Promise<void> {
  await apiClient.delete(`/api/check-items/${id}`)
}
