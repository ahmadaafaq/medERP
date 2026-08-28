'use client';

import React from 'react';
import { FileText, FileType, Presentation, Image as ImageIcon, Download, X, Paperclip } from 'lucide-react';
import { ChatAttachment } from '../../hooks/useChat';

interface ChatAttachmentChipProps {
  attachment: ChatAttachment;
  onRemove?: () => void;
  isRemovable?: boolean;
}

export default function ChatAttachmentChip({
  attachment,
  onRemove,
  isRemovable = false,
}: ChatAttachmentChipProps) {
  const { file_name, file_type, file_url, file_size_kb } = attachment;

  const getIcon = () => {
    switch (file_type?.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500 shrink-0" />;
      case 'doc':
      case 'docx':
        return <FileType className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <Paperclip className="w-4 h-4 text-[#5B4BFF] shrink-0" />;
    }
  };

  const isImage = ['image', 'jpg', 'jpeg', 'png', 'webp'].includes(file_type?.toLowerCase() || '');
  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8081';
  const fullDownloadUrl = file_url?.startsWith('http') ? file_url : `${API_BASE}${file_url}`;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700/80 max-w-full text-xs font-medium text-[#1B1E28] dark:text-slate-200 transition-all hover:border-[#5B4BFF]/50 shadow-xs">
      {getIcon()}
      <div className="flex flex-col min-w-0 pr-1">
        <span className="font-bold truncate max-w-[180px] sm:max-w-[240px]" title={file_name}>
          {file_name}
        </span>
        {file_size_kb ? (
          <span className="text-[10px] text-[#4E5969] dark:text-slate-400">
            {file_size_kb > 1024 ? `${(file_size_kb / 1024).toFixed(1)} MB` : `${file_size_kb} KB`}
          </span>
        ) : null}
      </div>

      {isRemovable ? (
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-1"
          title="Remove attachment"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <a
          href={fullDownloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={file_name}
          className="p-1 rounded-lg text-[#5B4BFF] hover:bg-[#5B4BFF]/10 dark:text-indigo-400 transition-colors ml-1 flex items-center gap-1 font-bold text-[11px]"
          title="Download file"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
