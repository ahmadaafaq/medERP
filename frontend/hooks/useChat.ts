'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ChatAttachment {
  id?: string;
  file_name: string;
  file_type?: string;
  file_url: string;
  file_size_kb?: number;
}

export interface ChatMessage {
  id: string;
  chat_group_id: string;
  sender_id?: string;
  sender_name: string;
  sender_role: string;
  sender_avatar?: string;
  body?: string;
  created_at: string;
  attachments?: ChatAttachment[];
}

export interface ChatGroup {
  id: string;
  name: string;
  department_id?: string;
  department_name?: string;
  batch_year: string;
  batch_code?: string;
  description?: string;
  member_count?: number;
  unread_count?: number;
  last_message?: {
    id?: string;
    body?: string;
    sender_id?: string;
    sender_name?: string;
    sender_role?: string;
    created_at?: string;
  };
  created_at?: string;
}

export interface ChatMember {
  id: string;
  user_id: string;
  role: string;
  name: string;
  avatar_url?: string;
  joined_at?: string;
  email?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function useChat(role: 'FACULTY' | 'STUDENT' | 'ADMIN' = 'FACULTY') {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');

  const activeGroupRef = useRef<string | null>(null);
  activeGroupRef.current = selectedGroup?.id || null;

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
    let userId = '2025107990';
    let userName = 'AAFREEN KHAN';
    let userRole = role || 'STUDENT';
    let userAvatar = '';

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          const p = u.profile || u;
          userId = u.id || u.sub || p.registration_no || p.rollno || userId;
          userName = u.name || p.name || userName;
          userRole = u.role || userRole;
          userAvatar = u.photo_url || p.photo_url || p.avatar_url || '';
        }
      } catch {}
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': tenantSlug,
      'x-user-id': userId,
      'x-user-name': userName,
      'x-user-role': userRole,
      'x-user-avatar': userAvatar,
    };
  }, [getTenantSlug, role]);

  // Fetch groups
  const fetchGroups = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingGroups(true);
      const slug = getTenantSlug();
      const params = new URLSearchParams();
      params.append('tenant', slug);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedDeptFilter && selectedDeptFilter !== 'ALL') params.append('department_id', selectedDeptFilter);
      if (selectedYearFilter && selectedYearFilter !== 'ALL') params.append('batch_year', selectedYearFilter);

      const res = await fetch(`${API_BASE}/chat/groups?${params.toString()}`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        let list: ChatGroup[] = json.data || [];

        // When role is STUDENT, strictly filter to show only the logged-in student's registered batch
        if (role === 'STUDENT') {
          let studentBatch = '2025';
          if (typeof window !== 'undefined') {
            try {
              const cachedStr = localStorage.getItem('user');
              if (cachedStr) {
                const parsed = JSON.parse(cachedStr);
                const p = parsed?.profile || parsed || {};
                studentBatch = String(p.batch_year || p.batch_cd || parsed?.batchCd || '2025');
              }
            } catch {}
          }

          list = list.filter((g) => {
            const groupBatch = String(g.batch_year || g.batch_code || '').trim();
            const groupName = String(g.name || '').trim();
            if (studentBatch.includes('2025') || studentBatch === '2') {
              return groupBatch === '2025' || groupBatch === '2' || groupName.includes('2025');
            }
            return groupBatch.includes(studentBatch) || groupName.includes(studentBatch);
          });
        }

        setGroups(list);

        const totalUnread = list.reduce((acc, g) => acc + (g.unread_count || 0), 0);
        setUnreadTotal(totalUnread);

        // Auto select first group if none selected
        if (!activeGroupRef.current && list.length > 0) {
          setSelectedGroup(list[0]);
        } else if (activeGroupRef.current) {
          const matched = list.find((g) => g.id === activeGroupRef.current);
          if (matched) {
            setSelectedGroup((prev) => (prev ? { ...prev, ...matched } : matched));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat groups:', err);
    } finally {
      if (!silent) setLoadingGroups(false);
    }
  }, [getHeaders, getTenantSlug, searchQuery, selectedDeptFilter, selectedYearFilter]);

  // Fetch messages for active group
  const fetchMessages = useCallback(async (groupId: string, silent = false) => {
    try {
      if (!silent) setLoadingMessages(true);
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/chat/groups/${groupId}/messages?limit=100&tenant=${slug}`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        const list: ChatMessage[] = json.data || [];
        setMessages(list);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [getHeaders, getTenantSlug]);

  // Mark group as read
  const markAsRead = useCallback(async (groupId: string) => {
    try {
      const slug = getTenantSlug();
      await fetch(`${API_BASE}/chat/groups/${groupId}/read?tenant=${slug}`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      // update local unread
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, unread_count: 0 } : g)),
      );
      setUnreadTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark group as read:', err);
    }
  }, [getHeaders, getTenantSlug]);

  // Fetch members
  const fetchMembers = useCallback(async (groupId: string) => {
    try {
      setLoadingMembers(true);
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/chat/groups/${groupId}/members?tenant=${slug}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setMembers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch group members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [getHeaders, getTenantSlug]);

  // Send message
  const sendMessage = async (
    body?: string,
    attachments?: ChatAttachment[],
  ): Promise<boolean> => {
    if (!selectedGroup) return false;
    if (!body?.trim() && (!attachments || attachments.length === 0)) return false;

    try {
      setSending(true);
      const slug = getTenantSlug();

      // Current user cache
      let currentUser: any = null;
      let senderId = '2025107990';
      let senderName = 'AAFREEN KHAN';
      let senderRole = role || 'STUDENT';
      let senderAvatar = '';

      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          currentUser = JSON.parse(raw);
          const p = currentUser.profile || currentUser;
          senderId = currentUser.id || currentUser.sub || p.registration_no || p.rollno || senderId;
          senderName = currentUser.name || p.name || senderName;
          senderRole = currentUser.role || senderRole;
          senderAvatar = currentUser.photo_url || p.photo_url || p.avatar_url || '';
        }
      } catch {}

      const cleanAttachments = (attachments || []).map((att) => ({
        file_name: att.file_name || (att as any).name || 'document',
        file_type: att.file_type || (att as any).type || 'other',
        file_url: att.file_url || (att as any).url || '',
        file_size_kb: typeof att.file_size_kb === 'number' ? att.file_size_kb : 0,
      }));

      const payload = {
        body: body?.trim() || '',
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        sender_avatar: senderAvatar,
        attachments: cleanAttachments,
      };

      const res = await fetch(`${API_BASE}/chat/groups/${selectedGroup.id}/messages?tenant=${slug}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const newMsg: ChatMessage = json.data;
        setMessages((prev) => [...prev, newMsg]);

        // update last message in group list
        setGroups((prev) =>
          prev.map((g) =>
            g.id === selectedGroup.id
              ? {
                  ...g,
                  last_message: {
                    id: newMsg.id,
                    body: newMsg.body,
                    sender_id: newMsg.sender_id,
                    sender_name: newMsg.sender_name,
                    sender_role: newMsg.sender_role,
                    created_at: newMsg.created_at,
                  },
                }
              : g,
          ),
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to send chat message:', err);
      return false;
    } finally {
      setSending(false);
    }
  };

  // Upload attachment file
  const uploadAttachment = async (file: File): Promise<ChatAttachment | null> => {
    try {
      const slug = getTenantSlug();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/chat/attachments/upload?tenant=${slug}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        return {
          file_name: data.file_name || file.name,
          file_type: data.file_type || 'other',
          file_url: data.file_url,
          file_size_kb: data.file_size_kb || Math.round(file.size / 1024),
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      return null;
    }
  };

  // Trigger group sync (Admin action)
  const syncGroups = async () => {
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/chat/sync?tenant=${slug}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        await fetchGroups(false);
      }
    } catch (err) {
      console.error('Failed to sync groups:', err);
    }
  };

  // Group selection effect
  useEffect(() => {
    if (selectedGroup?.id) {
      fetchMessages(selectedGroup.id);
      fetchMembers(selectedGroup.id);
      markAsRead(selectedGroup.id);
    }
  }, [selectedGroup?.id, fetchMessages, fetchMembers, markAsRead]);

  // Initial group fetch
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Polling for live updates every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGroups(true);
      if (activeGroupRef.current) {
        fetchMessages(activeGroupRef.current, true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchGroups, fetchMessages]);

  // Join / Add a Batch Group to discussion list
  const joinBatchGroup = async (params: {
    course_cd?: string;
    course_name?: string;
    department_id?: string;
    department_name: string;
    batch_year: string;
    batch_code?: string;
  }): Promise<boolean> => {
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/chat/join-batch?tenant=${slug}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params),
      });

      if (res.ok) {
        const json = await res.json();
        const joined = json.data?.group;
        if (joined) {
          setGroups((prev) => {
            const exists = prev.some((g) => g.id === joined.id);
            return exists ? prev : [joined, ...prev];
          });
          setSelectedGroup(joined);
        }
        await fetchGroups(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to join batch group:', err);
      return false;
    }
  };

  // Fetch available selection options
  const fetchSelectionOptions = useCallback(async () => {
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/chat/selection-options?tenant=${slug}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || { courses: [], departments: [], batches: [] };
      }
      return { courses: [], departments: [], batches: [] };
    } catch (err) {
      console.error('Failed to fetch selection options:', err);
      return { courses: [], departments: [], batches: [] };
    }
  }, [getHeaders, getTenantSlug]);

  return {
    groups,
    selectedGroup,
    setSelectedGroup,
    messages,
    members,
    loadingGroups,
    loadingMessages,
    loadingMembers,
    sending,
    unreadTotal,
    searchQuery,
    setSearchQuery,
    selectedDeptFilter,
    setSelectedDeptFilter,
    selectedYearFilter,
    setSelectedYearFilter,
    fetchGroups,
    fetchMessages,
    sendMessage,
    uploadAttachment,
    markAsRead,
    syncGroups,
    joinBatchGroup,
    fetchSelectionOptions,
  };
}

