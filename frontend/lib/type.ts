export interface NotificationItem {
  id: number;
  user_email: string;
  sender_name: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse {
  notifications: NotificationItem[];
  unread_count: number;
  total: number;
  page: number;
  limit: number;
}

export type Tab = "all" | "unread";
