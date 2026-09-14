'use client';

import React from 'react';
import PGLogbookView from '@/components/medical-logbook/PGLogbookView';

export default function PGLogbookPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-[#F6F8FC] min-h-screen">
      <PGLogbookView />
    </div>
  );
}
