'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Loader2, Edit2, X, Check } from 'lucide-react';
import { ChatAttachment } from '../../hooks/useChat';
import ChatAttachmentChip from './ChatAttachmentChip';

interface ChatComposerProps {
  onSend: (body?: string, attachments?: ChatAttachment[]) => Promise<boolean>;
  onUploadAttachment: (file: File) => Promise<ChatAttachment | null>;
  editingMessage?: { id: string; body: string } | null;
  onSaveEdit?: (messageId: string, newBody: string) => Promise<boolean>;
  onCancelEdit?: () => void;
  disabled?: boolean;
}

const COMMON_EMOJIS = ['👍', '👋', '📚', '✅', '💡', '🔥', '👏', '🎯', '✨', '📝', '❓', '🎉', '⏳', '📌', '🚀'];

export default function ChatComposer({
  onSend,
  onUploadAttachment,
  editingMessage = null,
  onSaveEdit,
  onCancelEdit,
  disabled = false,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync text with editingMessage when entering or leaving edit mode
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.body || '');
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
      }, 50);
    }
  }, [editingMessage]);

  const handleSend = async () => {
    if (editingMessage) {
      if (!text.trim() || disabled || sending) return;
      setSending(true);
      const success = onSaveEdit ? await onSaveEdit(editingMessage.id, text.trim()) : false;
      if (success) {
        setText('');
        onCancelEdit?.();
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
      setSending(false);
      return;
    }

    if ((!text.trim() && pendingAttachments.length === 0) || disabled || sending) {
      return;
    }

    setSending(true);
    const success = await onSend(text.trim(), pendingAttachments);
    if (success) {
      setText('');
      setPendingAttachments([]);
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && editingMessage) {
      e.preventDefault();
      onCancelEdit?.();
      setText('');
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Max 15MB
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 15MB size limit.`);
        continue;
      }
      const uploaded = await onUploadAttachment(file);
      if (uploaded) {
        setPendingAttachments((prev) => [...prev, uploaded]);
      }
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-[#E7EAF3] dark:border-slate-800 relative shrink-0 z-10">
      {/* WhatsApp-Style Editing Message Banner */}
      {editingMessage && (
        <div className="mb-2.5 flex items-center justify-between px-3.5 py-2 bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 rounded-xl text-xs text-indigo-950 dark:text-indigo-200 shadow-2xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-[#5B4BFF] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Edit2 className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="font-bold text-[11px] text-[#5B4BFF] flex items-center gap-1.5">
                <span>Editing message</span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">• (Press Esc to cancel)</span>
              </div>
              <p className="text-[11px] text-[#4E5969] dark:text-slate-300 italic truncate max-w-sm sm:max-w-md">
                "{editingMessage.body}"
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onCancelEdit?.();
              setText('');
            }}
            className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors shrink-0"
            title="Cancel editing (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-6 z-30 p-3 bg-white dark:bg-slate-850 border border-[#E7EAF3] dark:border-slate-700 rounded-2xl shadow-xl animate-in zoom-in-95 duration-150">
          <div className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 mb-2 px-1">
            Quick Reactions
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="w-8 h-8 rounded-lg hover:bg-[#F6F8FC] dark:hover:bg-slate-800 flex items-center justify-center text-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Preview Chips */}
      {!editingMessage && pendingAttachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 animate-in fade-in duration-150">
          {pendingAttachments.map((att, idx) => (
            <ChatAttachmentChip
              key={idx}
              attachment={att}
              isRemovable={true}
              onRemove={() => removeAttachment(idx)}
            />
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className={`flex items-end gap-2 bg-[#F6F8FC] dark:bg-slate-850 border rounded-2xl p-2 transition-all ${
        editingMessage
          ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
          : 'border-[#E7EAF3] dark:border-slate-700/80 focus-within:border-[#5B4BFF] focus-within:ring-2 focus-within:ring-[#5B4BFF]/20'
      }`}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment Button (hidden in edit mode) */}
        {!editingMessage && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="p-2 rounded-xl text-[#4E5969] dark:text-slate-400 hover:text-[#5B4BFF] dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Attach PDF, Word, PPT or Image (max 15MB)"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#5B4BFF]" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className="p-2 rounded-xl text-[#4E5969] dark:text-slate-400 hover:text-[#F36C21] hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Insert Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            editingMessage
              ? 'Edit your message... (Press Enter to save, Esc to cancel)'
              : 'Type a message... (Press Enter to send, Shift+Enter for new line)'
          }
          disabled={disabled || sending}
          className="flex-1 min-h-[44px] sm:min-h-[24px] max-h-32 bg-transparent text-xs sm:text-sm text-[#1B1E28] dark:text-white placeholder:text-slate-400 focus:outline-none resize-none py-1 sm:py-1.5 px-2 leading-relaxed sm:leading-normal"
        />

        {/* Send / Save Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && pendingAttachments.length === 0) || disabled || sending || uploading}
          className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center ${
            editingMessage
              ? text.trim() && !sending
                ? 'bg-[#00C48C] hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/30 scale-100 hover:scale-105 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : (text.trim() || pendingAttachments.length > 0) && !sending && !uploading
              ? 'bg-[#5B4BFF] hover:bg-[#4838e6] text-white shadow-md shadow-indigo-500/30 scale-100 hover:scale-105 active:scale-95'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
          title={editingMessage ? 'Save edited message' : 'Send Message'}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : editingMessage ? (
            <Check className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
