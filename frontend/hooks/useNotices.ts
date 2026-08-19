'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface NoticeAttachment {
  id?: string;
  file_name: string;
  file_type: 'pdf' | 'xlsx' | 'docx' | 'image' | 'other' | string;
  file_url: string;
  file_size_kb?: number;
}

export interface NoticeItem {
  id: string;
  title: string;
  body: string;
  priority: 'normal' | 'important' | 'urgent';
  category: 'announcement' | 'deadline' | 'event' | 'exam' | 'general';
  creator_name: string;
  creator_role?: string;
  status?: string;
  scheduled_at?: string;
  expires_at?: string;
  requires_acknowledgement?: boolean;
  is_read?: boolean;
  read_at?: string;
  acknowledged?: boolean;
  acknowledged_at?: string;
  created_at: string;
  attachments?: NoticeAttachment[];
}

export interface UnreadCountData {
  totalUnread: number;
  urgentUnread: number;
  importantUnread: number;
  normalUnread: number;
}

const API_BASE = 'http://localhost:3001/api/v1';

export function useNotices(filter: string = 'all', category: string = 'all', search: string = '') {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCountData>({
    totalUnread: 0,
    urgentUnread: 0,
    importantUnread: 0,
    normalUnread: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms-ims';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': tenantSlug,
    };
  }, []);

  const getTenantSlug = useCallback(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms-ims';
  }, []);

  // Fetch role-scoped notices
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const slug = getTenantSlug();
      const params = new URLSearchParams();
      params.append('tenant', slug);
      if (filter && filter !== 'all') params.append('filter', filter);
      if (category && category !== 'all') params.append('category', category);
      if (search && search.trim()) params.append('search', search.trim());

      const res = await fetch(`${API_BASE}/notices?${params.toString()}`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch notices: ${res.statusText}`);
      }

      const json = await res.json();
      const list = json.data !== undefined ? json.data : json;
      setNotices(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Error fetching notices:', err);
      setError(err.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, [filter, category, search, getHeaders, getTenantSlug]);

  // Fetch unread count badge stats
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/notices/unread-count?tenant=${slug}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data !== undefined ? json.data : json;
        setUnreadCounts({
          totalUnread: data.totalUnread || 0,
          urgentUnread: data.urgentUnread || 0,
          importantUnread: data.importantUnread || 0,
          normalUnread: data.normalUnread || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  }, [getHeaders, getTenantSlug]);

  // Mark a notice as read (optimistic update + API call)
  const markAsRead = useCallback(
    async (noticeId: string) => {
      // Optimistically update local list state
      setNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
      );

      // Decrement unread counts
      setUnreadCounts((prev) => ({
        ...prev,
        totalUnread: Math.max(0, prev.totalUnread - 1),
      }));

      try {
        const slug = getTenantSlug();
        await fetch(`${API_BASE}/notices/${noticeId}/read?tenant=${slug}`, {
          method: 'PATCH',
          headers: getHeaders(),
        });
      } catch (err) {
        console.error('Failed to mark notice read on server:', err);
      }
    },
    [getHeaders, getTenantSlug],
  );

  // Acknowledge notice
  const acknowledgeNotice = useCallback(
    async (noticeId: string) => {
      setNotices((prev) =>
        prev.map((n) =>
          n.id === noticeId
            ? { ...n, is_read: true, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : n,
        ),
      );

      try {
        const slug = getTenantSlug();
        await fetch(`${API_BASE}/notices/${noticeId}/acknowledge?tenant=${slug}`, {
          method: 'PATCH',
          headers: getHeaders(),
        });
      } catch (err) {
        console.error('Failed to acknowledge notice:', err);
      }
    },
    [getHeaders, getTenantSlug],
  );

  useEffect(() => {
    fetchNotices();
    fetchUnreadCounts();

    // Auto-reflect polling every 12 seconds for fresh updates across tabs/devices
    const timer = setInterval(() => {
      fetchUnreadCounts();
    }, 12000);

    return () => clearInterval(timer);
  }, [fetchNotices, fetchUnreadCounts]);

  return {
    notices,
    unreadCounts,
    loading,
    error,
    refetch: fetchNotices,
    refetchCounts: fetchUnreadCounts,
    markAsRead,
    acknowledgeNotice,
  };
}
