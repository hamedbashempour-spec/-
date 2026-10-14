import React, { useState } from 'react';
import {
  Bell,
  AlertCircle,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  Building2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { AnnouncementItem } from '../types';
import { announcementCategories, announcementsData } from '../data/announcementsData';

export const AnnouncementsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('همه اطلاعیه‌ها');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('ann-1');

  const filteredAnnouncements = announcementsData.filter((item) => {
    const matchesCat =
      selectedCategory === 'همه اطلاعیه‌ها' ||
      item.category === selectedCategory ||
      (selectedCategory === 'اطلاعیه‌های فوری' && item.urgent);

    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            بخش ۷
          </span>
          <h1 className="text-base font-bold text-slate-900">
            اطلاعیه‌ها و مصوبات رسمی انجمن
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          ابلاغیه‌های مجمع، نشست‌های هیئت مدیره، دوره‌های ارتقای پایه و فراخوان‌ها
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو در اطلاعیه‌ها، جلسات، دوره‌ها..."
          className="w-full h-11 pr-10 pl-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-3 text-[11px] text-slate-400 hover:text-slate-700"
          >
            پاک کردن
          </button>
        )}
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="overflow-x-auto pb-1 -mx-2 px-2 flex gap-1.5 scrollbar-none">
        {announcementCategories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filteredAnnouncements.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                item.urgent
                  ? 'bg-rose-50/40 border-rose-200/90 shadow-2xs'
                  : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
            >
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.urgent && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3" />
                        فوری و مهم
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.date}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                </div>

                <button
                  className="p-1 text-slate-400 hover:text-slate-700 shrink-0"
                  aria-label="نمایش جزئیات اطلاعیه"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.summary}
              </p>

              {/* Expanded details */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-100 space-y-2 animate-fadeIn">
                  <p className="text-xs text-slate-700 leading-relaxed font-normal bg-white/70 p-3 rounded-xl border border-slate-100">
                    {item.details}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>مرجع صادرکننده: {item.issuer}</span>
                    <a
                      href="https://t.me/Urmia_QU_Engineers_Association"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline flex items-center gap-1"
                    >
                      <span>مشاهده در کانال تلگرام</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
