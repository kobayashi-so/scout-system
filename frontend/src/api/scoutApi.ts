import type {
  CreateScoutPayload,
  DuplicateScoutPayload,
  RemandPayload,
  ResubmitRemandedPayload,
  ScoutComment,
  ScoutEntity,
  WorkflowActionPayload,
} from "../type/scout";
import { apiClient } from "./client";

export type ScoutListType = "my" | "sales_pending" | "final_pending" | "trash";

export async function fetchScoutsByType(
  type: ScoutListType,
): Promise<ScoutEntity[]> {
  const { data } = await apiClient.get<ScoutEntity[]>("/api/scouts", {
    params: { type },
  });
  return data;
}

export async function fetchScouts(options?: {
  includeDeleted?: boolean;
}): Promise<ScoutEntity[]> {
  const { data } = await apiClient.get<ScoutEntity[]>("/api/scouts", {
    params: {
      includeDeleted: options?.includeDeleted ? "true" : undefined,
    },
  });
  return data;
}

export async function fetchScoutDetail(scoutId: string): Promise<ScoutEntity> {
  // レビュー画面で利用するスカウト詳細を取得
  const { data } = await apiClient.get<ScoutEntity>(`/api/scouts/${scoutId}`);
  return data;
}

export async function fetchScoutComments(
  scoutId: string,
): Promise<ScoutComment[]> {
  // 差戻しコメント履歴（最新順）を取得
  const { data } = await apiClient.get<ScoutComment[]>(
    `/api/scouts/${scoutId}/comments`,
  );
  return data;
}

export async function createScout(
  payload: CreateScoutPayload,
): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>("/api/scouts", payload);
  return data;
}

export async function approveScout(
  payload: WorkflowActionPayload,
): Promise<ScoutEntity> {
  // leader承認: waiting_leader -> waiting_admin
  const { data } = await apiClient.post<ScoutEntity>("/api/approve", payload);
  return data;
}

export async function finalApproveScout(
  payload: WorkflowActionPayload,
): Promise<ScoutEntity> {
  // admin最終承認: waiting_admin -> approved
  const { data } = await apiClient.post<ScoutEntity>(
    "/api/final-approve",
    payload,
  );
  return data;
}

export async function remandScout(
  payload: RemandPayload,
): Promise<ScoutEntity> {
  // 差戻し: status -> remanded、コメントは別テーブルに保存
  const { data } = await apiClient.post<ScoutEntity>("/api/remand", payload);
  return data;
}

export async function resubmitRemandedScout(
  scoutId: string,
  payload: ResubmitRemandedPayload,
): Promise<ScoutEntity> {
  // 差戻し編集画面からの再申請API
  const { data } = await apiClient.post<ScoutEntity>(
    `/api/scouts/${scoutId}/resubmit`,
    payload,
  );
  return data;
}

export async function saveDraftScout(
  scoutId: string,
  payload: ResubmitRemandedPayload,
): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>(
    `/api/scouts/${scoutId}/save-draft`,
    payload,
  );
  return data;
}

export async function duplicateScout(
  scoutId: string,
  payload: DuplicateScoutPayload,
): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>(
    `/api/scouts/${scoutId}/duplicate`,
    payload,
  );
  return data;
}

export async function softDeleteScout(scoutId: string): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>(
    `/api/scouts/${scoutId}/delete`,
  );
  return data;
}

export async function restoreScout(scoutId: string): Promise<ScoutEntity> {
  const { data } = await apiClient.post<ScoutEntity>(
    `/api/scouts/${scoutId}/restore`,
  );
  return data;
}

export async function hardDeleteScout(
  scoutId: string,
): Promise<{ deleted: boolean }> {
  const { data } = await apiClient.delete<{ deleted: boolean }>(
    `/api/scouts/${scoutId}`,
  );
  return data;
}
