'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import LicenseReceiptModal, { LicenseReceiptData } from '../../../components/firms/LicenseReceiptModal';

interface Firm {
  id: string;
  title: string;
  slug: string;
  tenant_name: string;
  domain?: string;
  logo_url?: string;
  level_type?: string;
  theme_color?: string;
  firm_mode: 'MED' | 'NONMED';
  timetable_module_type?: 'ENGINEERING' | 'MEDICAL';
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  trial_days?: number;
  trial_started_at?: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at?: string;
  license_keys?: any[];
}

interface MenuItem {
  id: string;
  role: string;
  menu_key: string;
  menu_label: string;
  route_path: string;
  applicable_firm_mode: string;
}

type TabType = 'overview' | 'firms' | 'admins' | 'licenses' | 'transactions' | 'rights' | 'theme' | 'security';

function OwnerDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected firm for modals / tabs
  const [selectedFirmId, setSelectedFirmId] = useState<string>('');

  // Make Admin state
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');
  const [adminPhone, setAdminPhone] = useState<string>('');
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string>('');
  const [adminErrorMsg, setAdminErrorMsg] = useState<string>('');
  const [firmAdminsList, setFirmAdminsList] = useState<any[]>([]);

  // License Generation & Renewal state
  const [licenseDuration, setLicenseDuration] = useState<number>(365);
  const [licenseAmount, setLicenseAmount] = useState<number>(250000);
  const [licenseLoading, setLicenseLoading] = useState<boolean>(false);
  const [generatedKeyResult, setGeneratedKeyResult] = useState<any>(null);
  const [applyKeyInput, setApplyKeyInput] = useState<string>('');
  const [applyKeyLoading, setApplyKeyLoading] = useState<boolean>(false);
  const [licenseMsg, setLicenseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Transactions & Receipt Slips state
  const [firmTransactions, setFirmTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<LicenseReceiptData | null>(null);
  const [renewingFirmId, setRenewingFirmId] = useState<string | null>(null);

  // Custom Receipt Creation state
  const [isCustomReceiptModalOpen, setIsCustomReceiptModalOpen] = useState<boolean>(false);
  const [customReceiptFirmId, setCustomReceiptFirmId] = useState<string>('');
  const [customReceiptDuration, setCustomReceiptDuration] = useState<number>(365);
  const [customReceiptAmount, setCustomReceiptAmount] = useState<number>(250000);
  const [customReceiptPaymentMethod, setCustomReceiptPaymentMethod] = useState<string>('NORNX Direct Billing / Bank Wire');
  const [customReceiptRef, setCustomReceiptRef] = useState<string>('');
  const [customReceiptIsRenewal, setCustomReceiptIsRenewal] = useState<boolean>(false);
  const [customReceiptLoading, setCustomReceiptLoading] = useState<boolean>(false);

  // Edit Receipt state
  const [isEditReceiptModalOpen, setIsEditReceiptModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editReceiptDuration, setEditReceiptDuration] = useState<number>(365);
  const [editReceiptAmount, setEditReceiptAmount] = useState<number>(250000);
  const [editReceiptPaymentMethod, setEditReceiptPaymentMethod] = useState<string>('');
  const [editReceiptRef, setEditReceiptRef] = useState<string>('');
  const [editReceiptStatus, setEditReceiptStatus] = useState<string>('SUCCESS');
  const [editReceiptFirmStatus, setEditReceiptFirmStatus] = useState<string>('ACTIVE');
  const [editReceiptIsRenewal, setEditReceiptIsRenewal] = useState<boolean>(true);
  const [editReceiptLoading, setEditReceiptLoading] = useState<boolean>(false);

  // Menu / Role Rights state
  const [selectedRole, setSelectedRole] = useState<string>('STUDENT');
  const [menuRegistry, setMenuRegistry] = useState<MenuItem[]>([]);
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [rightsLoading, setRightsLoading] = useState<boolean>(false);
  const [rightsSaveSuccess, setRightsSaveSuccess] = useState<string>('');
  const [rightsSearchQuery, setRightsSearchQuery] = useState<string>('');

  const handleSyncMenuRegistry = async () => {
    try {
      setRightsLoading(true);
      const res = await fetch('/api/menu-registry/seed', { method: 'POST' });
      if (res.ok) {
        await fetchMenuRegistry();
        setRightsSaveSuccess('✓ All menus and modules dynamically synchronized from codebase!');
        setTimeout(() => setRightsSaveSuccess(''), 3000);
      }
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setRightsLoading(false);
    }
  };

  // Owner Change Password state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [pwLoading, setPwLoading] = useState<boolean>(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Theme UI Customization state
  const [themePrimaryColor, setThemePrimaryColor] = useState<string>('#5B4BFF');
  const [themeSecondaryColor, setThemeSecondaryColor] = useState<string>('#7867FF');
  const [themeAccentColor, setThemeAccentColor] = useState<string>('#F36C21');
  const [themeSidebarBg, setThemeSidebarBg] = useState<string>('#2D2575');
  const [themeHeaderBg, setThemeHeaderBg] = useState<string>('#2D2575');
  const [themePageBg, setThemePageBg] = useState<string>('#F6F8FC');
  const [themeCardBg, setThemeCardBg] = useState<string>('#FFFFFF');
  const [themeCardRadius, setThemeCardRadius] = useState<string>('22px');
  const [themeTableHeaderBg, setThemeTableHeaderBg] = useState<string>('#F8FAFC');
  const [themeTableZebra, setThemeTableZebra] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<'LIGHT' | 'DARK'>('LIGHT');
  const [themeSaving, setThemeSaving] = useState<boolean>(false);
  const [themeSuccessMsg, setThemeSuccessMsg] = useState<string>('');

  // Toast / Notification banner
  const [globalBanner, setGlobalBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchFirms();
    fetchMenuRegistry();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['overview', 'firms', 'admins', 'licenses', 'transactions', 'rights', 'theme', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedFirmId) {
      fetchFirmAdmins(selectedFirmId);
      fetchFirmTransactions(selectedFirmId);
      if (activeTab === 'rights') {
        fetchFirmPermissions(selectedFirmId, selectedRole);
      }
      const targetFirm = firms.find((f) => f.id === selectedFirmId);
      if (targetFirm) {
        const cfg = (targetFirm as any).theme_config || {};
        setThemePrimaryColor(cfg.primary_color || targetFirm.theme_color || '#5B4BFF');
        setThemeSecondaryColor(cfg.secondary_color || '#7867FF');
        setThemeAccentColor(cfg.accent_color || '#F36C21');
        setThemeSidebarBg(cfg.sidebar_bg || '#2D2575');
        setThemeHeaderBg(cfg.header_bg || cfg.sidebar_bg || '#2D2575');
        setThemePageBg(cfg.page_bg || '#F6F8FC');
        setThemeCardBg(cfg.card_bg || '#FFFFFF');
        setThemeCardRadius(cfg.card_radius || '22px');
        setThemeTableHeaderBg(cfg.table_header_bg || '#F8FAFC');
        setThemeTableZebra(cfg.table_zebra !== false);
        setThemeMode(cfg.theme_mode || 'LIGHT');
      }
    }
  }, [selectedFirmId, selectedRole, activeTab, firms]);

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/firms');
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data || [];
        setFirms(items);
        if (items.length > 0 && !selectedFirmId) {
          setSelectedFirmId(items[0].id);
        }
      }
    } catch {
      setFirms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuRegistry = async () => {
    try {
      const res = await fetch('/api/menu-registry');
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data || [];
        setMenuRegistry(items);
      }
    } catch (e) {
      console.warn('Failed to load menu registry:', e);
    }
  };

  const fetchFirmAdmins = async (firmId: string) => {
    try {
      const res = await fetch(`/api/firms/${firmId}/admins`);
      if (res.ok) {
        const json = await res.json();
        setFirmAdminsList(Array.isArray(json) ? json : json.data || []);
      }
    } catch {
      setFirmAdminsList([]);
    }
  };

  const fetchFirmTransactions = async (firmId: string) => {
    setLoadingTransactions(true);
    try {
      const res = await fetch(`/api/firms/${firmId}/transactions`);
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setFirmTransactions(list);
      } else {
        setFirmTransactions([]);
      }
    } catch {
      setFirmTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchFirmPermissions = async (firmId: string, role: string) => {
    setRightsLoading(true);
    try {
      const res = await fetch(`/api/firms/${firmId}/role-permissions?role=${role}`);
      if (res.ok) {
        const json = await res.json();
        const perms = Array.isArray(json) ? json : json.data || [];
        setEnabledKeys(perms.map((p: any) => p.menu_key));
      }
    } catch {
      setEnabledKeys([]);
    } finally {
      setRightsLoading(false);
    }
  };

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirmId) {
      setAdminErrorMsg('Please select a firm first.');
      return;
    }
    setAdminLoading(true);
    setAdminSuccessMsg('');
    setAdminErrorMsg('');

    try {
      const res = await fetch(`/api/firms/${selectedFirmId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          name: adminName,
          phone: adminPhone,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to create firm admin.');
      }

      setAdminSuccessMsg(`Admin credentials created successfully! Username: ${adminEmail}`);
      setAdminPassword('');
      fetchFirmAdmins(selectedFirmId);
    } catch (err: any) {
      setAdminErrorMsg(err.message || 'Error creating firm admin');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleGenerateLicenseKey = async () => {
    if (!selectedFirmId) return;
    setLicenseLoading(true);
    setLicenseMsg(null);
    setGeneratedKeyResult(null);

    try {
      const res = await fetch(`/api/firms/${selectedFirmId}/license-keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_days: licenseDuration,
          amount: licenseAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to generate key');

      setGeneratedKeyResult(json);
      setLicenseMsg({ type: 'success', text: 'License key generated successfully! Auto-recorded transaction slip.' });
      fetchFirms();
      fetchFirmTransactions(selectedFirmId);
    } catch (err: any) {
      setLicenseMsg({ type: 'error', text: err.message || 'Key generation error' });
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleApplyLicenseKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirmId || !applyKeyInput.trim()) return;
    setApplyKeyLoading(true);
    setLicenseMsg(null);

    try {
      const res = await fetch(`/api/firms/${selectedFirmId}/license-keys/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: applyKeyInput.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to apply key');

      setLicenseMsg({ type: 'success', text: json.message || 'License applied successfully! Firm is ACTIVE.' });
      setApplyKeyInput('');
      fetchFirms();
      fetchFirmTransactions(selectedFirmId);
    } catch (err: any) {
      setLicenseMsg({ type: 'error', text: err.message || 'Failed to apply license key' });
    } finally {
      setApplyKeyLoading(false);
    }
  };

  const handleToggleTimetableModule = async (firmId: string, firmTitle: string, newModule: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to switch the Timetable Module for "${firmTitle}" to ${newModule}?\n\nThis will immediately switch what all Admins, Clerks, Faculty, and Students see for this institution.`,
    );
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/firms/${firmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetable_module_type: newModule }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to update timetable module setting');
      }

      setGlobalBanner({
        type: 'success',
        text: `Timetable module for "${firmTitle}" switched to ${newModule} successfully!`,
      });
      fetchFirms();
    } catch (err: any) {
      setGlobalBanner({
        type: 'error',
        text: err.message || 'Failed to update timetable module',
      });
    }
  };

  const handleRenewLicenseDirect = async (firm: Firm, durationDays = 365, amount = 250000) => {
    setRenewingFirmId(firm.id);
    try {
      const res = await fetch(`/api/firms/${firm.id}/license-keys/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_days: durationDays, amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Renewal failed');

      setGlobalBanner({
        type: 'success',
        text: `✓ License for ${firm.title} renewed for ${durationDays} days! Official NORNX receipt slip generated.`,
      });

      // Prepare receipt modal payload
      const receiptPayload: LicenseReceiptData = {
        id: json.license_key_id,
        receipt_no: `NRX-RNW-${new Date().getFullYear()}-${json.license_key_id?.slice(0, 8).toUpperCase()}`,
        transaction_ref: json.transaction_ref || `NRX-RNW-${Date.now()}`,
        amount,
        currency: 'INR',
        payment_method: 'NORNX Direct Billing / Bank Wire',
        status: 'SUCCESS',
        paid_at: json.issued_at || new Date().toISOString(),
        created_at: json.issued_at || new Date().toISOString(),
        key_prefix: json.key_prefix,
        duration_days: durationDays,
        issued_at: json.issued_at,
        expires_at: json.expires_at,
        is_renewal: true,
        firm_id: firm.id,
        firm_title: firm.title,
        firm_slug: firm.slug,
        tenant_name: firm.tenant_name,
        domain: firm.domain,
        firm_mode: firm.firm_mode,
        level_type: firm.level_type,
        theme_color: firm.theme_color,
      };

      setSelectedReceipt(receiptPayload);
      fetchFirms();
      if (selectedFirmId === firm.id) {
        fetchFirmTransactions(firm.id);
      }
    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: err.message || 'Renewal error' });
    } finally {
      setRenewingFirmId(null);
    }
  };

  const handleSaveMenuRights = async () => {
    if (!selectedFirmId) return;
    setRightsLoading(true);
    setRightsSaveSuccess('');

    try {
      const res = await fetch(`/api/firms/${selectedFirmId}/role-permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          menu_keys: enabledKeys,
        }),
      });

      if (!res.ok) throw new Error('Failed to update permissions');

      // Instantly notify and sync all active tabs/windows
      if (typeof window !== 'undefined') {
        localStorage.setItem('permissions_updated_at', Date.now().toString());
        window.dispatchEvent(new CustomEvent('permissionsUpdated'));
      }

      setRightsSaveSuccess(`✓ Permissions for ${selectedRole} saved and synced in real-time!`);
      setTimeout(() => setRightsSaveSuccess(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save menu rights');
    } finally {
      setRightsLoading(false);
    }
  };

  const handleSaveFirmTheme = async () => {
    if (!selectedFirmId) {
      alert('Please select a firm first.');
      return;
    }
    setThemeSaving(true);
    setThemeSuccessMsg('');

    const themeConfigPayload = {
      primary_color: themePrimaryColor,
      secondary_color: themeSecondaryColor,
      accent_color: themeAccentColor,
      sidebar_bg: themeSidebarBg,
      header_bg: themeHeaderBg,
      page_bg: themePageBg,
      card_bg: themeCardBg,
      card_radius: themeCardRadius,
      table_header_bg: themeTableHeaderBg,
      table_zebra: themeTableZebra,
      theme_mode: themeMode,
    };

    try {
      const res = await fetch(`/api/firms/${selectedFirmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_color: themePrimaryColor,
          theme_config: themeConfigPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update theme');

      // Update local state
      setFirms((prev) =>
        prev.map((f) =>
          f.id === selectedFirmId
            ? { ...f, theme_color: themePrimaryColor, theme_config: themeConfigPayload }
            : f
        )
      );

      // Broadcast theme update immediately to all tabs & current DOM
      if (typeof window !== 'undefined') {
        localStorage.setItem('tenant_primary_color', themePrimaryColor);
        localStorage.setItem('tenant_sidebar_bg', themeSidebarBg);
        localStorage.setItem('tenant_card_radius', themeCardRadius);
        window.dispatchEvent(
          new CustomEvent('themeUpdated', {
            detail: {
              theme_color: themePrimaryColor,
              theme_config: themeConfigPayload,
            },
          })
        );
      }

      setThemeSuccessMsg(`✓ Theme for ${selectedFirm?.title || 'Institution'} saved & applied in real-time!`);
      setTimeout(() => setThemeSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving theme');
    } finally {
      setThemeSaving(false);
    }
  };

  const handleApplyPresetTheme = (preset: {
    primary: string;
    secondary: string;
    accent: string;
    sidebar: string;
    header: string;
    page: string;
    card: string;
    radius: string;
    tableHeader: string;
    mode: 'LIGHT' | 'DARK';
  }) => {
    setThemePrimaryColor(preset.primary);
    setThemeSecondaryColor(preset.secondary);
    setThemeAccentColor(preset.accent);
    setThemeSidebarBg(preset.sidebar);
    setThemeHeaderBg(preset.header);
    setThemePageBg(preset.page);
    setThemeCardBg(preset.card);
    setThemeCardRadius(preset.radius);
    setThemeTableHeaderBg(preset.tableHeader);
    setThemeMode(preset.mode);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);

    try {
      const res = await fetch('/api/owner/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Password update failed.');

      setPwMsg({ type: 'success', text: 'Owner password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleToggleFirmStatus = async (firmId: string, firmTitle: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/firms/${firmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');

      setGlobalBanner({
        type: 'success',
        text: `✓ Firm "${firmTitle}" status updated to ${nextStatus}. Access rights adjusted across all tenant roles.`,
      });
      fetchFirms();
    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: err.message || 'Failed to update status' });
    }
  };

  const handleDeleteFirm = async (firm: Firm) => {
    const confirmPrompt = window.prompt(
      `⚠️ CAUTION: De-registering "${firm.title}" will disable login for all students, faculty, and administrators under tenant_${firm.slug}.\n\nType "${firm.slug}" to confirm deletion:`,
    );

    if (confirmPrompt !== firm.slug) {
      if (confirmPrompt !== null) {
        alert('Confirmation slug did not match. Deletion cancelled.');
      }
      return;
    }

    try {
      const res = await fetch(`/api/firms/${firm.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to delete firm');
      }

      setGlobalBanner({
        type: 'success',
        text: `Firm "${firm.title}" (tenant_${firm.slug}) was successfully de-registered.`,
      });
      fetchFirms();
    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: err.message || 'Delete operation failed' });
    }
  };

  const handleOpenReceipt = (tx: any) => {
    const matchedFirm = firms.find((f) => f.id === tx.firm_id) || firms.find((f) => f.id === selectedFirmId);
    const rawIssueDate = tx.issued_at || tx.paid_at || tx.created_at || new Date().toISOString();
    const durationDays = Number(tx.duration_days) || 365;
    const computedExpiry = tx.expires_at || new Date(new Date(rawIssueDate).getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const receiptData: LicenseReceiptData = {
      id: tx.id || tx.license_key_id,
      receipt_no: tx.receipt_no || (tx.transaction_ref?.startsWith('NRX-') ? tx.transaction_ref : `NRX-REC-${new Date(rawIssueDate).getFullYear()}-${(tx.id || tx.transaction_ref || '0000').slice(0, 8).toUpperCase()}`),
      transaction_ref: tx.transaction_ref,
      amount: tx.amount !== undefined && tx.amount !== null ? tx.amount : 0,
      currency: tx.currency || 'INR',
      payment_method: tx.payment_method || 'NORNX Direct Billing / Bank Wire',
      status: tx.status || 'SUCCESS',
      paid_at: tx.paid_at || tx.created_at,
      created_at: tx.created_at,
      key_prefix: tx.key_prefix,
      duration_days: durationDays,
      issued_at: rawIssueDate,
      expires_at: computedExpiry,
      is_renewal: Boolean(tx.is_renewal),
      firm_id: tx.firm_id || matchedFirm?.id,
      firm_title: tx.firm_title || matchedFirm?.title,
      firm_slug: tx.firm_slug || matchedFirm?.slug,
      tenant_name: tx.tenant_name || matchedFirm?.tenant_name,
      domain: tx.domain || matchedFirm?.domain,
      logo_url: tx.logo_url || matchedFirm?.logo_url,
      firm_mode: tx.firm_mode || matchedFirm?.firm_mode,
      level_type: tx.level_type || matchedFirm?.level_type,
      theme_color: tx.theme_color || matchedFirm?.theme_color,
    };
    setSelectedReceipt(receiptData);
  };

  const handleOpenCustomReceiptModal = () => {
    setCustomReceiptFirmId(selectedFirmId || firms[0]?.id || '');
    setCustomReceiptDuration(365);
    setCustomReceiptAmount(250000);
    setCustomReceiptPaymentMethod('NORNX Direct Billing / Bank Wire');
    setCustomReceiptRef(`NRX-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setCustomReceiptIsRenewal(false);
    setIsCustomReceiptModalOpen(true);
  };

  const handleCreateCustomReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReceiptFirmId) return;
    setCustomReceiptLoading(true);

    try {
      const res = await fetch(`/api/firms/${customReceiptFirmId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(customReceiptAmount),
          duration_days: Number(customReceiptDuration),
          payment_method: customReceiptPaymentMethod,
          transaction_ref: customReceiptRef || `NRX-REC-${Date.now()}`,
          is_renewal: customReceiptIsRenewal,
          status: 'SUCCESS',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to issue custom receipt');

      setGlobalBanner({
        type: 'success',
        text: `✓ Official NORNX receipt ${customReceiptRef} generated successfully for ${customReceiptDuration} days!`,
      });

      setIsCustomReceiptModalOpen(false);
      fetchFirms();
      if (selectedFirmId === customReceiptFirmId) {
        fetchFirmTransactions(customReceiptFirmId);
      } else {
        setSelectedFirmId(customReceiptFirmId);
      }

      handleOpenReceipt({
        ...json,
        duration_days: customReceiptDuration,
        amount: customReceiptAmount,
        transaction_ref: customReceiptRef,
        is_renewal: customReceiptIsRenewal,
        firm_id: customReceiptFirmId,
      });
    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: err.message || 'Error issuing receipt' });
    } finally {
      setCustomReceiptLoading(false);
    }
  };

  const handleOpenEditReceiptModal = (tx: any) => {
    setEditingTx(tx);
    const matchingFirm = firms.find((f) => f.id === selectedFirmId);
    setEditReceiptDuration(Number(tx.duration_days) || 365);
    setEditReceiptAmount(parseFloat(String(tx.amount ?? 0)) || 0);
    setEditReceiptPaymentMethod(tx.payment_method || 'Bank Transfer');
    setEditReceiptRef(tx.transaction_ref || '');
    setEditReceiptStatus(tx.status || 'SUCCESS');
    setEditReceiptFirmStatus(matchingFirm?.status || 'ACTIVE');
    setEditReceiptIsRenewal(true);
    setIsEditReceiptModalOpen(true);
  };

  const handleOpenFirmPlanConfig = (firm: Firm) => {
    setSelectedFirmId(firm.id);
    const syntheticTx = {
      id: firm.id,
      license_key_id: firm.id,
      duration_days: firm.trial_days || 365,
      amount: 250000,
      payment_method: 'NORNX Platform Billing / Bank Wire',
      transaction_ref: `NRX-${firm.slug.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`,
      status: firm.status === 'SUSPENDED' ? 'SUSPENDED' : (firm.status === 'EXPIRED' ? 'EXPIRED' : 'SUCCESS'),
    };
    setEditingTx(syntheticTx);
    setEditReceiptDuration(Number(firm.trial_days) || 365);
    setEditReceiptAmount(250000);
    setEditReceiptPaymentMethod('Bank Wire / Direct Billing');
    setEditReceiptRef(`NRX-CFG-${firm.slug.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`);
    setEditReceiptStatus('SUCCESS');
    setEditReceiptFirmStatus(firm.status || 'ACTIVE');
    setEditReceiptIsRenewal(true);
    setIsEditReceiptModalOpen(true);
  };

  const handleSaveEditReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !selectedFirmId) return;
    setEditReceiptLoading(true);

    try {
      const txIdentifier = editingTx.id || editingTx.license_key_id;
      const res = await fetch(`/api/firms/${selectedFirmId}/transactions/${txIdentifier}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_days: Number(editReceiptDuration),
          amount: Number(editReceiptAmount),
          payment_method: editReceiptPaymentMethod,
          transaction_ref: editReceiptRef,
          status: editReceiptStatus,
          firm_status: editReceiptFirmStatus,
          is_renewal: editReceiptIsRenewal,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update receipt details');

      setGlobalBanner({
        type: 'success',
        text: `✓ Firm license & plan updated: ${editReceiptDuration} days, ₹${editReceiptAmount}, Status: ${editReceiptFirmStatus}!`,
      });

      // Optimistically update table in state immediately
      setFirmTransactions((prev) =>
        prev.map((t) =>
          (t.id === txIdentifier || t.license_key_id === txIdentifier)
            ? {
                ...t,
                duration_days: Number(editReceiptDuration),
                amount: Number(editReceiptAmount),
                payment_method: editReceiptPaymentMethod,
                transaction_ref: editReceiptRef,
                status: editReceiptStatus,
                is_renewal: editReceiptIsRenewal,
              }
            : t
        )
      );

      setIsEditReceiptModalOpen(false);
      fetchFirms();
      fetchFirmTransactions(selectedFirmId);
    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: err.message || 'Error updating receipt' });
    } finally {
      setEditReceiptLoading(false);
    }
  };

  const handleDeleteLicenseKey = async (firmId: string, keyId: string) => {
    if (!window.confirm('⚠️ Are you sure you want to revoke and delete this license key?')) return;
    try {
      const res = await fetch(`/api/firms/${firmId}/license-keys/${keyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete license key');
      setGlobalBanner({ type: 'success', text: '✓ License key successfully revoked and deleted.' });
      fetchFirms();
      fetchFirmTransactions(firmId);
    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: err.message || 'Error deleting license key' });
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this transaction receipt?')) return;
    if (!selectedFirmId) return;
    try {
      const res = await fetch(`/api/firms/${selectedFirmId}/transactions/${txId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete receipt');
      setGlobalBanner({ type: 'success', text: '✓ Transaction receipt successfully deleted.' });
      setIsEditReceiptModalOpen(false);
      fetchFirms();
      fetchFirmTransactions(selectedFirmId);
    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: err.message || 'Error deleting transaction receipt' });
    }
  };

  // ─── FILTERED DATA ─────────────────────────────────────────────────────────

  const filteredFirms = firms.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.domain && f.domain.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedFirm = firms.find((f) => f.id === selectedFirmId);

  const totalFirms = firms.length;
  const activeFirms = firms.filter((f) => f.status === 'ACTIVE').length;
  const trialFirms = firms.filter((f) => f.status === 'TRIAL').length;
  const expiredFirms = firms.filter((f) => f.status === 'EXPIRED').length;

  const currentRoleMenus = menuRegistry.filter((m) => {
    const roleMatches = m.role === selectedRole;
    const modeMatches =
      !selectedFirm ||
      m.applicable_firm_mode === 'BOTH' ||
      m.applicable_firm_mode === selectedFirm.firm_mode;
    const searchMatches =
      !rightsSearchQuery ||
      m.menu_label.toLowerCase().includes(rightsSearchQuery.toLowerCase()) ||
      m.menu_key.toLowerCase().includes(rightsSearchQuery.toLowerCase()) ||
      m.route_path.toLowerCase().includes(rightsSearchQuery.toLowerCase());
    return roleMatches && modeMatches && searchMatches;
  });

  return (
    <div className="flex min-h-screen bg-[#F6F8FC]">
      {/* Dedicated Owner Sidebar */}
      <Sidebar role="owner" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Platform Owner Control Center" />

        <main className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 overflow-x-hidden">
          {/* Top Banner Alert */}
          {globalBanner && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold shadow-sm transition-all ${
                globalBanner.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>{globalBanner.text}</span>
              <button onClick={() => setGlobalBanner(null)} className="text-xs font-bold underline ml-4">
                Dismiss
              </button>
            </div>
          )}

          {/* Page Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-[#F36C21] uppercase tracking-wider mb-1">
                <span>Platform Owner</span>
                <span>•</span>
                <span className="text-[#4E5969]">SaaS Control Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] tracking-tight">
                Owner Dashboard & Firm Management
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] mt-0.5">
                Centralized multi-tenant institution provisioning, NORNX cryptographic licensing, renewal receipts, and role access governance.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/dashboard/superadmin/firms/register"
                className="px-4 py-2 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-bold text-xs rounded-full shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <span>＋ Register New Firm</span>
              </Link>
              <button
                onClick={fetchFirms}
                className="p-2 bg-white hover:bg-slate-100 text-[#4E5969] border border-[#E7EAF3] rounded-full shadow-sm transition-all"
                title="Refresh Data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E7EAF3] scrollbar-none">
            {[
              { id: 'overview', label: '📊 Overview & KPIs' },
              { id: 'firms', label: `🏛️ Firm Display List (${firms.length})` },
              { id: 'admins', label: '👤 Make Firm Admin' },
              { id: 'licenses', label: '🔑 License Tracker & Renew' },
              { id: 'transactions', label: '🧾 Renewal Receipts & Invoices' },
              { id: 'rights', label: '🛡️ Firm Menu & Module Rights' },
              { id: 'theme', label: '🎨 Firm Theme UI Change' },
              { id: 'security', label: '🔒 Owner Password' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#2D2575] text-white shadow-md'
                    : 'bg-white text-[#4E5969] hover:bg-slate-100 border border-[#E7EAF3]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW & KPIS                                              */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-[22px] border border-[#E7EAF3] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-[#4E5969] uppercase tracking-wider">Total Registered Firms</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5B4BFF] flex items-center justify-center font-black text-sm">
                      🏛️
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#1B1E28]">{totalFirms}</div>
                  <div className="text-xs text-[#4E5969] font-medium mt-1">Institutions on SaaS Platform</div>
                </div>

                <div className="bg-white p-5 rounded-[22px] border border-[#E7EAF3] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Active Subscriptions</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                      ✓
                    </div>
                  </div>
                  <div className="text-3xl font-black text-emerald-600">{activeFirms}</div>
                  <div className="text-xs text-[#4E5969] font-medium mt-1">Full access active licenses</div>
                </div>

                <div className="bg-white p-5 rounded-[22px] border border-[#E7EAF3] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-amber-700 uppercase tracking-wider">In Trial Period</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm">
                      ⏳
                    </div>
                  </div>
                  <div className="text-3xl font-black text-amber-600">{trialFirms}</div>
                  <div className="text-xs text-[#4E5969] font-medium mt-1">14–30 Day Evaluation</div>
                </div>

                <div className="bg-white p-5 rounded-[22px] border border-[#E7EAF3] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-rose-700 uppercase tracking-wider">Expired / Blocked</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm">
                      ⛔
                    </div>
                  </div>
                  <div className="text-3xl font-black text-rose-600">{expiredFirms}</div>
                  <div className="text-xs text-[#4E5969] font-medium mt-1">Login strictly prevented</div>
                </div>
              </div>

              {/* NORNX Authority Banner */}
              <div className="p-6 bg-gradient-to-r from-[#2D2575] to-[#1a1548] text-white rounded-[22px] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#00C48C] flex items-center justify-center p-3 shadow-md shadow-[#00C48C]/30 shrink-0">
                    <div className="w-full h-full bg-white rounded-lg" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black tracking-tight">NORNX</span>
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#00C48C]/20 text-[#00C48C] border border-[#00C48C]/30">
                        License Authority Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      All institution subscriptions are backed by cryptographic license keys and official NORNX Tax Invoices & Renewal Receipts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="px-5 py-2.5 rounded-full bg-[#00C48C] hover:bg-[#00b07d] text-[#1B1E28] font-extrabold text-xs transition-all shadow-md shadow-[#00C48C]/20"
                  >
                    🧾 View All Renewal Slips
                  </button>
                  <button
                    onClick={() => setActiveTab('licenses')}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
                  >
                    🔑 Manage Keys
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: FIRM DISPLAY LIST                                            */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'firms' && (
            <div className="bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#1B1E28]">Enrolled Institutions & Multi-Tenant Firms</h2>
                  <p className="text-xs text-[#4E5969]">
                    Manage tenant schemas, license renewal slips, admin accounts, and operational status
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search by title, slug, or domain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-[#E7EAF3] rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-[#E7EAF3] rounded-xl text-xs font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Subscriptions</option>
                    <option value="TRIAL">Trial Period</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="SUSPENDED">Suspended (Deactivated)</option>
                  </select>
                </div>
              </div>

              {/* Table of Firms */}
              {loading ? (
                <div className="py-16 text-center text-[#4E5969] text-xs">
                  <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <span>Loading enrolled institutions...</span>
                </div>
              ) : filteredFirms.length === 0 ? (
                <div className="py-16 text-center text-[#4E5969] text-xs bg-slate-50 rounded-2xl border border-dashed border-[#E7EAF3]">
                  No firms matching your filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E7EAF3] text-[11px] font-black text-[#4E5969] uppercase tracking-wider bg-slate-50/50">
                        <th className="py-3 px-4">Institution Name</th>
                        <th className="py-3 px-4">Tenant Schema</th>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4">Mode</th>
                        <th className="py-3 px-4">Timetable Module</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Registered</th>
                        <th className="py-3 px-4 text-right">Actions & Slips</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3]">
                      {filteredFirms.map((firm) => (
                        <tr key={firm.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#1B1E28]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#5B4BFF] flex items-center justify-center font-black text-xs shrink-0">
                                {firm.title.charAt(0)}
                              </div>
                              <span className="truncate max-w-xs">{firm.title}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#5B4BFF]">
                            tenant_{firm.slug}
                          </td>
                          <td className="py-3.5 px-4 text-[#4E5969]">
                            {firm.domain ? (
                              <a
                                href={`http://${firm.domain}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline"
                              >
                                {firm.domain}
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                firm.firm_mode === 'MED'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-teal-50 text-teal-700 border border-teal-200'
                              }`}
                            >
                              {firm.firm_mode}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={firm.timetable_module_type || (firm.firm_mode === 'MED' ? 'MEDICAL' : 'ENGINEERING')}
                              onChange={(e) => handleToggleTimetableModule(firm.id, firm.title, e.target.value)}
                              title="Assign Timetable Module: Engineering vs Medical (BAMS/MBBS)"
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border focus:outline-none transition-all shadow-sm ${
                                (firm.timetable_module_type || (firm.firm_mode === 'MED' ? 'MEDICAL' : 'ENGINEERING')) === 'MEDICAL'
                                  ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                              }`}
                            >
                              <option value="ENGINEERING">⚙️ Engineering</option>
                              <option value="MEDICAL">🩺 Medical (BAMS/MBBS)</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={firm.status}
                              onChange={(e) => handleToggleFirmStatus(firm.id, firm.title, e.target.value)}
                              title="Click to change status: Activate, Deactivate (Suspend), Trial, Expire"
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border focus:outline-none transition-all shadow-sm ${
                                firm.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : firm.status === 'TRIAL'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                  : firm.status === 'SUSPENDED'
                                  ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                              }`}
                            >
                              <option value="ACTIVE">● ACTIVE</option>
                              <option value="TRIAL">● TRIAL</option>
                              <option value="SUSPENDED">● SUSPENDED (Deactivate)</option>
                              <option value="EXPIRED">● EXPIRED</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-[#4E5969]">
                            {new Date(firm.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Plan, Days & Status Config */}
                              <button
                                onClick={() => handleOpenFirmPlanConfig(firm)}
                                title="Configure Plan (1Yr, 6Mo, Monthly, Custom), Days, Amount & Status"
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold rounded-lg text-[11px] transition-all flex items-center gap-1 border border-amber-200/80 cursor-pointer"
                              >
                                ⚡ Plan & Days
                              </button>

                              {/* View Receipts */}
                              <button
                                onClick={() => {
                                  setSelectedFirmId(firm.id);
                                  setActiveTab('transactions');
                                }}
                                title="View & Download License Receipts"
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                              >
                                🧾 Receipt
                              </button>

                              {/* Configure Firm Wizard shortcut */}
                              <Link
                                href={`/dashboard/superadmin/firms/register?firmId=${firm.id}`}
                                title="Configure Branding, Theme, Domain & Details"
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1"
                              >
                                ⚙️ Configure
                              </Link>

                              {/* Make Admin shortcut */}
                              <button
                                onClick={() => {
                                  setSelectedFirmId(firm.id);
                                  setActiveTab('admins');
                                }}
                                title="Make/Manage Firm Admin"
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#1B1E28] font-bold rounded-lg text-[11px] transition-all"
                              >
                                👤 Admin
                              </button>

                              {/* License Key shortcut */}
                              <button
                                onClick={() => {
                                  setSelectedFirmId(firm.id);
                                  setActiveTab('licenses');
                                }}
                                title="Track & Renew License"
                                className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold rounded-lg text-[11px] transition-all"
                              >
                                🔑 License
                              </button>

                              {/* De-register / Delete */}
                              <button
                                onClick={() => handleDeleteFirm(firm)}
                                title="De-register Institution"
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-[11px] transition-all"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: MAKE FIRM ADMIN                                              */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'admins' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to provision new admin */}
              <div className="lg:col-span-1 bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-black text-[#1B1E28]">Provision Firm Admin</h2>
                  <p className="text-xs text-[#4E5969]">
                    Create credentials with role ADMIN for the target institution
                  </p>
                </div>

                {adminSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                    ✓ {adminSuccessMsg}
                  </div>
                )}
                {adminErrorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                    ✕ {adminErrorMsg}
                  </div>
                )}

                <form onSubmit={handleMakeAdmin} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#1B1E28] mb-1.5">Target Institution / Firm</label>
                    <select
                      value={selectedFirmId}
                      onChange={(e) => setSelectedFirmId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-[#E7EAF3] rounded-xl font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    >
                      <option value="">Select Firm...</option>
                      {firms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title} ({f.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1B1E28] mb-1.5">Admin Email / Username</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@institution.edu.in"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-[#E7EAF3] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-[#1B1E28]">Admin Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          const rand = 'Med@' + Math.random().toString(36).slice(-6) + '9#';
                          setAdminPassword(rand);
                        }}
                        className="text-[10px] font-black text-[#5B4BFF] hover:underline"
                      >
                        ⚡ Generate Strong
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Enter strong password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-[#E7EAF3] rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1B1E28] mb-1.5">Full Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-[#E7EAF3] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1B1E28] mb-1.5">Contact Phone (Optional)</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-[#E7EAF3] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {adminLoading ? 'Provisioning...' : '✓ Create Admin Account'}
                  </button>
                </form>
              </div>

              {/* List of Admins in Selected Firm */}
              <div className="lg:col-span-2 bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#1B1E28]">
                      Active Admin Accounts {selectedFirm ? `for ${selectedFirm.title}` : ''}
                    </h3>
                    <p className="text-xs text-[#4E5969]">
                      Stored securely in PostgreSQL schema: <code className="text-[#5B4BFF]">tenant_{selectedFirm?.slug}</code>
                    </p>
                  </div>
                </div>

                {firmAdminsList.length === 0 ? (
                  <div className="py-12 text-center text-[#4E5969] text-xs bg-slate-50 rounded-2xl border border-dashed border-[#E7EAF3]">
                    No admin accounts found for this firm yet. Use the form on the left to create the initial admin.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E7EAF3] text-[11px] font-black text-[#4E5969] uppercase tracking-wider bg-slate-50/50">
                          <th className="py-3 px-3">Admin Name</th>
                          <th className="py-3 px-3">Email / Username</th>
                          <th className="py-3 px-3">Role</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3]">
                        {firmAdminsList.map((adm) => (
                          <tr key={adm.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-bold text-[#1B1E28]">{adm.name}</td>
                            <td className="py-3 px-3 font-mono font-medium text-indigo-700">{adm.email}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-[#5B4BFF] border border-indigo-200">
                                {adm.role}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                ACTIVE
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#4E5969]">
                              {new Date(adm.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: LICENSE TRACKER & RENEWAL                                    */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'licenses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generate & Apply Form */}
                <div className="lg:col-span-1 bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-[#1B1E28]">Issue / Apply License Key</h2>
                    <p className="text-xs text-[#4E5969]">Format: FIRM-XXXX-XXXX-XXXX</p>
                  </div>

                  {licenseMsg && (
                    <div
                      className={`p-3.5 rounded-xl text-xs font-semibold ${
                        licenseMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {licenseMsg.text}
                    </div>
                  )}

                  {/* Section A: Generate Cryptographic Key */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-[#E7EAF3] space-y-3">
                    <h3 className="text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                      1. Generate New License Key
                    </h3>

                    <div>
                      <label className="block text-[11px] font-bold text-[#1B1E28] mb-1">Target Firm</label>
                      <select
                        value={selectedFirmId}
                        onChange={(e) => setSelectedFirmId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E7EAF3] rounded-xl text-xs font-bold"
                      >
                        <option value="">Select Firm...</option>
                        {firms.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.title} ({f.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#1B1E28] mb-1">Duration (Days)</label>
                        <input
                          type="number"
                          value={licenseDuration}
                          onChange={(e) => setLicenseDuration(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-[#E7EAF3] rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#1B1E28] mb-1">Amount (₹)</label>
                        <input
                          type="number"
                          value={licenseAmount}
                          onChange={(e) => setLicenseAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-[#E7EAF3] rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateLicenseKey}
                      disabled={licenseLoading || !selectedFirmId}
                      className="w-full py-2 bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95 disabled:opacity-50"
                    >
                      {licenseLoading ? 'Generating...' : '⚡ Generate Key'}
                    </button>

                    {generatedKeyResult && (
                      <div className="p-3 bg-indigo-900 text-white rounded-xl space-y-1.5 text-xs font-mono">
                        <div className="text-[10px] text-amber-300 font-sans font-bold">
                          ⚠️ One-Time Display Key:
                        </div>
                        <div className="text-sm font-black tracking-wider text-amber-300 select-all">
                          {generatedKeyResult.plaintext_key}
                        </div>
                        <div className="text-[10px] text-indigo-200 font-sans">
                          Expires: {new Date(generatedKeyResult.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section B: Apply / Verify Key */}
                  <form onSubmit={handleApplyLicenseKey} className="p-4 bg-slate-50 rounded-2xl border border-[#E7EAF3] space-y-3">
                    <h3 className="text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                      2. Apply / Activate Key
                    </h3>
                    <div>
                      <label className="block text-[11px] font-bold text-[#1B1E28] mb-1">Plaintext Key</label>
                      <input
                        type="text"
                        required
                        placeholder="FIRM-XXXX-XXXX-XXXX"
                        value={applyKeyInput}
                        onChange={(e) => setApplyKeyInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E7EAF3] rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={applyKeyLoading || !selectedFirmId}
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95 disabled:opacity-50"
                    >
                      {applyKeyLoading ? 'Verifying...' : '✓ Verify & Apply'}
                    </button>
                  </form>
                </div>

                {/* License Status Tracking Table */}
                <div className="lg:col-span-2 bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-[#1B1E28]">License Matrix & Expiration Tracker</h3>
                      <p className="text-xs text-[#4E5969]">Real-time evaluation of firm status across platform</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E7EAF3] text-[11px] font-black text-[#4E5969] uppercase tracking-wider bg-slate-50/50">
                          <th className="py-3 px-3">Institution</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Expires At</th>
                          <th className="py-3 px-3">Mode</th>
                          <th className="py-3 px-3 text-right">Quick Renewal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3]">
                        {firms.map((f) => (
                          <tr key={f.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-3 font-bold text-[#1B1E28]">
                              <div>{f.title}</div>
                              <div className="text-[11px] font-mono text-[#5B4BFF] font-normal">{f.slug}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  f.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : f.status === 'TRIAL'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {f.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-[#4E5969]">
                              {f.trial_ends_at ? new Date(f.trial_ends_at).toLocaleDateString() : 'Active Core'}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-slate-700">{f.firm_mode}</td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleOpenFirmPlanConfig(f)}
                                  title="Configure Plan, Duration Days, Amount & Active Status"
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold rounded-lg text-[11px] border border-amber-200 cursor-pointer flex items-center gap-1"
                                >
                                  ⚡ Plan & Days
                                </button>
                                <button
                                  onClick={() => handleRenewLicenseDirect(f, 365, 250000)}
                                  disabled={renewingFirmId === f.id}
                                  className="px-3 py-1 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-black rounded-lg text-[11px] shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                >
                                  {renewingFirmId === f.id ? 'Renewing...' : '⚡ Renew (1 Yr)'}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedFirmId(f.id);
                                    setActiveTab('transactions');
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#5B4BFF] font-bold rounded-lg text-[11px] cursor-pointer"
                                >
                                  Receipts & Keys
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: TRANSACTIONS & RENEWAL RECEIPTS                              */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B4BFF] to-[#2D2575] flex items-center justify-center p-2 text-white font-black shadow-md shadow-indigo-500/20 text-xs">
                      ⚡
                    </div>
                    <h2 className="text-lg font-black text-[#1B1E28]">
                      NORNX License Renewal Receipts & Invoices
                    </h2>
                  </div>
                  <p className="text-xs text-[#4E5969] mt-1">
                    Official tax invoices, subscription receipts, and renewal slips for all registered institutions
                  </p>
                </div>

                {/* Header Action Buttons & Firm Selector */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenCustomReceiptModal}
                    className="px-3.5 py-2 bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black rounded-xl shadow-md shadow-[#5B4BFF]/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>➕ Issue Custom Receipt</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1B1E28]">Filter by Firm:</span>
                    <select
                      value={selectedFirmId}
                      onChange={(e) => setSelectedFirmId(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 border border-[#E7EAF3] rounded-xl text-xs font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    >
                      {firms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title} ({f.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loadingTransactions ? (
                <div className="py-16 text-center text-[#4E5969] text-xs">
                  <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <span>Loading renewal transaction slips...</span>
                </div>
              ) : firmTransactions.length === 0 ? (
                <div className="py-16 text-center text-[#4E5969] text-xs bg-[#F6F8FC] rounded-2xl border border-dashed border-[#E7EAF3] space-y-3">
                  <p className="font-bold text-[#1B1E28] text-sm">No transactions recorded for this firm yet.</p>
                  <p>Click "Issue Custom Receipt" or "Renew License" to generate the first official receipt.</p>
                  <button
                    type="button"
                    onClick={handleOpenCustomReceiptModal}
                    className="px-4 py-2 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-bold text-xs rounded-xl shadow-md shadow-[#5B4BFF]/20 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>➕ Generate First Receipt</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E7EAF3] text-[11px] font-black text-[#4E5969] uppercase tracking-wider bg-slate-50/70">
                        <th className="py-3 px-4">Receipt / Invoice Ref</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Date of Payment</th>
                        <th className="py-3 px-4">License Prefix</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Total Amount (₹)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3]">
                      {firmTransactions.map((tx, idx) => {
                        const txAmount = parseFloat(String(tx.amount ?? 0)) || 0;
                        const duration = tx.duration_days !== undefined && tx.duration_days !== null && !isNaN(Number(tx.duration_days)) ? Number(tx.duration_days) : 365;

                        return (
                          <tr key={tx.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#1B1E28]">
                              <div>{tx.transaction_ref || `NRX-TXN-${(tx.id || '0000').slice(0, 8)}`}</div>
                              <div className="text-[10px] text-slate-400 font-sans font-normal">
                                {tx.payment_method || 'Bank Transfer'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  tx.is_renewal
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-indigo-50 text-[#5B4BFF] border border-indigo-200'
                                }`}
                              >
                                {tx.is_renewal ? 'RENEWAL' : 'INITIAL ISSUE'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#4E5969] font-medium">
                              {new Date(tx.paid_at || tx.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-[#5B4BFF]">
                              {tx.key_prefix || 'FIRM-ACTIVE'}****
                            </td>
                            <td className="py-3.5 px-4 font-black text-[#1B1E28]">
                              <span className="inline-flex items-center gap-1.5">
                                <span>{duration} {Number(duration) === 1 ? 'Day' : 'Days'}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditReceiptModal(tx)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold border border-slate-200 cursor-pointer"
                                  title="Edit days / duration"
                                >
                                  ✏️ Edit
                                </button>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-[#1B1E28] text-sm">
                              ₹{txAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 text-[#5B4BFF] border border-indigo-200 uppercase">
                                ✓ {tx.status || 'PAID'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditReceiptModal(tx)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-[#E7EAF3] transition-all flex items-center gap-1 cursor-pointer"
                                  title="Edit receipt details & duration"
                                >
                                  <span>✏️ Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceipt(tx)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white text-xs font-black shadow-md shadow-[#5B4BFF]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>🧾 View / Print Slip</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTransaction(tx.id || tx.license_key_id)}
                                  className="px-2 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-all flex items-center gap-1 cursor-pointer"
                                  title="Delete this transaction receipt"
                                >
                                  <span>🗑️</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 6: FIRM MODULE / MENU RIGHTS                                    */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'rights' && (
            <div className="bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#1B1E28]">Firm Module & Menu Rights Governance</h2>
                  <p className="text-xs text-[#4E5969]">
                    Dynamically synchronized across all student, faculty, admin, clerk, and warden modules
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncMenuRegistry}
                    disabled={rightsLoading}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1B1E28] font-bold text-xs rounded-xl border border-[#E7EAF3] shadow-sm transition-all flex items-center gap-1.5"
                    title="Scans codebase for newly created pages and synchronizes registry"
                  >
                    <span>⚡ Sync Codebase Menus</span>
                  </button>

                  <button
                    onClick={handleSaveMenuRights}
                    disabled={rightsLoading || !selectedFirmId}
                    className="px-5 py-2.5 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {rightsLoading ? 'Saving...' : '💾 Save Role Permissions'}
                  </button>
                </div>
              </div>

              {rightsSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  {rightsSaveSuccess}
                </div>
              )}

              {/* Selector Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-[#E7EAF3]">
                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] mb-1.5">Select Firm</label>
                  <select
                    value={selectedFirmId}
                    onChange={(e) => setSelectedFirmId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E7EAF3] rounded-xl text-xs font-bold text-[#1B1E28]"
                  >
                    <option value="">Select Firm...</option>
                    {firms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title} ({f.firm_mode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] mb-1.5">Select Role</label>
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN', 'SUPERADMIN'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedRole === r
                            ? 'bg-[#5B4BFF] text-white shadow-sm'
                            : 'bg-white text-[#4E5969] border border-[#E7EAF3] hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] mb-1.5">Filter Modules</label>
                  <input
                    type="text"
                    value={rightsSearchQuery}
                    onChange={(e) => setRightsSearchQuery(e.target.value)}
                    placeholder="Search by label or route..."
                    className="w-full px-3 py-1.5 bg-white border border-[#E7EAF3] rounded-xl text-xs font-medium text-[#1B1E28] placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Toggle All Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-2 gap-2">
                <div className="font-bold text-[#1B1E28] flex items-center gap-2">
                  <span>Available Modules for {selectedRole} ({currentRoleMenus.length})</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[#5B4BFF] font-black text-[10px] border border-indigo-200">
                    Enabled: {enabledKeys.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allKeys = currentRoleMenus.map((m) => m.menu_key);
                      const combined = Array.from(new Set([...enabledKeys, ...allKeys]));
                      setEnabledKeys(combined);
                    }}
                    className="text-xs font-black text-[#5B4BFF] hover:underline"
                  >
                    Select All Visible
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const visibleKeys = new Set(currentRoleMenus.map((m) => m.menu_key));
                      setEnabledKeys(enabledKeys.filter((k) => !visibleKeys.has(k)));
                    }}
                    className="text-xs font-black text-rose-500 hover:underline"
                  >
                    Deselect All Visible
                  </button>
                </div>
              </div>

              {/* Menus Grid */}
              {currentRoleMenus.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-xs font-bold text-[#4E5969]">No modules found matching the criteria.</p>
                  <button
                    type="button"
                    onClick={handleSyncMenuRegistry}
                    className="mt-3 px-3.5 py-1.5 bg-[#5B4BFF] text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    ⚡ Run Codebase Menu Discovery
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentRoleMenus.map((item) => {
                    const isChecked = enabledKeys.includes(item.menu_key);
                    return (
                      <label
                        key={item.id || item.menu_key}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/50 border-indigo-200 text-[#1B1E28] shadow-sm'
                            : 'bg-white border-[#E7EAF3] text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEnabledKeys([...enabledKeys, item.menu_key]);
                            } else {
                              setEnabledKeys(enabledKeys.filter((k) => k !== item.menu_key));
                            }
                          }}
                          className="w-4 h-4 mt-0.5 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] border-slate-300"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="text-xs font-bold truncate text-[#1B1E28]">{item.menu_label}</div>
                            {item.applicable_firm_mode && item.applicable_firm_mode !== 'BOTH' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                {item.applicable_firm_mode}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-[#5B4BFF] truncate mt-0.5">{item.route_path}</div>
                          <div className="text-[9px] font-mono text-slate-400 truncate">Key: {item.menu_key}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 7: FIRM THEME & UI CUSTOMIZATION                                */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div className="bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-[#1B1E28] flex items-center gap-2">
                      <span>🎨 Firm Theme & UI Customization</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[#5B4BFF] font-black text-[10px] border border-indigo-200 uppercase">
                        Tenant Specific Live Sync
                      </span>
                    </h2>
                    <p className="text-xs text-[#4E5969] mt-0.5">
                      Customize sidebar, header, cards, data tables, forms, buttons, and body colors for any individual college tenant.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyPresetTheme({
                          primary: '#5B4BFF',
                          secondary: '#7867FF',
                          accent: '#F36C21',
                          sidebar: '#2D2575',
                          header: '#2D2575',
                          page: '#F6F8FC',
                          card: '#FFFFFF',
                          radius: '22px',
                          tableHeader: '#F8FAFC',
                          mode: 'LIGHT',
                        })
                      }
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#1B1E28] font-bold text-xs rounded-xl border border-[#E7EAF3] transition-all"
                    >
                      ↺ Default MedERP
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveFirmTheme}
                      disabled={themeSaving || !selectedFirmId}
                      className="px-5 py-2.5 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {themeSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving & Applying...</span>
                        </>
                      ) : (
                        <>
                          <span>💾 Save & Apply Live Theme</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {themeSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <span>{themeSuccessMsg}</span>
                  </div>
                )}

                {/* Tenant College Selector */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-[#E7EAF3] space-y-2">
                  <label className="block text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                    1. Select Target College Tenant
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {firms.map((f) => {
                      const isSelected = f.id === selectedFirmId;
                      const fTheme = (f as any).theme_config?.primary_color || f.theme_color || '#5B4BFF';
                      const fSidebar = (f as any).theme_config?.sidebar_bg || '#2D2575';
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFirmId(f.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50/60 border-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                              : 'bg-white border-[#E7EAF3] hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="font-bold text-xs text-[#1B1E28] truncate">{f.title}</div>
                            <div className="text-[10px] font-mono text-[#5B4BFF] truncate mt-0.5">{f.slug}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="w-4 h-4 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: fSidebar }}
                              title={`Sidebar: ${fSidebar}`}
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: fTheme }}
                              title={`Primary: ${fTheme}`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Curated One-Click Preset Palettes */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                    2. Instant Curated Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {[
                      {
                        name: 'Royal Classic',
                        primary: '#5B4BFF',
                        secondary: '#7867FF',
                        accent: '#F36C21',
                        sidebar: '#2D2575',
                        header: '#2D2575',
                        page: '#F6F8FC',
                        card: '#FFFFFF',
                        radius: '22px',
                        tableHeader: '#F8FAFC',
                        mode: 'LIGHT' as const,
                      },
                      {
                        name: 'Slate Tech',
                        primary: '#0284C7',
                        secondary: '#38BDF8',
                        accent: '#F59E0B',
                        sidebar: '#0F172A',
                        header: '#0F172A',
                        page: '#F8FAFC',
                        card: '#FFFFFF',
                        radius: '16px',
                        tableHeader: '#F1F5F9',
                        mode: 'LIGHT' as const,
                      },
                      {
                        name: 'Clinical Emerald',
                        primary: '#059669',
                        secondary: '#10B981',
                        accent: '#F36C21',
                        sidebar: '#064E3B',
                        header: '#064E3B',
                        page: '#F0FDF4',
                        card: '#FFFFFF',
                        radius: '22px',
                        tableHeader: '#DCFCE7',
                        mode: 'LIGHT' as const,
                      },
                      {
                        name: 'Crimson University',
                        primary: '#E11D48',
                        secondary: '#FB7185',
                        accent: '#F59E0B',
                        sidebar: '#4C0519',
                        header: '#4C0519',
                        page: '#FFF1F2',
                        card: '#FFFFFF',
                        radius: '16px',
                        tableHeader: '#FFE4E6',
                        mode: 'LIGHT' as const,
                      },
                      {
                        name: 'Sunset Amber',
                        primary: '#D97706',
                        secondary: '#F59E0B',
                        accent: '#5B4BFF',
                        sidebar: '#1C1917',
                        header: '#1C1917',
                        page: '#FFFBEB',
                        card: '#FFFFFF',
                        radius: '20px',
                        tableHeader: '#FEF3C7',
                        mode: 'LIGHT' as const,
                      },
                      {
                        name: 'Dark Titanium',
                        primary: '#6366F1',
                        secondary: '#818CF8',
                        accent: '#F36C21',
                        sidebar: '#0B132B',
                        header: '#0B132B',
                        page: '#0F172A',
                        card: '#1E293B',
                        radius: '22px',
                        tableHeader: '#1E293B',
                        mode: 'DARK' as const,
                      },
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleApplyPresetTheme(p)}
                        className="p-3 rounded-xl border border-[#E7EAF3] bg-white hover:bg-slate-50 transition-all text-left flex flex-col justify-between space-y-2 group shadow-sm hover:shadow"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.sidebar }} />
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.primary }} />
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.accent }} />
                        </div>
                        <div className="font-bold text-xs text-[#1B1E28] group-hover:text-[#5B4BFF] transition-colors">
                          {p.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Live Mockup Preview Canvas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                      3. Live Real-Time ERP Mockup Preview
                    </label>
                    <span className="text-[11px] font-bold text-[#4E5969]">
                      Target: <span className="text-[#5B4BFF]">{selectedFirm?.title || 'Selected Tenant'}</span>
                    </span>
                  </div>

                  <div
                    className="p-4 rounded-[22px] border border-[#E7EAF3] transition-all shadow-sm overflow-hidden"
                    style={{ backgroundColor: themePageBg }}
                  >
                    <div className="rounded-2xl border border-black/10 overflow-hidden shadow-md flex flex-col bg-white">
                      {/* Mockup Header */}
                      <div
                        className="px-4 py-3 flex items-center justify-between text-white transition-all border-b border-white/10"
                        style={{ backgroundColor: themeHeaderBg }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-1.5 h-5 rounded-full"
                            style={{ backgroundColor: themeAccentColor }}
                          />
                          <div>
                            <div className="font-black text-xs uppercase tracking-wide">
                              {selectedFirm?.title || 'Academic & Medical Portal'}
                            </div>
                            <div className="text-[9px] opacity-80">Enterprise Management System</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-white/15 text-[10px] font-bold">
                            Live Theme Preview
                          </span>
                        </div>
                      </div>

                      {/* Mockup Body with Sidebar & Content */}
                      <div className="flex min-h-[220px]">
                        {/* Mini Sidebar */}
                        <div
                          className="w-36 p-3 text-white flex flex-col justify-between shrink-0 space-y-2 border-r border-white/10"
                          style={{ backgroundColor: themeSidebarBg }}
                        >
                          <div className="space-y-1.5">
                            <div
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-white flex items-center gap-1.5 shadow-sm"
                              style={{ backgroundColor: themePrimaryColor }}
                            >
                              <span>📊</span>
                              <span>Dashboard</span>
                            </div>
                            <div className="px-2.5 py-1 text-[10px] font-medium opacity-80 hover:opacity-100 flex items-center gap-1.5">
                              <span>👥</span>
                              <span>Students</span>
                            </div>
                            <div className="px-2.5 py-1 text-[10px] font-medium opacity-80 hover:opacity-100 flex items-center gap-1.5">
                              <span>📅</span>
                              <span>Schedule</span>
                            </div>
                            <div className="px-2.5 py-1 text-[10px] font-medium opacity-80 hover:opacity-100 flex items-center gap-1.5">
                              <span>📋</span>
                              <span>MIS Reports</span>
                            </div>
                          </div>
                          <div className="text-[8px] opacity-60 font-mono">tenant_{selectedFirm?.slug || 'institution'}</div>
                        </div>

                        {/* Mini Content Area */}
                        <div className="flex-1 p-4 space-y-3" style={{ backgroundColor: themePageBg }}>
                          {/* Mini Cards */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div
                              className="p-3 border border-[#E7EAF3] shadow-sm flex items-center justify-between"
                              style={{
                                backgroundColor: themeCardBg,
                                borderRadius: themeCardRadius,
                              }}
                            >
                              <div>
                                <div className="text-[10px] font-bold text-slate-500">Enrolled Students</div>
                                <div className="text-base font-black text-[#1B1E28]">1,420</div>
                              </div>
                              <span
                                className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-bold shadow-sm"
                                style={{ backgroundColor: themePrimaryColor }}
                              >
                                ↑
                              </span>
                            </div>

                            <div
                              className="p-3 border border-[#E7EAF3] shadow-sm flex items-center justify-between"
                              style={{
                                backgroundColor: themeCardBg,
                                borderRadius: themeCardRadius,
                              }}
                            >
                              <div>
                                <div className="text-[10px] font-bold text-slate-500">Attendance Rate</div>
                                <div className="text-base font-black text-[#1B1E28]">94.6%</div>
                              </div>
                              <span
                                className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-bold shadow-sm"
                                style={{ backgroundColor: themeAccentColor }}
                              >
                                ★
                              </span>
                            </div>
                          </div>

                          {/* Mini Data Table */}
                          <div
                            className="border border-[#E7EAF3] overflow-hidden shadow-sm"
                            style={{
                              backgroundColor: themeCardBg,
                              borderRadius: themeCardRadius,
                            }}
                          >
                            <table className="w-full text-left text-[10px]">
                              <thead>
                                <tr
                                  className="font-black border-b border-[#E7EAF3]"
                                  style={{ backgroundColor: themeTableHeaderBg }}
                                >
                                  <th className="py-1.5 px-3">Subject / Course</th>
                                  <th className="py-1.5 px-3">Faculty</th>
                                  <th className="py-1.5 px-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                <tr className={themeTableZebra ? 'bg-white' : ''}>
                                  <td className="py-1.5 px-3 font-bold text-[#1B1E28]">Data Structures & Algorithms</td>
                                  <td className="py-1.5 px-3 text-slate-600">Dr. Sharma</td>
                                  <td className="py-1.5 px-3 text-right">
                                    <button
                                      type="button"
                                      className="px-2 py-0.5 text-[9px] font-bold text-white rounded shadow-sm"
                                      style={{ backgroundColor: themePrimaryColor }}
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                                <tr className={themeTableZebra ? 'bg-slate-50/70' : 'bg-white'}>
                                  <td className="py-1.5 px-3 font-bold text-[#1B1E28]">General Pathology & Anatomy</td>
                                  <td className="py-1.5 px-3 text-slate-600">Prof. Verma</td>
                                  <td className="py-1.5 px-3 text-right">
                                    <button
                                      type="button"
                                      className="px-2 py-0.5 text-[9px] font-bold text-white rounded shadow-sm"
                                      style={{ backgroundColor: themePrimaryColor }}
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Granular Color & Style Pickers */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                    4. Fine-Grained Theme Color & Style Controls
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Primary Brand Color */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1B1E28]">Primary Buttons & Badges</label>
                        <span className="text-[11px] font-mono text-slate-500">{themePrimaryColor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themePrimaryColor}
                          onChange={(e) => setThemePrimaryColor(e.target.value)}
                          className="w-10 h-9 p-0.5 border border-[#E7EAF3] rounded-lg cursor-pointer bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={themePrimaryColor}
                          onChange={(e) => setThemePrimaryColor(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#E7EAF3] rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Secondary Brand Color */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1B1E28]">Secondary / Hover Color</label>
                        <span className="text-[11px] font-mono text-slate-500">{themeSecondaryColor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeSecondaryColor}
                          onChange={(e) => setThemeSecondaryColor(e.target.value)}
                          className="w-10 h-9 p-0.5 border border-[#E7EAF3] rounded-lg cursor-pointer bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={themeSecondaryColor}
                          onChange={(e) => setThemeSecondaryColor(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#E7EAF3] rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1B1E28]">Accent / Highlight Color</label>
                        <span className="text-[11px] font-mono text-slate-500">{themeAccentColor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeAccentColor}
                          onChange={(e) => setThemeAccentColor(e.target.value)}
                          className="w-10 h-9 p-0.5 border border-[#E7EAF3] rounded-lg cursor-pointer bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={themeAccentColor}
                          onChange={(e) => setThemeAccentColor(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#E7EAF3] rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Sidebar Background */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1B1E28]">Sidebar Background</label>
                        <span className="text-[11px] font-mono text-slate-500">{themeSidebarBg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeSidebarBg}
                          onChange={(e) => setThemeSidebarBg(e.target.value)}
                          className="w-10 h-9 p-0.5 border border-[#E7EAF3] rounded-lg cursor-pointer bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={themeSidebarBg}
                          onChange={(e) => setThemeSidebarBg(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#E7EAF3] rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Header Background */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1B1E28]">Header Background</label>
                        <span className="text-[11px] font-mono text-slate-500">{themeHeaderBg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeHeaderBg}
                          onChange={(e) => setThemeHeaderBg(e.target.value)}
                          className="w-10 h-9 p-0.5 border border-[#E7EAF3] rounded-lg cursor-pointer bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={themeHeaderBg}
                          onChange={(e) => setThemeHeaderBg(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#E7EAF3] rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Page Background */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1B1E28]">Page Background (Body)</label>
                        <span className="text-[11px] font-mono text-slate-500">{themePageBg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themePageBg}
                          onChange={(e) => setThemePageBg(e.target.value)}
                          className="w-10 h-9 p-0.5 border border-[#E7EAF3] rounded-lg cursor-pointer bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={themePageBg}
                          onChange={(e) => setThemePageBg(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#E7EAF3] rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Card Radius */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2">
                      <label className="text-xs font-bold text-[#1B1E28]">Card & Container Radius</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['12px', '16px', '22px', '28px'].map((rad) => (
                          <button
                            key={rad}
                            type="button"
                            onClick={() => setThemeCardRadius(rad)}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                              themeCardRadius === rad
                                ? 'bg-[#5B4BFF] text-white shadow-sm'
                                : 'bg-white border border-[#E7EAF3] text-[#4E5969] hover:bg-slate-100'
                            }`}
                          >
                            {rad}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table Header Color */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1B1E28]">Table Header Background</label>
                        <span className="text-[11px] font-mono text-slate-500">{themeTableHeaderBg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeTableHeaderBg}
                          onChange={(e) => setThemeTableHeaderBg(e.target.value)}
                          className="w-10 h-9 p-0.5 border border-[#E7EAF3] rounded-lg cursor-pointer bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={themeTableHeaderBg}
                          onChange={(e) => setThemeTableHeaderBg(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#E7EAF3] rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Table Zebra Striping */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2 flex flex-col justify-between">
                      <label className="text-xs font-bold text-[#1B1E28]">Table Zebra Row Striping</label>
                      <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={themeTableZebra}
                          onChange={(e) => setThemeTableZebra(e.target.checked)}
                          className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF]"
                        />
                        <span className="text-xs font-medium text-[#1B1E28]">
                          Enable alternating row background tint
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 8: OWNER PASSWORD MANAGEMENT                                    */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <div className="max-w-xl mx-auto bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-8 space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#1B1E28]">Change Owner Master Password</h2>
                <p className="text-xs text-[#4E5969] mt-1">
                  Updates root owner access credentials for <code className="text-[#5B4BFF] font-bold">nornx</code>
                </p>
              </div>

              {pwMsg && (
                <div
                  className={`p-4 rounded-xl text-xs font-semibold ${
                    pwMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {pwMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1.5">Current Owner Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full py-3 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 text-sm"
                >
                  {pwLoading ? 'Updating Password...' : 'Update Owner Password'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Official NORNX License Receipt Modal */}
      <LicenseReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* ─── MODAL 1: ISSUE CUSTOM RECEIPT MODAL ─── */}
      {isCustomReceiptModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn font-sans">
          <div className="bg-white rounded-[24px] shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col my-8">
            <div className="bg-[#2D2575] px-6 py-4 flex items-center justify-between text-white border-b border-purple-900/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#5B4BFF] flex items-center justify-center text-white font-black text-sm">
                  ⚡
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Issue Official NORNX Receipt</h3>
                  <p className="text-[11px] text-purple-200/80">Generate license invoice & subscription slip with custom duration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomReceiptModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-purple-200 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomReceiptSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1B1E28] mb-1">Target Institution / Firm</label>
                <select
                  value={customReceiptFirmId}
                  onChange={(e) => setCustomReceiptFirmId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  {firms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} ({f.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customReceiptDuration}
                    onChange={(e) => setCustomReceiptDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    placeholder="365"
                  />
                  <div className="flex gap-1 mt-1">
                    {[3, 30, 90, 180, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCustomReceiptDuration(d)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${
                          customReceiptDuration === d
                            ? 'bg-[#5B4BFF] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Total Amount (₹ INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={customReceiptAmount}
                    onChange={(e) => setCustomReceiptAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    placeholder="250000"
                  />
                  <div className="flex gap-1 mt-1">
                    {[0, 50000, 100000, 250000].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setCustomReceiptAmount(a)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${
                          customReceiptAmount === a
                            ? 'bg-[#5B4BFF] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {a === 0 ? 'Free' : `₹${a / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Receipt Reference No</label>
                  <input
                    type="text"
                    required
                    value={customReceiptRef}
                    onChange={(e) => setCustomReceiptRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-mono font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Payment Method</label>
                  <select
                    value={customReceiptPaymentMethod}
                    onChange={(e) => setCustomReceiptPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-medium text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  >
                    <option value="NORNX Direct Billing / Bank Wire">Bank Wire / Transfer</option>
                    <option value="Online Payment / UPI Gateway">Online UPI Gateway</option>
                    <option value="Demand Draft / Corporate Cheque">Demand Draft / Cheque</option>
                    <option value="Institutional Grant / Complimentary">Institutional Grant (Zero Cost)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold text-[#1B1E28] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={customReceiptIsRenewal}
                    onChange={(e) => setCustomReceiptIsRenewal(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF]"
                  />
                  <span>Mark as Enterprise License Renewal (extends active validity)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCustomReceiptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customReceiptLoading}
                  className="px-5 py-2 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-black rounded-xl shadow-md shadow-[#5B4BFF]/25 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{customReceiptLoading ? 'Generating...' : '⚡ Generate & View Slip'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: EDIT PLAN, DURATION, AMOUNT & FIRM STATUS MODAL ─── */}
      {isEditReceiptModalOpen && editingTx && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
          <div className="bg-white rounded-[26px] shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col my-8 transition-all">
            {/* Header */}
            <div className="bg-[#2D2575] px-6 py-4 flex items-center justify-between text-white border-b border-purple-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B4BFF] to-[#F36C21] flex items-center justify-center text-white font-black text-sm shadow-md">
                  ⚡
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Configure Institution Plan & License</h3>
                  <p className="text-[11px] text-purple-200/80">Edit plan duration, pricing, subscription cycle & active status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditReceiptModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-purple-200 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditReceiptSubmit} className="p-6 space-y-5 text-xs">
              {/* 1. Quick Plan Presets */}
              <div>
                <label className="block font-black text-[#1B1E28] uppercase text-[10px] tracking-wider mb-2">
                  1. Select Plan Preset or Customize
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '🌟 1 Year', days: 365, defaultAmt: 250000 },
                    { label: '⚡ 6 Months', days: 180, defaultAmt: 135000 },
                    { label: '📅 3 Months', days: 90, defaultAmt: 75000 },
                    { label: '🗓️ 1 Month', days: 30, defaultAmt: 25000 },
                    { label: '⏳ 14d Trial', days: 14, defaultAmt: 0 },
                    { label: '⏱️ 7d Trial', days: 7, defaultAmt: 0 },
                    { label: '🧪 1d Test', days: 1, defaultAmt: 0 },
                    { label: '🎯 Custom', days: editReceiptDuration, defaultAmt: editReceiptAmount },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditReceiptDuration(p.days);
                        if (p.defaultAmt > 0 || p.days <= 14) {
                          setEditReceiptAmount(p.defaultAmt);
                        }
                      }}
                      className={`p-2 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                        editReceiptDuration === p.days && p.label !== '🎯 Custom'
                          ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-[#E7EAF3] hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Duration & Amount Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F6F8FC] p-4 rounded-2xl border border-[#E7EAF3]">
                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editReceiptDuration}
                    onChange={(e) => setEditReceiptDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E7EAF3] rounded-xl font-black text-sm text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Total active duration granted to institution
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Total Net Amount (₹ INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={editReceiptAmount}
                    onChange={(e) => setEditReceiptAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E7EAF3] rounded-xl font-black text-sm text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between font-medium">
                    <span>Base: ₹{(editReceiptAmount > 0 ? editReceiptAmount / 1.18 : 0).toFixed(2)}</span>
                    <span>GST (18%): ₹{(editReceiptAmount > 0 ? editReceiptAmount - editReceiptAmount / 1.18 : 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Firm Operational Status & Renewal Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Institution Status (Live Access)</label>
                  <select
                    value={editReceiptFirmStatus}
                    onChange={(e) => setEditReceiptFirmStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-extrabold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  >
                    <option value="ACTIVE">● ACTIVE (Operational / Access Granted)</option>
                    <option value="SUSPENDED">● SUSPENDED (Deactivate / Lock All Logins)</option>
                    <option value="EXPIRED">● EXPIRED (License Expired / Renewal Needed)</option>
                    <option value="TRIAL">● TRIAL (Trial Evaluation)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Controls whether Admin, Students & Faculty can log in
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Start / Expiry Calculation</label>
                  <select
                    value={editReceiptIsRenewal ? 'today' : 'original'}
                    onChange={(e) => setEditReceiptIsRenewal(e.target.value === 'today')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  >
                    <option value="today">⚡ Start / Extend from Today (Renewal)</option>
                    <option value="original">📅 From Original Payment Date</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Calculates expiration date from selected base
                  </span>
                </div>
              </div>

              {/* 4. Payment Reference & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Transaction / Receipt Reference</label>
                  <input
                    type="text"
                    required
                    value={editReceiptRef}
                    onChange={(e) => setEditReceiptRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-mono font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1B1E28] mb-1">Payment Method</label>
                  <input
                    type="text"
                    required
                    value={editReceiptPaymentMethod}
                    onChange={(e) => setEditReceiptPaymentMethod(e.target.value)}
                    placeholder="Bank Transfer / Direct Wire / Online"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl font-medium text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteTransaction(editingTx.id || editingTx.license_key_id)}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <span>🗑️ Delete Slip</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditReceiptModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editReceiptLoading}
                    className="px-6 py-2.5 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-black rounded-xl shadow-md shadow-[#5B4BFF]/25 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>{editReceiptLoading ? 'Saving...' : '💾 Apply & Save Configuration'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#F6F8FC]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#4E5969]">Loading Owner Control Center...</p>
          </div>
        </div>
      }
    >
      <OwnerDashboardContent />
    </Suspense>
  );
}
