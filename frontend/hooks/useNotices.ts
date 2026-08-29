'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NoticeAttachment {
  id?: string;
  file_name: string;
  file_type?: string;
  file_url: string;
  file_size_kb?: number;
}

export interface NoticeTarget {
  id?: string;
  target_type: string;
  target_value: string;
  target_label?: string;
}

export interface NoticeItem {
  id: string;
  college_id?: string;
  title: string;
  body: string;
  priority: 'normal' | 'important' | 'urgent';
  category: 'announcement' | 'deadline' | 'exam' | 'event' | 'general';
  status: 'draft' | 'scheduled' | 'sent' | 'archived';
  creator_name?: string;
  creator_role?: string;
  scheduled_at?: string;
  expires_at?: string;
  requires_acknowledgement: boolean;
  created_at: string;
  updated_at?: string;
  is_read?: boolean;
  read_at?: string;
  acknowledged?: boolean;
  acknowledged_at?: string;
  attachments?: NoticeAttachment[];
  targets?: NoticeTarget[];
  total_recipients?: number;
  read_count?: number;
  unread_count?: number;
  read_percentage?: number;
  attachments_count?: number;
}

export interface NoticeUnreadCount {
  totalUnread: number;
  urgentUnread: number;
  importantUnread: number;
  normalUnread: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export function useNotices() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<NoticeUnreadCount>({
    totalUnread: 0,
    urgentUnread: 0,
    importantUnread: 0,
    normalUnread: 0,
  });

  const getTenantSlug = useCallback(() => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    return (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('tenant') ||
      localStorage.getItem('institutionSlug') ||
      'srms-cet-bareilly'
    );
  }, []);

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantSlug = getTenantSlug();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': tenantSlug,
    };
  }, [getTenantSlug]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/notices/unread-count?tenant=${slug}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setUnreadCount(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notices unread count:', err);
    }
  }, [getHeaders, getTenantSlug]);

  const fetchNotices = useCallback(
    async (filter?: { category?: string; search?: string; priority?: string }) => {
      try {
        setLoading(true);
        const slug = getTenantSlug();
        const params = new URLSearchParams();
        params.append('tenant', slug);
        if (filter?.category && filter.category !== 'all') {
          params.append('category', filter.category);
        }
        if (filter?.priority && filter.priority !== 'all') {
          params.append('priority', filter.priority);
        }
        if (filter?.search?.trim()) {
          params.append('search', filter.search.trim());
        }

        const res = await fetch(`${API_BASE}/notices?${params.toString()}`, {
          headers: getHeaders(),
        });

        if (res.ok) {
          const json = await res.json();
          const list = json.data || json || [];
          setNotices(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Failed to fetch role notices:', err);
      } finally {
        setLoading(false);
      }
    },
    [getHeaders, getTenantSlug],
  );

  const markAsRead = async (noticeId: string) => {
    try {
      const slug = getTenantSlug();
      await fetch(`${API_BASE}/notices/${noticeId}/read?tenant=${slug}`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      setNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
      );
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark notice as read:', err);
    }
  };

  const acknowledgeNotice = async (noticeId: string) => {
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/notices/${noticeId}/acknowledge?tenant=${slug}`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) {
        setNotices((prev) =>
          prev.map((n) =>
            n.id === noticeId
              ? {
                  ...n,
                  is_read: true,
                  read_at: n.read_at || new Date().toISOString(),
                  acknowledged: true,
                  acknowledged_at: new Date().toISOString(),
                }
              : n,
          ),
        );
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('Failed to acknowledge notice:', err);
    }
  };

  const getNoticeDetail = async (noticeId: string): Promise<NoticeItem | null> => {
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/notices/${noticeId}?tenant=${slug}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch notice detail:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchUnreadCount();
  }, []); // Run on initial mount only, avoid continuous re-render loop

  return {
    notices,
    loading,
    unreadCount,
    fetchNotices,
    fetchUnreadCount,
    markAsRead,
    acknowledgeNotice,
    getNoticeDetail,
  };
}
