import { apiClient } from "./client";
import type {
  RoleType,
  UpdateMyProfilePayload,
  UserResponse,
} from "../type/user";

export async function fetchUsers(): Promise<UserResponse[]> {
  const { data } = await apiClient.get<UserResponse[]>("/api/users");
  return data;
}

export async function updateUserRole(
  userId: string,
  roleType: RoleType,
  actorRoleType: RoleType,
): Promise<UserResponse> {
  const { data } = await apiClient.patch<UserResponse>(
    `/api/users/${userId}/role`,
    {
      roleType,
      actorRoleType,
    },
  );

  return data;
}

export async function deleteUser(
  userId: string,
  actorRoleType: RoleType,
): Promise<void> {
  await apiClient.delete(`/api/users/${userId}`, {
    data: { actorRoleType },
  });
}

export async function updateMyProfile(
  userId: string,
  payload: UpdateMyProfilePayload,
): Promise<UserResponse> {
  const { data } = await apiClient.patch<UserResponse>(
    `/api/users/${userId}/profile`,
    payload,
  );

  return data;
}
