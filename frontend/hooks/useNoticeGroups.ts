'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TargetRule {
  target_type: string;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export function useNoticeGroups() {
  const [groups, setGroups] = useState<NoticeGroupTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/admin/notice-groups?tenant=${slug}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json || [];
        setGroups(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch notice groups:', err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, getTenantSlug]);

  const createGroup = async (dto: { name: string; description?: string; target_rules: TargetRule[] }) => {
    const slug = getTenantSlug();
    const res = await fetch(`${API_BASE}/admin/notice-groups?tenant=${slug}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create notice group template');
    }
    await fetchGroups();
  };

  const updateGroup = async (
    id: string,
    dto: { name: string; description?: string; target_rules: TargetRule[] },
  ) => {
    const slug = getTenantSlug();
    const res = await fetch(`${API_BASE}/admin/notice-groups/${id}?tenant=${slug}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update notice group template');
    }
    await fetchGroups();
  };

  const deleteGroup = async (id: string) => {
    const slug = getTenantSlug();
    const res = await fetch(`${API_BASE}/admin/notice-groups/${id}?tenant=${slug}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete notice group template');
    }
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  useEffect(() => {
    fetchGroups();
  }, []); // Run on initial mount only, avoid continuous re-render loop

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    refreshGroups: fetchGroups,
  };
}
