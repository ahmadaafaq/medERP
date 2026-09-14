'use client';

import React from 'react';
import UGLogbookView from '@/components/medical-logbook/UGLogbookView';

export default function UGLogbookPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-[#F6F8FC] min-h-screen">
      <UGLogbookView />
    </div>
  );
}
