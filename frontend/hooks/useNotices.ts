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
    let userId = '';
    let userRole = '';
    let courseCd = '';
    let deptId = '';
    let batchCd = '';
    let branchCd = '';
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          const p = u.profile || u || {};
          userId = p.registration_no || u.id || u.sub || u.userId || u.registration_no || u.username || '';
          userRole = u.role || p.role || '';
          courseCd = p.course_cd || u.course_cd || u.courseCd || '';
          deptId = p.department_id || u.department_id || p.department || '';
          batchCd = p.batch_cd || u.batch_cd || p.batch_year || u.batchCd || '';
          branchCd = p.branch_id || p.branch_cd || u.branchCd || '';
        }
      } catch {}
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': tenantSlug,
      'x-user-id': userId,
      'x-user-role': userRole,
      'x-user-course-cd': courseCd,
      'x-user-dept-id': deptId,
      'x-user-batch-cd': batchCd,
      'x-user-branch-cd': branchCd,
    };
  }, [getTenantSlug]);

  const getReadCache = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const cached = localStorage.getItem('read_notices');
      if (cached) return new Set(JSON.parse(cached));
    } catch {}
    return new Set();
  };

  const addNoticeToReadCache = (noticeId: string) => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem('read_notices');
      const ids: string[] = cached ? JSON.parse(cached) : [];
      if (!ids.includes(noticeId)) {
        ids.push(noticeId);
        localStorage.setItem('read_notices', JSON.stringify(ids));
      }
    } catch {}
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/notices/unread-count?tenant=${slug}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const readCache = getReadCache();
          if (readCache.size > 0) {
            setUnreadCount((prev) => ({
              ...json.data,
              totalUnread: Math.max(0, json.data.totalUnread - readCache.size),
            }));
          } else {
            setUnreadCount(json.data);
          }
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
          const list: NoticeItem[] = json.data || json || [];
          const readCache = getReadCache();

          // Resolve logged-in student program to ensure strict department / program isolation
          let studentCourse = '';
          let studentDept = '';
          if (typeof window !== 'undefined') {
            try {
              const cachedStr = localStorage.getItem('user');
              if (cachedStr) {
                const parsed = JSON.parse(cachedStr);
                const p = parsed?.profile || parsed || {};
                studentCourse = String(p.course_name || p.course_cd || parsed?.courseName || parsed?.courseCd || '').toUpperCase().trim();
                studentDept = String(p.department_name || parsed?.departmentName || parsed?.department || '').toUpperCase().trim();
              }
            } catch {}
          }

          const isMba = studentCourse.includes('MBA') || studentCourse === '4' || studentDept.includes('MBA');
          const isBca = studentCourse.includes('BCA') || studentCourse === '13' || studentDept.includes('BCA');

          const scopedList = (Array.isArray(list) ? list : []).filter((n) => {
            const targets = Array.isArray(n.targets) ? n.targets : [];
            const hasRestrictedTargets = targets.some((t) =>
              ['course', 'department', 'branch'].includes(String(t.target_type).toLowerCase()),
            );

            // If notice is tagged specifically for a different course, reject it
            if (isMba) {
              const targetsOther = targets.some((t) => {
                const val = String(t.target_value || '').toUpperCase();
                return val.includes('BCA') || val.includes('B.TECH') || val.includes('MCA') || val === '13';
              });
              if (targetsOther) return false;
              if (n.title && (n.title.toUpperCase().includes('[BCA]') || n.title.toUpperCase().includes('BCA BATCH'))) return false;
            } else if (isBca) {
              const targetsOther = targets.some((t) => {
                const val = String(t.target_value || '').toUpperCase();
                return val.includes('MBA') || val.includes('B.TECH') || val === '4';
              });
              if (targetsOther) return false;
              if (n.title && (n.title.toUpperCase().includes('[MBA]') || n.title.toUpperCase().includes('MBA BATCH'))) return false;
            }

            return true;
          });

          const mergedList = scopedList.map((n) => {
            if (readCache.has(n.id)) {
              return { ...n, is_read: true };
            }
            return n;
          });
          setNotices(mergedList);

          // Update unread count based on merged read state
          const unreadItems = mergedList.filter((n) => !n.is_read);
          setUnreadCount({
            totalUnread: unreadItems.length,
            urgentUnread: unreadItems.filter((n) => n.priority === 'urgent').length,
            importantUnread: unreadItems.filter((n) => n.priority === 'important').length,
            normalUnread: unreadItems.filter((n) => n.priority === 'normal').length,
          });
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
    addNoticeToReadCache(noticeId);
    setNotices((prev) => {
      const updated = prev.map((n) =>
        n.id === noticeId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
      );
      const unreadItems = updated.filter((n) => !n.is_read);
      setUnreadCount({
        totalUnread: unreadItems.length,
        urgentUnread: unreadItems.filter((n) => n.priority === 'urgent').length,
        importantUnread: unreadItems.filter((n) => n.priority === 'important').length,
        normalUnread: unreadItems.filter((n) => n.priority === 'normal').length,
      });
      return updated;
    });

    try {
      const slug = getTenantSlug();
      await fetch(`${API_BASE}/notices/${noticeId}/read?tenant=${slug}`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
    } catch (err) {
      console.error('Failed to mark notice as read on server:', err);
    }
  };

  const acknowledgeNotice = async (noticeId: string) => {
    addNoticeToReadCache(noticeId);
    setNotices((prev) => {
      const updated = prev.map((n) =>
        n.id === noticeId
          ? {
              ...n,
              is_read: true,
              read_at: n.read_at || new Date().toISOString(),
              acknowledged: true,
              acknowledged_at: new Date().toISOString(),
            }
          : n,
      );
      const unreadItems = updated.filter((n) => !n.is_read);
      setUnreadCount({
        totalUnread: unreadItems.length,
        urgentUnread: unreadItems.filter((n) => n.priority === 'urgent').length,
        importantUnread: unreadItems.filter((n) => n.priority === 'important').length,
        normalUnread: unreadItems.filter((n) => n.priority === 'normal').length,
      });
      return updated;
    });

    try {
      const slug = getTenantSlug();
      await fetch(`${API_BASE}/notices/${noticeId}/acknowledge?tenant=${slug}`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
    } catch (err) {
      console.error('Failed to acknowledge notice on server:', err);
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
