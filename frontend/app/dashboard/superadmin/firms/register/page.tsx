'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import WizardStepper, { StepItem } from '../../../../../components/firms/wizard/WizardStepper';
import Step1Branding from '../../../../../components/firms/wizard/Step1Branding';
import Step2Identity from '../../../../../components/firms/wizard/Step2Identity';
import Step3PlanTheme from '../../../../../components/firms/wizard/Step3PlanTheme';
import Step4FirmMode from '../../../../../components/firms/wizard/Step4FirmMode';
import Step5RoleMenuAccess, { RoleType } from '../../../../../components/firms/wizard/Step5RoleMenuAccess';
import Step6LicenseTrial from '../../../../../components/firms/wizard/Step6LicenseTrial';
import Step7ReviewConfirm from '../../../../../components/firms/wizard/Step7ReviewConfirm';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';

const WIZARD_STEPS: StepItem[] = [
  { id: 1, label: 'Branding', sublabel: 'Visual Assets' },
  { id: 2, label: 'Identity', sublabel: 'Title & Slug' },
  { id: 3, label: 'Plan & Theme', sublabel: 'Tier & Color' },
  { id: 4, label: 'Firm Mode', sublabel: 'Med / Non-Med' },
  { id: 5, label: 'Role Menus', sublabel: '6 Roles Access' },
  { id: 6, label: 'Licensing', sublabel: 'Trial & Keys' },
  { id: 7, label: 'Review', sublabel: 'Finalize & Save' },
];

function FirmRegistrationWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firmIdParam = searchParams.get('firmId') || searchParams.get('id') || searchParams.get('slug');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [registeredSuccess, setRegisteredSuccess] = useState<any | null>(null);

  // Edit / Configure Mode state
  const [editingFirmId, setEditingFirmId] = useState<string | null>(firmIdParam);
  const [loadingFirm, setLoadingFirm] = useState<boolean>(!!firmIdParam);
  const [originalFirmTitle, setOriginalFirmTitle] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    logo_url: '',
    cover_url: '',
    banner_url: '',
    title: '',
    slug: '',
    tenant_name: '',
    domain: '',
    level_type: 'STANDARD' as 'STANDARD' | 'ENTERPRISE',
    theme_color: '#5B4BFF',
    firm_mode: 'MED' as 'MED' | 'NONMED',
    trial_days: 14,
    applied_key: '',
    key_duration_days: 365,
    amount: 0,
    payment_method: 'bank_transfer',
    transaction_ref: '',
    transaction_status: 'SUCCESS' as 'PENDING' | 'SUCCESS' | 'FAILED',
  });

  // Role Menu Access State
  const [rolePermissions, setRolePermissions] = useState<Record<RoleType, string[]>>({
    STUDENT: [],
    FACULTY: [],
    ADMIN: [],
    CLERK: [],
    WARDEN: [],
    SUPERADMIN: [],
  });

  // Fetch basic details and role permissions when configuring an existing firm
  useEffect(() => {
    if (!firmIdParam) return;

    setLoadingFirm(true);
    setError('');

    // 1. Fetch Basic Firm Details
    fetch(`/api/firms/${firmIdParam}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load firm details (${res.status})`);
        }
        const json = await res.json();
        const firm = json.data || json;
        if (firm) {
          setEditingFirmId(firm.id);
          setOriginalFirmTitle(firm.title || '');
          setFormData((prev) => ({
            ...prev,
            logo_url: firm.logo_url || '',
            cover_url: firm.cover_url || '',
            banner_url: firm.banner_url || '',
            title: firm.title || '',
            slug: firm.slug || '',
            tenant_name: firm.tenant_name || '',
            domain: firm.domain || '',
            level_type: firm.level_type || 'STANDARD',
            theme_color: firm.theme_color || '#5B4BFF',
            firm_mode: (firm.firm_mode as 'MED' | 'NONMED') || 'MED',
            trial_days: firm.trial_days || 14,
          }));
          // Enable direct navigation across all steps for configuration
          setMaxAccessibleStep(7);
        }
      })
      .catch((err) => {
        console.error('Error fetching firm:', err);
        setError(err.message || 'Failed to fetch firm details');
      })
      .finally(() => {
        setLoadingFirm(false);
      });

    // 2. Fetch Configured Role Permissions
    fetch(`/api/firms/${firmIdParam}/role-permissions`)
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        const perms = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        const grouped: Record<RoleType, string[]> = {
          STUDENT: [],
          FACULTY: [],
          ADMIN: [],
          CLERK: [],
          WARDEN: [],
          SUPERADMIN: [],
        };
        perms.forEach((p: any) => {
          const role = (p.role || '').toUpperCase() as RoleType;
          if (grouped[role] && p.menu_key && !grouped[role].includes(p.menu_key)) {
            grouped[role].push(p.menu_key);
          }
        });

        setRolePermissions((prev) => ({
          STUDENT: grouped.STUDENT.length > 0 ? grouped.STUDENT : prev.STUDENT,
          FACULTY: grouped.FACULTY.length > 0 ? grouped.FACULTY : prev.FACULTY,
          ADMIN: grouped.ADMIN.length > 0 ? grouped.ADMIN : prev.ADMIN,
          CLERK: grouped.CLERK.length > 0 ? grouped.CLERK : prev.CLERK,
          WARDEN: grouped.WARDEN.length > 0 ? grouped.WARDEN : prev.WARDEN,
          SUPERADMIN: grouped.SUPERADMIN.length > 0 ? grouped.SUPERADMIN : prev.SUPERADMIN,
        }));
      })
      .catch((err) => console.warn('Error fetching firm permissions:', err));
  }, [firmIdParam]);

  const updateFormData = (fields: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const updateRolePermissions = (role: RoleType, keys: string[]) => {
    setRolePermissions((prev) => ({ ...prev, [role]: keys }));
  };

  const goToNext = () => {
    const next = currentStep + 1;
    setCurrentStep(next);
    if (next > maxAccessibleStep) {
      setMaxAccessibleStep(next);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        tenant_name: formData.tenant_name.trim(),
        domain: formData.domain.trim() || undefined,
        logo_url: formData.logo_url || undefined,
        cover_url: formData.cover_url || undefined,
        banner_url: formData.banner_url || undefined,
        level_type: formData.level_type,
        theme_color: formData.theme_color,
        firm_mode: formData.firm_mode,
        trial_days: formData.trial_days,
      };

      let firmData: any;
      let firmId = editingFirmId;

      if (editingFirmId) {
        // Update existing firm configuration via PATCH /api/firms/:id
        const res = await fetch(`/api/firms/${editingFirmId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'Failed to update firm configuration.');
        }
        const rawJson = await res.json();
        firmData = rawJson.data || rawJson;
        if (!firmId) firmId = firmData.id;
      } else {
        // Create new Firm via POST /api/firms
        const res = await fetch('/api/firms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'Failed to register firm.');
        }
        const rawJson = await res.json();
        firmData = rawJson.data || rawJson;
        firmId = firmData.id || firmData.data?.id;
      }

      // 2. Save Role Menu Permissions for each role
      const roles: RoleType[] = ['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN', 'SUPERADMIN'];
      for (const r of roles) {
        const keys = rolePermissions[r] || [];
        if (keys.length > 0) {
          await fetch(`/api/firms/${firmId}/role-permissions`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: r, menu_keys: keys }),
          }).catch((e) => console.warn(`Failed to save permissions for ${r}:`, e));
        }
      }

      // 3. Apply License Key if provided
      if (formData.applied_key?.trim()) {
        await fetch(`/api/firms/${firmId}/license-keys/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: formData.applied_key.trim() }),
        }).catch((e) => console.warn('Failed to apply license key:', e));
      }

      // 4. Record Transaction if amount or ref provided
      if (formData.amount > 0 || formData.transaction_ref?.trim()) {
        await fetch(`/api/firms/${firmId}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: formData.amount || 0,
            currency: 'INR',
            payment_method: formData.payment_method || 'bank_transfer',
            transaction_ref: formData.transaction_ref || `TXN-${Date.now()}`,
            status: formData.transaction_status || 'SUCCESS',
          }),
        }).catch((e) => console.warn('Failed to record transaction:', e));
      }

      const resolvedSuccess = {
        id: firmData?.id || editingFirmId || firmId || 'N/A',
        title: firmData?.title || formData.title || originalFirmTitle || 'Institution',
        slug: firmData?.slug || formData.slug || 'tenant',
        firm_mode: firmData?.firm_mode || formData.firm_mode || 'MED',
        status: firmData?.status || 'ACTIVE',
        ...firmData,
      };

      setRegisteredSuccess(resolvedSuccess);
    } catch (err: any) {
      setError(err.message || 'An error occurred during firm configuration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC]">
      <Sidebar role="owner" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Institution Registration & Configuration" />
        <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          {/* Page Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#5B4BFF] uppercase tracking-wider mb-1">
                <Link href="/dashboard/owner" className="hover:underline">Owner</Link>
                <span>/</span>
                <Link href="/dashboard/superadmin/firms" className="hover:underline">Firms</Link>
                <span>/</span>
                <span className="text-[#4E5969]">{editingFirmId ? 'Configure Firm' : 'Registration Wizard'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] tracking-tight">
                {editingFirmId ? `Configure Firm: ${originalFirmTitle || formData.title || 'Institution'}` : 'Firm Registration & Licensing'}
              </h1>
              <p className="text-sm text-[#4E5969] mt-1">
                {editingFirmId
                  ? 'Update institution branding, domain, color palette, active mode, role menu rights, and licensing.'
                  : 'Provision a new institution tenant, define visual theme, issue cryptographic license, and configure menu access.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/dashboard/owner"
                className="px-4 py-2 rounded-full text-xs font-bold text-[#4E5969] bg-white border border-[#E7EAF3] hover:text-[#1B1E28] hover:border-[#5B4BFF] transition-all shadow-sm flex items-center gap-2"
              >
                <span>Owner Dashboard</span>
              </Link>
              <Link
                href="/dashboard/superadmin/firms"
                className="px-4 py-2 rounded-full text-xs font-bold text-[#4E5969] bg-white border border-[#E7EAF3] hover:text-[#1B1E28] hover:border-[#5B4BFF] transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Firm Directory</span>
              </Link>
            </div>
          </div>

          {/* Loading Firm State */}
          {loadingFirm ? (
            <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-12 text-center shadow-sm space-y-4 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] mx-auto flex items-center justify-center text-2xl font-black">
                ⚙️
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#1B1E28]">Fetching Firm Basic Details...</h3>
                <p className="text-xs text-[#4E5969] mt-1">
                  Loading identity, theme, permissions, and licensing for <strong className="text-[#5B4BFF]">{firmIdParam}</strong>
                </p>
              </div>
            </div>
          ) : registeredSuccess ? (
            /* Success Screen */
            <div className="bg-white rounded-[22px] border border-[#00C48C]/30 p-8 shadow-xl text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-[#00C48C]/15 text-[#00C48C] mx-auto flex items-center justify-center text-4xl shadow-inner">
                ✓
              </div>
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-black text-[#1B1E28]">
                  {editingFirmId ? 'Institution Configured Successfully!' : 'Institution Registered Successfully!'}
                </h2>
                <p className="text-sm text-[#4E5969] mt-2">
                  Firm <strong className="text-[#1B1E28]">{registeredSuccess.title || formData.title || originalFirmTitle}</strong> settings have been saved under tenant slug <code className="text-[#5B4BFF] font-bold">tenant_{registeredSuccess.slug || formData.slug}</code> with schema isolation and menu permissions intact.
                </p>
              </div>

              <div className="p-4 bg-[#F6F8FC] rounded-2xl border border-[#E7EAF3] max-w-lg mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#4E5969]">Firm ID:</span>
                  <span className="font-mono font-bold text-[#1B1E28]">{registeredSuccess.id || editingFirmId || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4E5969]">Tenant Slug:</span>
                  <span className="font-mono font-bold text-[#5B4BFF]">{registeredSuccess.slug || formData.slug || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4E5969]">Mode:</span>
                  <span className="font-bold text-[#1B1E28]">{registeredSuccess.firm_mode || formData.firm_mode || 'MED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4E5969]">Status:</span>
                  <span className="font-bold text-[#00C48C]">{registeredSuccess.status || 'ACTIVE'}</span>
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <Link
                  href="/dashboard/owner"
                  className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-[#5B4BFF] hover:bg-[#4a3ae0] transition-all shadow-md"
                >
                  Return to Owner Dashboard
                </Link>
                <Link
                  href="/dashboard/superadmin/firms"
                  className="px-6 py-2.5 rounded-full font-bold text-sm text-[#4E5969] bg-[#F6F8FC] hover:text-[#1B1E28] border border-[#E7EAF3] transition-all"
                >
                  View Firm Directory
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Stepper Navigation */}
              <WizardStepper
                currentStep={currentStep}
                steps={WIZARD_STEPS}
                onStepClick={(s) => setCurrentStep(s)}
                maxAccessibleStep={maxAccessibleStep}
              />

              {/* Step Content */}
              {currentStep === 1 && (
                <Step1Branding
                  data={formData}
                  updateData={updateFormData}
                  onNext={goToNext}
                />
              )}

              {currentStep === 2 && (
                <Step2Identity
                  data={formData}
                  updateData={updateFormData}
                  onNext={goToNext}
                  onBack={goToBack}
                />
              )}

              {currentStep === 3 && (
                <Step3PlanTheme
                  data={formData}
                  updateData={updateFormData}
                  onNext={goToNext}
                  onBack={goToBack}
                />
              )}

              {currentStep === 4 && (
                <Step4FirmMode
                  data={formData}
                  updateData={updateFormData}
                  onNext={goToNext}
                  onBack={goToBack}
                />
              )}

              {currentStep === 5 && (
                <Step5RoleMenuAccess
                  firmMode={formData.firm_mode}
                  rolePermissions={rolePermissions}
                  updateRolePermissions={updateRolePermissions}
                  onNext={goToNext}
                  onBack={goToBack}
                />
              )}

              {currentStep === 6 && (
                <Step6LicenseTrial
                  data={formData}
                  updateData={updateFormData}
                  onNext={goToNext}
                  onBack={goToBack}
                />
              )}

              {currentStep === 7 && (
                <Step7ReviewConfirm
                  data={formData}
                  rolePermissions={rolePermissions}
                  onSubmit={handleSubmit}
                  onBack={goToBack}
                  submitting={submitting}
                  error={error}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function FirmRegistrationWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#F6F8FC] text-slate-500 font-bold text-sm">
          Loading Firm Configuration...
        </div>
      }
    >
      <FirmRegistrationWizardContent />
    </Suspense>
  );
}
