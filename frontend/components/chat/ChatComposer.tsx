'use client';

import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Loader2 } from 'lucide-react';
import { ChatAttachment } from '../../hooks/useChat';
import ChatAttachmentChip from './ChatAttachmentChip';

interface ChatComposerProps {
  onSend: (body?: string, attachments?: ChatAttachment[]) => Promise<boolean>;
  onUploadAttachment: (file: File) => Promise<ChatAttachment | null>;
  disabled?: boolean;
}

const COMMON_EMOJIS = ['👍', '👋', '📚', '✅', '💡', '🔥', '👏', '🎯', '✨', '📝', '❓', '🎉', '⏳', '📌', '🚀'];

export default function ChatComposer({
  onSend,
  onUploadAttachment,
  disabled = false,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
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
      {pendingAttachments.length > 0 && (
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
      <div className="flex items-end gap-2 bg-[#F6F8FC] dark:bg-slate-850 border border-[#E7EAF3] dark:border-slate-700/80 rounded-2xl p-2 focus-within:border-[#5B4BFF] focus-within:ring-2 focus-within:ring-[#5B4BFF]/20 transition-all">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment Button */}
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
          placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
          disabled={disabled || sending}
          className="flex-1 max-h-32 bg-transparent text-xs sm:text-sm text-[#1B1E28] dark:text-white placeholder:text-slate-400 focus:outline-none resize-none py-1.5 px-2"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && pendingAttachments.length === 0) || disabled || sending || uploading}
          className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center ${
            (text.trim() || pendingAttachments.length > 0) && !sending && !uploading
              ? 'bg-[#5B4BFF] hover:bg-[#4838e6] text-white shadow-md shadow-indigo-500/30 scale-100 hover:scale-105 active:scale-95'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
          title="Send Message"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
