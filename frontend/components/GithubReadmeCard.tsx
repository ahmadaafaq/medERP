'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  Github, 
  ExternalLink, 
  RotateCw, 
  Code2, 
  Eye, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';

interface GithubReadmeCardProps {
  githubUrl?: string;
  isPharma?: boolean;
}

export default function GithubReadmeCard({ githubUrl, isPharma }: GithubReadmeCardProps) {
  const [username, setUsername] = useState<string>('');
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Extract clean username from GitHub URL or Markdown format (e.g., [Afreen234](https://github.com/Afreen234/Afreen234)/README.md)
  const extractUsername = (url?: string): string => {
    if (!url) return '';
    let clean = url.trim();

    // Check if passed in markdown link syntax: [username](https://github.com/...)
    const mdMatch = clean.match(/\[.*?\]\((.*?)\)/);
    if (mdMatch && mdMatch[1]) {
      clean = mdMatch[1].trim();
    }

    if (clean.includes('github.com/')) {
      const pathAfter = clean.split('github.com/')[1].split('?')[0];
      const segments = pathAfter.split('/').filter(Boolean);
      return segments[0] || '';
    }

    if (clean.includes('raw.githubusercontent.com/')) {
      const pathAfter = clean.split('raw.githubusercontent.com/')[1].split('?')[0];
      const segments = pathAfter.split('/').filter(Boolean);
      return segments[0] || '';
    }

    if (clean.includes('/')) {
      const segments = clean.split('/').filter(Boolean);
      return segments[0].replace(/^@/, '').trim();
    }

    return clean.replace(/^@/, '').trim();
  };

  const decodeBase64Utf8 = (b64: string): string => {
    try {
      const cleanB64 = b64.replace(/\s/g, '');
      const binary = atob(cleanB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return atob(b64.replace(/\s/g, ''));
    }
  };

  const fetchReadme = async (user: string) => {
    if (!user) {
      setReadmeContent('');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Try raw main branch: https://raw.githubusercontent.com/{user}/{user}/main/README.md
      let res = await fetch(`https://raw.githubusercontent.com/${user}/${user}/main/README.md`);
      
      // 2. Try raw main branch lowercase readme.md
      if (!res.ok) {
        res = await fetch(`https://raw.githubusercontent.com/${user}/${user}/main/readme.md`);
      }

      // 3. Fallback to master branch
      if (!res.ok) {
        res = await fetch(`https://raw.githubusercontent.com/${user}/${user}/master/README.md`);
      }

      // 4. Fallback to master branch lowercase readme.md
      if (!res.ok) {
        res = await fetch(`https://raw.githubusercontent.com/${user}/${user}/master/readme.md`);
      }

      if (res.ok) {
        const text = await res.text();
        setReadmeContent(text);
        return;
      }

      // 5. Fallback to GitHub API readme endpoint
      const apiRes = await fetch(`https://api.github.com/repos/${user}/${user}/readme`);
      if (apiRes.ok) {
        const apiJson = await apiRes.json();
        if (apiJson.download_url) {
          const dlRes = await fetch(apiJson.download_url);
          if (dlRes.ok) {
            const text = await dlRes.text();
            setReadmeContent(text);
            return;
          }
        }
        if (apiJson.content && apiJson.encoding === 'base64') {
          const decoded = decodeBase64Utf8(apiJson.content);
          setReadmeContent(decoded);
          return;
        }
      }

      setError(`No public ${user}/${user}/README.md found on GitHub.`);
      setReadmeContent('');
    } catch (err: any) {
      setError('Unable to load GitHub Profile README at this time.');
      setReadmeContent('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = extractUsername(githubUrl);
    setUsername(user);
    if (user && !isPharma) {
      fetchReadme(user);
    } else {
      setReadmeContent('');
      setError(null);
    }
  }, [githubUrl, isPharma]);

  // If Pharmacy student or no GitHub username, don't show
  if (isPharma || !username) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden transition-all duration-300">
      {/* Header bar styled like GitHub repository file header */}
      <div className="p-4 sm:p-5 border-b border-[#E7EAF3] dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Github className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {username}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-black text-[#1B1E28] dark:text-white flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#5B4BFF]" />
                README.md
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/70 text-[#5B4BFF] dark:text-indigo-300 border border-[#5B4BFF]/20">
                Profile Portfolio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Auto-rendered GitHub profile markdown document
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Toggle Preview / Raw Markdown */}
          {readmeContent && (
            <div className="flex items-center p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                  viewMode === 'raw'
                    ? 'bg-white dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>Raw .md</span>
              </button>
            </div>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchReadme(username)}
            disabled={loading}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#5B4BFF] hover:border-[#5B4BFF] transition-all disabled:opacity-50"
            title="Refresh README from GitHub"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5B4BFF]' : ''}`} />
          </button>

          {/* External link to GitHub repo */}
          <a
            href={`https://github.com/${username}/${username}/blob/main/README.md`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#5B4BFF] hover:border-[#5B4BFF] transition-all"
            title="Open README on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#5B4BFF] transition-all"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Card Content Body */}
      {isExpanded && (
        <div className="p-6 transition-all">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#5B4BFF] border-t-transparent animate-spin" />
              <p className="text-xs font-bold text-[#5B4BFF]">
                Fetching {username}/{username}/README.md...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-800/40 text-center space-y-2">
              <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {error}
              </p>
              <p className="text-[11px] text-slate-400">
                To create a GitHub Profile README, create a public repository on GitHub named{' '}
                <span className="font-mono font-bold text-[#5B4BFF]">{username}</span> with a{' '}
                <span className="font-mono font-bold">README.md</span> file.
              </p>
            </div>
          ) : readmeContent ? (
            viewMode === 'preview' ? (
              <div className="github-readme-markdown prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto space-y-4">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-xl sm:text-2xl font-black text-[#11141A] dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 mt-4 mb-3" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-lg sm:text-xl font-extrabold text-[#1B1E28] dark:text-slate-100 pb-1.5 border-b border-slate-200 dark:border-slate-800 mt-4 mb-2.5" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-base sm:text-lg font-bold text-[#1B1E28] dark:text-slate-200 mt-3.5 mb-2" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <div className="text-[#4E5969] dark:text-slate-300 leading-relaxed my-2" {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <a className="text-[#5B4BFF] hover:underline font-semibold" target="_blank" rel="noreferrer" {...props} />
                    ),
                    img: ({ node, src, ...props }: any) => {
                      let resolvedSrc = src;
                      if (resolvedSrc && !resolvedSrc.startsWith('http://') && !resolvedSrc.startsWith('https://') && !resolvedSrc.startsWith('data:')) {
                        resolvedSrc = `https://raw.githubusercontent.com/${username}/${username}/main/${resolvedSrc.replace(/^\.\//, '')}`;
                      }
                      return (
                        <img
                          src={resolvedSrc}
                          className="inline-block max-w-full rounded-md shadow-xs my-1 mr-1.5 align-middle"
                          loading="lazy"
                          {...props}
                        />
                      );
                    },
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside space-y-1 my-2 text-[#4E5969] dark:text-slate-300" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside space-y-1 my-2 text-[#4E5969] dark:text-slate-300" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="my-0.5 text-xs sm:text-sm" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-[#5B4BFF] pl-4 italic text-slate-500 dark:text-slate-400 my-2" {...props} />
                    ),
                    code: ({ node, inline, ...props }: any) => (
                      inline ? (
                        <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold text-[#5B4BFF]" {...props} />
                      ) : (
                        <pre className="bg-[#1E1E2E] text-slate-100 p-4 rounded-xl overflow-x-auto text-[11px] font-mono my-3 shadow-inner">
                          <code {...props} />
                        </pre>
                      )
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-3">
                        <table className="min-w-full border border-slate-200 dark:border-slate-700 text-left text-xs" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 font-black" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border border-slate-200 dark:border-slate-700 p-2" {...props} />
                    ),
                  }}
                >
                  {readmeContent}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-t-xl border-b border-slate-700 text-slate-300 text-xs">
                  <span className="font-mono text-[11px] text-slate-400">README.md · {readmeContent.length} bytes</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard.writeText(readmeContent);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-[#00C48C]" />
                        <span className="text-[#00C48C]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-b-xl overflow-x-auto font-mono text-xs leading-relaxed max-h-[500px]">
                  <code>{readmeContent}</code>
                </pre>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
