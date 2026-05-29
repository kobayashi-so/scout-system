import type {
  CreateScoutPayload,
  RemandPayload,
  ScoutEntity,
  WorkflowActionPayload,
} from '../type/scout'
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

export async function createScout(payload: CreateScoutPayload): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>('/api/scouts', payload)
  return data
}

export async function approveScout(payload: WorkflowActionPayload): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>('/api/approve', payload)
  return data
}

export async function finalApproveScout(payload: WorkflowActionPayload): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>('/api/final-approve', payload)
  return data
}

export async function remandScout(payload: RemandPayload): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>('/api/remand', payload)
  return data
}
