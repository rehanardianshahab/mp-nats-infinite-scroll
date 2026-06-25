import api from "./api";
import type { PaginatedResponse } from "./type";

const BASE = "/api/notifications";

export async function fetchNotifications(
  userEmail: string,
  page: number,
  limit: number
): Promise<PaginatedResponse> {
  const { data } = await api.get(BASE, {
    params: { user_email: userEmail, page, limit },
  });
  return data;
}

export async function triggerNotification(payload: {
  user_email: string;
  sender_name: string;
  type: string;
  message: string;
}) {
  const { data } = await api.post(`${BASE}/trigger`, payload);
  return data;
}

export async function markRead(id: number) {
  const { data } = await api.patch(`${BASE}/${id}/read`);
  return data;
}

export async function markAllRead(userEmail: string) {
  const { data } = await api.patch(`${BASE}/read-all`, null, {
    params: { user_email: userEmail },
  });
  return data;
}
