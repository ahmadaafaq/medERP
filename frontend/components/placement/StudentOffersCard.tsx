'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  DollarSign, 
  Sparkles,
  Loader2
} from 'lucide-react';

interface StudentOffer {
  application_id: number;
  drive_id: number;
  company_name: string;
  role: string;
  package_ctc: string;
  status: string;
  offer_status: string; // 'pending' | 'accepted' | 'declined' | 'none'
  applied_at: string;
}

interface StudentOffersCardProps {
  placedCount: number;
  offers: StudentOffer[];
  onRefresh: () => void;
}

export default function StudentOffersCard({
  placedCount,
  offers,
  onRefresh,
}: StudentOffersCardProps) {
  const [loadingAppId, setLoadingAppId] = useState<number | null>(null);

  const handleOfferResponse = async (appId: number, action: 'accept' | 'decline') => {
    setLoadingAppId(appId);
    try {
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '') : 'srms-cet-bareilly';
      await axios.patch(`/api/placement-drive/offers/${appId}/respond?tenant=${tenant}`, { action }).catch(async () => {
        return axios.patch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/offers/${appId}/respond?tenant=${tenant}`, { action });
      });
      onRefresh();
    } catch (e) {
      console.error('Error responding to offer:', e);
    } finally {
      setLoadingAppId(null);
    }
  };

  const receivedOffers = offers.filter(
    (o) => o.status === 'Selected' || o.offer_status === 'accepted' || o.offer_status === 'declined'
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-700 shadow-sm space-y-5">
      {/* Top Banner Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#2D2575] to-[#40349a] text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 block">
              Placement Outcomes & Offers
            </span>
            <h3 className="text-xl font-black tracking-tight">
              Companies Placed: <span className="text-emerald-300">{placedCount}</span>
            </h3>
          </div>
        </div>

        <div className="text-xs text-indigo-100 font-medium">
          {placedCount > 0
            ? '🎉 Congratulations! You have active institutional job offers.'
            : 'Explore visiting companies below and submit your drive applications.'}
        </div>
      </div>

      {/* Offers Roster */}
      {receivedOffers.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Corporate Job Offers ({receivedOffers.length})
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {receivedOffers.map((offer) => {
              const isAccepted = offer.offer_status === 'accepted';
              const isDeclined = offer.offer_status === 'declined';
              const isPending = !isAccepted && !isDeclined;

              return (
                <div
                  key={offer.application_id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isAccepted
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : isDeclined
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-[#5B4BFF] font-black text-base flex items-center justify-center shrink-0">
                      {offer.company_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {offer.company_name}
                        </span>
                        <span className="text-xs font-bold text-[#5B4BFF] dark:text-[#7867FF]">
                          {offer.package_ctc}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {offer.role}
                      </p>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isAccepted && (
                      <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        ACCEPTED
                      </span>
                    )}

                    {isDeclined && (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Declined
                      </span>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOfferResponse(offer.application_id, 'accept')}
                          disabled={loadingAppId === offer.application_id}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95 flex items-center gap-1"
                        >
                          {loadingAppId === offer.application_id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Accept Offer'
                          )}
                        </button>

                        <button
                          onClick={() => handleOfferResponse(offer.application_id, 'decline')}
                          disabled={loadingAppId === offer.application_id}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all active:scale-95"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 text-center text-xs text-slate-500 dark:text-slate-400">
          No job offers recorded yet. Keep preparing and apply to scheduled drives below!
        </div>
      )}
    </div>
  );
}
