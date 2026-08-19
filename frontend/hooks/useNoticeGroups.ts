'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TargetRule {
  target_type: 'all' | 'role' | 'college' | 'course' | 'branch' | 'batch_year' | 'user';
  target_value: string;
  target_label?: string;
}

export interface NoticeGroupTemplate {
  id: string;
  name: string;
  description?: string;
  target_rules: TargetRule[];
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';

export function useNoticeGroups() {
  const [groups, setGroups] = useState<NoticeGroupTemplate[]>([]);
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

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/admin/notice-groups?tenant=${slug}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch notice groups');
      const json = await res.json();
      const list = json.data !== undefined ? json.data : json;
      setGroups(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Error fetching notice groups:', err);
      setError(err.message || 'Failed to load notice groups');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, getTenantSlug]);

  const createGroup = useCallback(
    async (payload: { name: string; description?: string; target_rules: TargetRule[] }) => {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/admin/notice-groups?tenant=${slug}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to create notice group template');
      }
      const json = await res.json();
      await fetchGroups();
      return json.data;
    },
    [getHeaders, getTenantSlug, fetchGroups],
  );

  const updateGroup = useCallback(
    async (id: string, payload: Partial<NoticeGroupTemplate>) => {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/admin/notice-groups/${id}?tenant=${slug}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to update notice group template');
      }
      await fetchGroups();
    },
    [getHeaders, getTenantSlug, fetchGroups],
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/admin/notice-groups/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete notice group template');
      setGroups((prev) => prev.filter((g) => g.id !== id));
    },
    [getHeaders, getTenantSlug],
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
