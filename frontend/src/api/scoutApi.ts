import type { ScoutEntity } from '../type/scout'
import { apiClient } from './client'

export type ScoutListType = 'my' | 'sales_pending' | 'final_pending'

export async function fetchScoutsByType(type: ScoutListType): Promise<ScoutEntity[]> {
  const { data } = await apiClient.get<ScoutEntity[]>('/api/scouts', {
    params: { type },
  })
  return data
}

export async function fetchScouts(): Promise<ScoutEntity[]> {
  const { data } = await apiClient.get<ScoutEntity[]>('/api/scouts')
  return data
}

export async function createScout(payload: ScoutEntity): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>('/api/scouts', payload)
  return data
}
