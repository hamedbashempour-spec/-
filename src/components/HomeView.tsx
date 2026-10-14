import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Send,
  BookOpen,
  Library,
  FolderKanban,
  Calculator,
  Store,
  Users,
  Bell,
  Info,
  Search,
  ChevronLeft,
  Phone,
  Coins,
  Handshake,
  Compass,
  ArrowUpRight,
  MapPin,
} from 'lucide-react';
import { ActiveTab, MojrianServerStatus, TelegramPost } from '../types';
import { AndroidInstallBanner } from './AndroidInstallBanner';
import { formatPersianNumber } from '../utils/formatters';

interface HomeViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  mojrianStatus: MojrianServerStatus | null;
  latestNews: TelegramPost[];
  urgentCount: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  setActiveTab,
  mojrianStatus,
  latestNews,
  urgentCount,
}) => {
  const [globalQuery, setGlobalQuery] = useState('');
  const [dynamicMojrianCount, setDynamicMojrianCount] = useState<number | null>(null);

  // Dynamically fetch live floating mojrian count from portal endpoint
  useEffect(() => {
    fetch('/api/mojrian-list')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.count === 'number') {
          setDynamicMojrianCount(data.count);
        }
      })
      .catch(() => {});
  }, []);

  // Modern, minimalist section tiles (without bulky descriptions)
  const mainSections = [
    {
      id: 'tariffs' as ActiveTab,
      title: 'تعرفه رسمی',
      tag: 'ابلاغیه رسمی',
      icon: Coins,
      accent: 'amber',
      iconBg: 'bg-amber-500/10 text-amber-700 border-amber-300/60',
      badgeClass: 'bg-amber-100/80 text-amber-900 border-amber-200',
    },
    {
      id: 'mojrian' as ActiveTab,
      title: 'ظرفیت اشتغال',
      tag: dynamicMojrianCount ? `${formatPersianNumber(dynamicMojrianCount)} مجری فعال` : 'سهمیه آزاد (شناور)',
      icon: ShieldCheck,
      accent: 'emerald',
      iconBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300/60',
      badgeClass: 'bg-emerald-100/80 text-emerald-900 border-emerald-200',
    },
    {
      id: 'mous' as ActiveTab,
      title: 'تفاهم نامه ها',
      tag: 'تسهیلات و خدمات',
      icon: Handshake,
      accent: 'sky',
      iconBg: 'bg-sky-500/10 text-sky-700 border-sky-300/60',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      id: 'artisans' as ActiveTab,
      title: 'بازار',
      tag: 'خدمات مهندسی، اساتید، کالا',
      icon: Store,
      accent: 'teal',
      iconBg: 'bg-teal-500/10 text-teal-700 border-teal-300/60',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    {
      id: 'news' as ActiveTab,
      title: 'اخبار',
      tag: latestNews.length > 0 ? `${formatPersianNumber(latestNews.length)} خبر تلگرام` : 'کانال رسمی',
      icon: Send,
      accent: 'sky',
      iconBg: 'bg-sky-500/10 text-sky-700 border-sky-300/60',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      id: 'regulations' as ActiveTab,
      title: 'کتابخانه مهندسی',
      tag: '۲۳ مبحث و متن مبحث ۲',
      icon: Library,
      accent: 'amber',
      iconBg: 'bg-amber-500/10 text-amber-700 border-amber-300/60',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'checklists' as ActiveTab,
      title: 'پروژه های من',
      tag: 'پرونده و سوابق کارگاه',
      icon: FolderKanban,
      accent: 'indigo',
      iconBg: 'bg-indigo-500/10 text-indigo-700 border-indigo-300/60',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    {
      id: 'calculators' as ActiveTab,
      title: 'متره و برآورد هوشمند',
      tag: 'ضرایب سرانگشتی و متره',
      icon: Calculator,
      accent: 'violet',
      iconBg: 'bg-violet-500/10 text-violet-700 border-violet-300/60',
      badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
    },
    {
      id: 'announcements' as ActiveTab,
      title: 'اطلاعیه های انجمن',
      tag: urgentCount > 0 ? `${formatPersianNumber(urgentCount)} اطلاعیه فوری` : 'بخشنامه‌ها',
      icon: Bell,
      accent: 'rose',
      iconBg: 'bg-rose-500/10 text-rose-700 border-rose-300/60',
      badgeClass: urgentCount > 0 ? 'bg-rose-100 text-rose-800 font-bold border-rose-300' : 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'about' as ActiveTab,
      title: 'درباره انجمن و تماس',
      tag: 'دفتر ارومیه',
      icon: Info,
      accent: 'slate',
      iconBg: 'bg-slate-500/10 text-slate-700 border-slate-300/60',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  const filteredSections = globalQuery.trim()
    ? mainSections.filter((s) => s.title.includes(globalQuery.trim()) || s.tag.includes(globalQuery.trim()))
    : mainSections;

  return (
    <div className="space-y-4 pb-8 animate-fadeIn text-right">
      {/* Android & PWA Install Notice */}
      <AndroidInstallBanner />

      {/* Modern Engineering Blueprint Hero Banner with Precision Drafting Tools */}
      <section
        className="relative overflow-hidden rounded-2xl text-white p-4 sm:p-5 shadow-md border border-slate-700/80 bg-[#041432] bg-cover bg-left sm:bg-center"
        style={{ backgroundImage: "url('/blueprint-banner.svg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              شهرستان ارومیه · سامانه جامع مهندسی
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>پایش برخط سهمیه</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <img
              src="/icon.svg"
              alt="نشان رسمی انجمن مجریان ذیصلاح ارومیه"
              className="w-12 h-12 rounded-full object-cover shrink-0 shadow-md ring-2 ring-amber-400/40"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                انجمن مجریان ذیصلاح ارومیه
              </h1>
              <p className="text-[11px] text-slate-300">
                سامانه رسمی خدمات مهندسی و نظارت بر اجرای ساختمان
              </p>
            </div>
          </div>

          {/* Quick Modern Action Chips */}
          <div className="pt-1 flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('tariffs')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-2xs active:scale-95 text-[11px]"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>تعرفه مصوب</span>
            </button>

            <button
              onClick={() => setActiveTab('mojrian')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all active:scale-95 border border-white/10 text-[11px]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                ظرفیت مجریان
                {dynamicMojrianCount ? ` (${formatPersianNumber(dynamicMojrianCount)})` : ''}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('regulations')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all active:scale-95 border border-white/10 text-[11px]"
            >
              <Library className="w-3.5 h-3.5 text-amber-400" />
              <span>کتابخانه مهندسی</span>
            </button>

            <button
              onClick={() => setActiveTab('mous')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all active:scale-95 border border-white/10 text-[11px]"
            >
              <Handshake className="w-3.5 h-3.5 text-sky-400" />
              <span>تفاهم‌نامه‌ها</span>
            </button>
          </div>
        </div>
      </section>

      {/* Latest Telegram News Ticker (Minimalist 1-liner) */}
      {latestNews.length > 0 && (
        <div
          onClick={() => setActiveTab('news')}
          className="cursor-pointer px-3.5 py-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between gap-2.5 hover:bg-sky-50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
              <Send className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-2 min-w-0 text-xs">
              <span className="text-[10px] font-bold text-sky-800 shrink-0">خبر رسمی:</span>
              <p className="text-slate-800 truncate font-medium text-[11px]">
                {latestNews[0].title}
              </p>
            </div>
          </div>
          <ChevronLeft className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        </div>
      )}

      {/* Minimal Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={globalQuery}
          onChange={(e) => setGlobalQuery(e.target.value)}
          placeholder="جستجوی سریع در بخش‌ها..."
          className="w-full h-10 pr-9 pl-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 shadow-2xs"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        {globalQuery && (
          <button
            onClick={() => setGlobalQuery('')}
            className="absolute left-3 top-2.5 text-[10px] text-slate-400 hover:text-slate-700"
          >
            پاک کردن
          </button>
        )}
      </div>

      {/* Modern Minimal Bento Grid (Exact user requirement: No heavy descriptions) */}
      <div className="grid grid-cols-2 gap-2.5">
        {filteredSections.map((section) => {
          const Icon = section.icon;

          return (
            <button
              key={section.id}
              onClick={() => {
                setActiveTab(section.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-350 shadow-2xs hover:shadow-xs text-right transition-all flex flex-col justify-between gap-3 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${section.iconBg}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0 rotate-180" />
              </div>

              <div className="space-y-1 w-full">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors leading-snug">
                  {section.title}
                </h3>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] border ${section.badgeClass} leading-tight`}
                >
                  {section.tag}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Official Association Contacts Bar (Clean & Compact) */}
      <section className="p-3 rounded-2xl bg-slate-100/90 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px] font-bold text-slate-800">
              دفتر انجمن:
            </span>
          </div>
          <span className="text-[11px] text-slate-600 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ارومیه، خیابان امینی، روبروی فروشگاه رفاه
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <a
            href="tel:09009838663"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-emerald-800 text-[11px] font-mono font-bold hover:border-emerald-300 shadow-2xs"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>۰۹۰۰۹۸۳۸۶۶۳</span>
          </a>

          <a
            href="https://t.me/Urmia_QU_Engineers_Association"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-sky-800 text-[11px] font-bold hover:border-sky-300 shadow-2xs"
          >
            <Send className="w-3 h-3 text-sky-600" />
            <span>تلگرام</span>
          </a>
        </div>
      </section>
    </div>
  );
};
