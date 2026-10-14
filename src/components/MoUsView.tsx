import React, { useState } from 'react';
import {
  FileCheck2,
  Search,
  Building,
  Calendar,
  CheckCircle2,
  Phone,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Tag,
  Handshake,
} from 'lucide-react';
import { officialMoUsData } from '../data/mousData';
import { MoUItem } from '../types';
import { toPersianDigits } from '../utils/formatters';

export const MoUsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('همه تفاهم‌نامه‌ها');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('mou-nezam');

  const categories = [
    'همه تفاهم‌نامه‌ها',
    'سازمان نظام مهندسی و شهرداری',
    'بیمه',
    'بانک و تسهیلات',
    'مصالح و آزمایشگاه',
    'آموزش و پژوهش',
  ];

  const filteredMoUs = officialMoUsData.filter((item) => {
    const matchesCat =
      selectedCategory === 'همه تفاهم‌نامه‌ها' || item.partnerCategory === selectedCategory;

    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.partnerOrganization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-300">
              تفاهم‌نامه‌ها
            </span>
            <h1 className="text-base font-bold text-slate-900">
              تفاهم‌نامه‌های همکاری رسمی انجمن
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            قراردادها و تسهیلات منعقده انجمن با نظام مهندسی، بانک‌ها، بیمه و مراکز تخصصی
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو در تفاهم‌نامه‌ها، نام سازمان طرف قرارداد، تسهیلات..."
          className="w-full h-11 pr-10 pl-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-400 shadow-2xs"
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
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <div className="text-[11px] text-slate-500 px-1">
        <span>نمایش {toPersianDigits(filteredMoUs.length)} تفاهم‌نامه رسمی منعقد شده</span>
      </div>

      {/* MoUs Cards List */}
      <div className="space-y-3">
        {filteredMoUs.map((mou) => {
          const isExpanded = expandedId === mou.id;

          return (
            <div
              key={mou.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-350 transition-all space-y-3"
            >
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : mou.id)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {mou.partnerCategory}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {mou.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      تاریخ امضا: {toPersianDigits(mou.signingDate)}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {mou.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Handshake className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>طرف تفاهم‌نامه: <strong>{mou.partnerOrganization}</strong></span>
                  </p>
                </div>

                <button
                  className="p-1 text-slate-400 hover:text-slate-700 shrink-0"
                  aria-label="نمایش جزئیات تفاهم‌نامه"
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
                {mou.summary}
              </p>

              {/* Expanded details */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-100 space-y-3 animate-fadeIn">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      مزایای کلیدی تفاهم‌نامه برای اعضای انجمن:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {mou.keyBenefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <span>واحد پیگیری: {mou.contactPerson}</span>
                    </div>

                    {mou.phone && (
                      <a
                        href={`tel:${mou.phone}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-slate-800 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>تماس و هماهنگی ({mou.phone})</span>
                      </a>
                    )}
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
