'use client';

import React, { useState } from 'react';

interface Step1Props {
  data: {
    logo_url: string;
    cover_url: string;
    banner_url: string;
  };
  updateData: (fields: Partial<{ logo_url: string; cover_url: string; banner_url: string }>) => void;
  onNext: () => void;
}

export default function Step1Branding({ data, updateData, onNext }: Step1Props) {
  const [error, setError] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [uploadingCover, setUploadingCover] = useState<boolean>(false);
  const [uploadingBanner, setUploadingBanner] = useState<boolean>(false);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'cover' | 'banner',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validMimeTypes.includes(file.type)) {
      setError('Invalid file format. Please upload JPEG, PNG, WebP or SVG.');
      return;
    }

    const maxSize = type === 'banner' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size exceeds limit (${type === 'banner' ? '10MB' : '5MB'}).`);
      return;
    }

    if (type === 'logo') setUploadingLogo(true);
    if (type === 'cover') setUploadingCover(true);
    if (type === 'banner') setUploadingBanner(true);

    try {
      // Create local preview and simulate pre-signed/direct upload storage URL
      const reader = new FileReader();
      reader.onload = () => {
        const previewUrl = reader.result as string;
        if (type === 'logo') updateData({ logo_url: previewUrl });
        if (type === 'cover') updateData({ cover_url: previewUrl });
        if (type === 'banner') updateData({ banner_url: previewUrl });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      if (type === 'cover') setUploadingCover(false);
      if (type === 'banner') setUploadingBanner(false);
    }
  };

  const handleContinue = () => {
    if (!data.logo_url) {
      setError('Firm Logo is required to proceed.');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-8 shadow-sm transition-all">
      <div className="border-b border-[#E7EAF3] pb-5 mb-6">
        <h2 className="text-xl font-extrabold text-[#1B1E28]">Step 1 — Firm Visual Branding</h2>
        <p className="text-sm text-[#4E5969] mt-1">
          Upload official visual assets for the institution. These assets will theme the login screen, header and institutional portals.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-[#F04438] text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 1. Firm Logo */}
        <div className="border-2 border-dashed border-[#E7EAF3] hover:border-[#5B4BFF] rounded-[22px] p-5 flex flex-col items-center justify-between text-center transition-all bg-[#F6F8FC]/50 hover:bg-white group">
          <div className="w-full flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl bg-white border border-[#E7EAF3] flex items-center justify-center overflow-hidden mb-4 shadow-sm group-hover:scale-105 transition-transform">
              {data.logo_url ? (
                <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <svg className="w-10 h-10 text-[#4E5969]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <h3 className="font-bold text-[#1B1E28] text-sm">Firm Logo *</h3>
            <p className="text-xs text-[#4E5969] mt-1">Recommended: 512x512 PNG, SVG (Max 5MB)</p>
          </div>

          <label className="mt-4 w-full py-2.5 px-4 rounded-full font-bold text-xs bg-white text-[#5B4BFF] border border-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
            {uploadingLogo ? 'Uploading...' : data.logo_url ? 'Change Logo' : 'Upload Logo'}
          </label>
        </div>

        {/* 2. Cover Photo */}
        <div className="border-2 border-dashed border-[#E7EAF3] hover:border-[#5B4BFF] rounded-[22px] p-5 flex flex-col items-center justify-between text-center transition-all bg-[#F6F8FC]/50 hover:bg-white group">
          <div className="w-full flex flex-col items-center">
            <div className="w-full h-24 rounded-2xl bg-white border border-[#E7EAF3] flex items-center justify-center overflow-hidden mb-4 shadow-sm group-hover:scale-[1.02] transition-transform">
              {data.cover_url ? (
                <img src={data.cover_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-[#4E5969]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              )}
            </div>
            <h3 className="font-bold text-[#1B1E28] text-sm">Profile Cover Photo</h3>
            <p className="text-xs text-[#4E5969] mt-1">Recommended: 1200x400 JPEG/PNG (Max 5MB)</p>
          </div>

          <label className="mt-4 w-full py-2.5 px-4 rounded-full font-bold text-xs bg-white text-[#4E5969] border border-[#E7EAF3] hover:border-[#5B4BFF] hover:text-[#5B4BFF] cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} />
            {uploadingCover ? 'Uploading...' : data.cover_url ? 'Change Cover' : 'Upload Cover'}
          </label>
        </div>

        {/* 3. Index Banner */}
        <div className="border-2 border-dashed border-[#E7EAF3] hover:border-[#5B4BFF] rounded-[22px] p-5 flex flex-col items-center justify-between text-center transition-all bg-[#F6F8FC]/50 hover:bg-white group">
          <div className="w-full flex flex-col items-center">
            <div className="w-full h-24 rounded-2xl bg-white border border-[#E7EAF3] flex items-center justify-center overflow-hidden mb-4 shadow-sm group-hover:scale-[1.02] transition-transform">
              {data.banner_url ? (
                <img src={data.banner_url} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-[#4E5969]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </div>
            <h3 className="font-bold text-[#1B1E28] text-sm">Index Page Banner</h3>
            <p className="text-xs text-[#4E5969] mt-1">Recommended: 1920x600 WebP/JPEG (Max 10MB)</p>
          </div>

          <label className="mt-4 w-full py-2.5 px-4 rounded-full font-bold text-xs bg-white text-[#4E5969] border border-[#E7EAF3] hover:border-[#5B4BFF] hover:text-[#5B4BFF] cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'banner')} />
            {uploadingBanner ? 'Uploading...' : data.banner_url ? 'Change Banner' : 'Upload Banner'}
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#E7EAF3]">
        <button
          onClick={handleContinue}
          className="px-8 py-3 rounded-full font-bold text-sm text-white bg-[#5B4BFF] hover:bg-[#4a3ae0] transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 group"
        >
          <span>Save & Continue to Identity</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
