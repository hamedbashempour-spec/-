import React, { useState, useEffect } from 'react';
import { Bell, X, ExternalLink, ArrowLeft, Volume2, Sparkles } from 'lucide-react';
import { TelegramPost } from '../types';

interface BreakingNewsToastProps {
  onOpenNews: (postId?: string) => void;
}

export const BreakingNewsToast: React.FC<BreakingNewsToastProps> = ({ onOpenNews }) => {
  const [alertPost, setAlertPost] = useState<TelegramPost | null>(null);

  useEffect(() => {
    const handleBreakingNews = (e: any) => {
      if (e.detail) {
        setAlertPost(e.detail);
      }
    };

    window.addEventListener('urmia_breaking_news_alert', handleBreakingNews);
    return () => {
      window.removeEventListener('urmia_breaking_news_alert', handleBreakingNews);
    };
  }, []);

  if (!alertPost) return null;

  const targetPostId = alertPost.id || (alertPost as any).postId;

  const handleOpenAlertNews = () => {
    setAlertPost(null);
    onOpenNews(targetPostId);
  };

  return (
    <aside
      aria-label="اعلان خبر فوری"
      className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-slideDown shadow-2xl rounded-2xl bg-slate-900/95 backdrop-blur-md border-2 border-amber-500 text-white p-3.5 space-y-2 text-right"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleOpenAlertNews}>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" />
            خبر فوری کانال تلگرام
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setAlertPost(null);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="بستن اعلان"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p
        onClick={handleOpenAlertNews}
        className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed cursor-pointer hover:text-amber-200 transition-colors"
      >
        {alertPost.title}
      </p>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
        <span className="text-[10px] text-slate-400 font-mono">
          {alertPost.timeDisplay || 'لحظاتی پیش'}
        </span>

        <div className="flex items-center gap-1.5">
          {alertPost.telegramUrl && (
            <a
              href={alertPost.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 flex items-center gap-1 font-semibold"
            >
              <ExternalLink className="w-3 h-3" />
              <span>تلگرام</span>
            </a>
          )}

          <button
            onClick={handleOpenAlertNews}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1 font-bold shadow-sm active:scale-95 transition-all"
          >
            <span>مشاهده در برنامه</span>
            <ArrowLeft className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};
