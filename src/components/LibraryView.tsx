import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Send,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
  AlertCircle,
  Library,
  X,
  Bot,
  Layers,
  ArrowRight,
  HelpCircle,
  FileText,
  WifiOff,
  Wifi,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  ShieldAlert,
  Info,
  Bookmark,
  Menu,
} from 'lucide-react';
import {
  ALL_REGULATIONS_CATALOG,
  RegulationCatalogItem,
  getLoadedDocument,
  searchRegulationsClientSide,
} from '../data/regulationsFullCatalog';
import {
  RegulationDocument,
  RegulationChapterData,
  RegulationSectionData,
  RegulationClauseData,
  SearchResultItem,
} from '../types/regulationStructure';

// Formats inline bold text and code snippets
const renderFormattedInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-amber-700 dark:text-amber-400 font-mono text-[11px] border border-slate-300 dark:border-slate-700 mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// Formats AI response into readable sections with the 3 distinct headings
const formatAIResponse = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={index} className="h-1.5" />;
    }

    if (trimmed.startsWith('## ۱. مستندات مقررات') || trimmed.startsWith('## 1. مستندات مقررات')) {
      return (
        <div
          key={index}
          className="mt-4 mb-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-black text-xs sm:text-sm flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
          <span>۱. مستندات مقررات (استناد مستقیم به منبع)</span>
        </div>
      );
    }

    if (trimmed.startsWith('## ۲. تفسیر مقررات') || trimmed.startsWith('## 2. تفسیر مقررات')) {
      return (
        <div
          key={index}
          className="mt-4 mb-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-black text-xs sm:text-sm flex items-center gap-2"
        >
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>۲. تفسیر مقررات (تشریح مفاهیم و الزامات)</span>
        </div>
      );
    }

    if (trimmed.startsWith('## ۳. تحلیل مهندسی هوش مصنوعی') || trimmed.startsWith('## 3. تحلیل مهندسی هوش مصنوعی')) {
      return (
        <div
          key={index}
          className="mt-4 mb-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 font-black text-xs sm:text-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span>۳. تحلیل مهندسی هوش مصنوعی (ارزیابی کارگاهی و مشورتی)</span>
        </div>
      );
    }

    if (trimmed.startsWith('### ')) {
      return (
        <h4
          key={index}
          className="text-xs sm:text-sm font-bold text-amber-900 mt-3 mb-1.5 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          {trimmed.replace(/^###\s*/, '')}
        </h4>
      );
    }

    if (trimmed.startsWith('## ')) {
      return (
        <h3
          key={index}
          className="text-sm font-extrabold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200"
        >
          {trimmed.replace(/^##\s*/, '')}
        </h3>
      );
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const content = trimmed.replace(/^[-*•]\s*/, '');
      return (
        <li
          key={index}
          className="text-xs text-slate-800 leading-relaxed list-none flex items-start gap-2 my-1 pr-1"
        >
          <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
          <span>{renderFormattedInline(content)}</span>
        </li>
      );
    }

    if (/^(\d+|[۰-۹]+)[.-]\s*/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+|[۰-۹]+)[.-]\s*/);
      const num = numMatch ? numMatch[1] : '•';
      const content = trimmed.replace(/^(\d+|[۰-۹]+)[.-]\s*/, '');
      return (
        <div
          key={index}
          className="text-xs text-slate-800 leading-relaxed flex items-start gap-2 my-1.5 pr-1"
        >
          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <span>{renderFormattedInline(content)}</span>
        </div>
      );
    }

    return (
      <p key={index} className="text-xs text-slate-800 leading-relaxed my-1">
        {renderFormattedInline(trimmed)}
      </p>
    );
  });
};

type DisciplineFilter = 'all' | 'سازه' | 'معماری' | 'تأسیسات مکانیکی' | 'تأسیسات برقی' | 'عمومی و ایمنی';
type LibraryTab = 'catalog' | 'reader' | 'search' | 'consultation';

const QUICK_QUESTIONS = [
  'شرح وظایف مجری ذیصلاح در مبحث دوم مقررات ملی',
  'مراحل گزارش‌های نظارت ناظر هماهنگ‌کننده در مبحث ۲',
  'حداکثر طول مجاز دیوار بین وادارها طبق پیوست ۶ ۲۸۰۰',
  'طول وصله پوششی کششی آرماتور در مبحث ۹ ویرایش ۹۹',
  'الزامات بتن‌ریزی در هوای سرد طبق نشریه ۵۵',
  'نحوه حل اختلاف نظر بین ناظر و مجری در مبحث دوم',
];

export const LibraryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('catalog');

  // Catalog state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineFilter>('all');

  // Reader state
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('mabhas-2');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [readerFilterText, setReaderFilterText] = useState('');
  const [copiedClauseId, setCopiedClauseId] = useState<string | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(false);

  // Global full-text search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Smart consultation state
  const [question, setQuestion] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [copiedAiAnswer, setCopiedAiAnswer] = useState(false);

  // Offline network status check
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    return ALL_REGULATIONS_CATALOG.filter((item) => {
      if (selectedDiscipline !== 'all' && item.discipline !== selectedDiscipline) return false;
      if (catalogSearch.trim()) {
        const t = catalogSearch.trim().toLowerCase();
        return (
          item.code.toLowerCase().includes(t) ||
          item.title.toLowerCase().includes(t) ||
          item.summary.toLowerCase().includes(t) ||
          item.year.includes(t)
        );
      }
      return true;
    });
  }, [catalogSearch, selectedDiscipline]);

  // Current active loaded document
  const activeDoc: RegulationDocument | null = useMemo(() => {
    return getLoadedDocument(currentDocumentId);
  }, [currentDocumentId]);

  // Execute global offline search
  const handlePerformGlobalSearch = (q?: string) => {
    const queryToUse = (q !== undefined ? q : globalSearchQuery).trim();
    if (!queryToUse) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    const res = searchRegulationsClientSide(queryToUse);
    setSearchResults(res);
  };

  // Jump from search result directly to reader
  const handleJumpToClause = (regId: string, sectionId?: string, clauseId?: string) => {
    setCurrentDocumentId(regId);
    setActiveTab('reader');
    if (sectionId) {
      setActiveSectionId(sectionId);
    }
    setTimeout(() => {
      if (clauseId) {
        const el = document.getElementById(`clause-${clauseId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-amber-400');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-amber-400');
          }, 3000);
        }
      }
    }, 200);
  };

  // Ask AI
  const handleAskAi = async (q?: string) => {
    const queryToSend = (q || question).trim();
    if (!queryToSend || isLoadingAi) return;

    setActiveQuery(queryToSend);
    setIsLoadingAi(true);
    setAiAnswer(null);

    try {
      const res = await fetch('/api/regulations/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToSend }),
      });

      const data = await res.json();
      if (data.success && data.answer) {
        setAiAnswer(data.answer);
      } else {
        throw new Error(data.error || 'خطا در ارتباط با مشاور هوشمند');
      }
    } catch (err: any) {
      setAiAnswer(
        `متأسفانه در دریافت پاسخ مشکلی رخ داد: ${
          err.message || 'خطای شبکه'
        }. توجه: مشاوره هوش مصنوعی نیازمند اتصال فعال به اینترنت می‌باشد، در حالی که مطالعه و جستجوی متن مباحث کاملاً آفلاین در دسترس است.`
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Copy clause content
  const handleCopyClause = (clause: RegulationClauseData, sectionTitle: string) => {
    const citation = `مرجع: ${activeDoc?.code || 'مقررات ملی ساختمان'} - ${activeDoc?.title || ''}\nبخش: ${sectionTitle}\nشماره استناد رسمی: ${clause.officialNumber}${clause.title ? ` (${clause.title})` : ''}\n\nمتن مصوب:\n${clause.content}${clause.notes ? '\n\n' + clause.notes.join('\n') : ''}`;
    navigator.clipboard.writeText(citation);
    setCopiedClauseId(clause.id);
    setTimeout(() => setCopiedClauseId(null), 2000);
  };

  // Helper for discipline badge
  const getDisciplineBadge = (discipline?: string) => {
    switch (discipline) {
      case 'سازه':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'معماری':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'تأسیسات مکانیکی':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'تأسیسات برقی':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right" dir="rtl">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION TABS                                            */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#07132c] text-white p-5 sm:p-6 shadow-xl border border-slate-800">
        <div className="relative z-10 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-xs font-bold w-fit">
              <Library className="w-4 h-4 text-amber-400" />
              <span>کتابخانه جامع مراجع و مقررات ملی ساختمان</span>
            </div>

            {/* Offline/Online Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-bold font-sans">مطالعه آفلاین + هوش مصنوعی آنلاین</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300 font-bold font-sans">حالت آفلاین (مطالعه و جستجو فعال)</span>
                </>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
              مجموعه رسمی مباحث ۲۳‌گانه و نظامات اداری
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              دسترسی مستقیم و مطالعه متن مصوب، جستجوی بلادرنگ در بندها و شیوه‌نامه‌ها بدون نیاز به اینترنت.
            </p>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="pt-2 flex items-center gap-1.5 flex-wrap border-t border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'catalog'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>فهرست مباحث مقررات ملی</span>
            </button>

            <button
              onClick={() => {
                setCurrentDocumentId('mabhas-2');
                setActiveTab('reader');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'reader'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>مطالعه مبحث دوم (نظامات اداری)</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-400/30">
                متن کامل
              </span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'search'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>جستجوی سراسری در متن</span>
            </button>

            <button
              onClick={() => setActiveTab('consultation')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'consultation'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>مشاوره هوشمند با AI</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAB 1: CATALOG OF ALL 23 REGULATIONS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <section className="space-y-4 animate-fadeIn">
          {/* Search & Discipline Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  فهرست مباحث ۲۳‌گانه و مراجع مهندسی
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                نمایش <strong>{filteredCatalog.length}</strong> عنوان کتاب
              </span>
            </div>

            {/* Title Search Input */}
            <div className="relative">
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="جستجو در نام و شماره مباحث (مثال: نظامات اداری، بتن، گودبرداری، مبحث ۲...)"
                className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              {catalogSearch && (
                <button
                  onClick={() => setCatalogSearch('')}
                  className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Discipline Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
              <span className="text-slate-500 font-medium pl-1 text-[11px]">گرایش:</span>
              {(['all', 'سازه', 'معماری', 'تأسیسات مکانیکی', 'تأسیسات برقی', 'عمومی و ایمنی'] as DisciplineFilter[]).map((disc) => (
                <button
                  key={disc}
                  onClick={() => setSelectedDiscipline(disc)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedDiscipline === disc
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {disc === 'all' ? 'همه' : disc}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                  item.hasFullText
                    ? 'border-amber-300 shadow-xs hover:border-amber-400 hover:shadow-md'
                    : 'border-slate-200 opacity-95 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-black font-mono">
                        {item.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                        {item.edition}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${getDisciplineBadge(item.discipline)}`}>
                        {item.discipline}
                      </span>
                    </div>

                    {item.hasFullText ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        متن کامل موجود ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        در انتظار ورود متن
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {item.hasFullText ? (
                    <button
                      onClick={() => {
                        setCurrentDocumentId(item.id);
                        setActiveTab('reader');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-2xs transition-all active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>مطالعه متن کامل و پیوست‌ها</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      ساختار اطلاعات آماده بارگذاری محتوا
                    </span>
                  )}

                  <button
                    onClick={() => {
                      const p = `ضوابط کلیدی و الزامات فنی در ${item.code} (${item.title}) چیست؟`;
                      setQuestion(p);
                      setActiveTab('consultation');
                      handleAskAi(p);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 font-bold"
                    title="استعلام هوشمند درباره این مبحث"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>مشاوره هوشمند</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: READER VIEW (مطالعه متن مبحث)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'reader' && activeDoc && (
        <section className="space-y-4 animate-fadeIn">
          {/* Reader Top Sticky Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveTab('catalog')}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                title="بازگشت به فهرست مباحث"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs font-mono">
                    {activeDoc.code}
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    {activeDoc.title}
                  </h2>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({activeDoc.edition})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  مرجع رسمی: {activeDoc.officialPublisher}
                </div>
              </div>
            </div>

            {/* Reader Action Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Table of contents drawer toggle */}
              <button
                onClick={() => setIsTocOpen(!isTocOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors"
              >
                <Menu className="w-3.5 h-3.5 text-slate-600" />
                <span>فهرست فصول و مواد</span>
              </button>

              {/* View/Download official PDF */}
              {activeDoc.pdfUrl && (
                <a
                  href={activeDoc.pdfUrl}
                  download="Mabhas2-v1-1384-ATNasr.ir.pdf"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors shadow-2xs"
                  title="دانلود فایل PDF رسمی جهت تطبیق"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>دانلود PDF رسمی</span>
                </a>
              )}

              {/* View Raw Cleaned Markdown Source */}
              <a
                href={`/regulations/${activeDoc.sourceFileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors shadow-2xs"
                title="مشاهده مستقیم فایل منبع استخراج‌شده (mabhas2_cleaned.md)"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>منبع خام (.md)</span>
              </a>
            </div>
          </div>

          {/* Audit & Provenance Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs leading-relaxed text-amber-950 flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                وضعیت پردازش: نسخه اولیه استخراج‌شده از منبع ({activeDoc.sourceFileId})
              </span>
              <p className="text-[11px] text-amber-900 leading-normal">
                این محتوا مستقیماً از فایل منبع پاک‌سازی‌شده استخراج گردیده و کلیه شماره مواد، بندها، تبصره‌ها، جدول‌ها و فرمول‌ها با حفظ شماره‌گذاری رسمی منبع وارد شده‌اند. پیش از استناد رسمی حقوقی، مقایسه با فایل PDF اصلی پیشنهاد می‌گردد.
              </p>
            </div>
          </div>

          {/* In-Book Quick Search Filter */}
          <div className="relative">
            <input
              type="text"
              value={readerFilterText}
              onChange={(e) => setReaderFilterText(e.target.value)}
              placeholder="جستجوی سریع در بندها، مواد یا کلمات این مبحث (مثال: مجری، ناظر هماهنگ‌کننده، داوری، جدول شماره ۵...)"
              className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            {readerFilterText && (
              <button
                onClick={() => setReaderFilterText('')}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Collapsible Table of Contents Navigation Card */}
          {isTocOpen && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                  <span>فهرست سرفصل‌ها و بخش‌های مبحث دوم</span>
                </span>
                <button
                  onClick={() => setIsTocOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto text-xs">
                {activeDoc.chapters.map((ch) => (
                  <div key={ch.id} className="space-y-1">
                    <span className="font-bold text-slate-900 text-[11px] block bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      {ch.officialNumber}: {ch.title}
                    </span>
                    <div className="pr-2 space-y-1">
                      {ch.sections.map((sec) => (
                        <button
                          key={sec.id}
                          onClick={() => {
                            const el = document.getElementById(`section-${sec.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                            setIsTocOpen(false);
                          }}
                          className="text-[11px] text-slate-600 hover:text-amber-700 hover:underline block text-right w-full truncate"
                        >
                          • {sec.officialNumber} - {sec.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VERBATIM CHAPTERS & CLAUSES DISPLAY */}
          <div className="space-y-6">
            {activeDoc.chapters.map((chapter) => {
              // Filter sections if filter text is present
              const matchingSections = chapter.sections.filter((sec) => {
                if (!readerFilterText.trim()) return true;
                const t = readerFilterText.trim().toLowerCase();
                const inSecTitle = sec.title.toLowerCase().includes(t);
                const inSecNum = sec.officialNumber.toLowerCase().includes(t);
                const inClauses = sec.clauses.some(
                  (c) =>
                    c.officialNumber.toLowerCase().includes(t) ||
                    (c.title && c.title.toLowerCase().includes(t)) ||
                    c.content.toLowerCase().includes(t)
                );
                return inSecTitle || inSecNum || inClauses;
              });

              if (matchingSections.length === 0) return null;

              return (
                <div key={chapter.id} className="space-y-4">
                  {/* Chapter Header */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-sm flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold block">
                        {chapter.officialNumber}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                        {chapter.title}
                      </h3>
                      {chapter.description && (
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 shrink-0 font-mono">
                      {matchingSections.length} بخش
                    </span>
                  </div>

                  {/* Sections Inside Chapter */}
                  <div className="space-y-4">
                    {matchingSections.map((section) => (
                      <div
                        id={`section-${section.id}`}
                        key={section.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5"
                      >
                        {/* Section Header */}
                        <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-black text-xs font-mono">
                              {section.officialNumber}
                            </span>
                            <h4 className="text-sm font-black text-slate-900">
                              {section.title}
                            </h4>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {section.clauses.length} بند / ماده
                          </span>
                        </div>

                        {/* Clauses */}
                        <div className="space-y-3.5">
                          {section.clauses.map((clause) => (
                            <div
                              id={`clause-${clause.id}`}
                              key={clause.id}
                              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all space-y-2.5"
                            >
                              {/* Clause Header */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[11px] font-black">
                                    {clause.officialNumber}
                                  </span>
                                  {clause.title && (
                                    <span className="text-xs font-extrabold text-slate-900">
                                      {clause.title}
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleCopyClause(clause, section.title)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] text-slate-700 font-bold transition-colors shadow-2xs shrink-0"
                                  title="کپی استناد این بند"
                                >
                                  {copiedClauseId === clause.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-700">کپی شد</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-500" />
                                      <span>کپی استناد</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Clause Content Body */}
                              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                                {clause.content}
                              </div>

                              {/* Notes (تبصره‌ها) */}
                              {clause.notes && clause.notes.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  {clause.notes.map((note, nIdx) => (
                                    <div
                                      key={nIdx}
                                      className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs leading-relaxed flex items-start gap-2"
                                    >
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                      <span>{note}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Clause Tables if present */}
                              {clause.tables && clause.tables.length > 0 && (
                                <div className="space-y-3 pt-2">
                                  {clause.tables.map((table) => (
                                    <div
                                      key={table.id}
                                      className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                                    >
                                      <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                                        <span>{table.tableNumber}: {table.title}</span>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-right text-xs">
                                          <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black">
                                              {table.headers.map((h, hIdx) => (
                                                <th key={hIdx} className="p-2 border-l border-slate-200 last:border-l-0">
                                                  {h}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {table.rows.map((row, rIdx) => (
                                              <tr
                                                key={rIdx}
                                                className="border-b border-slate-100 hover:bg-slate-50/80 last:border-b-0"
                                              >
                                                {row.map((cell, cIdx) => (
                                                  <td key={cIdx} className="p-2 border-l border-slate-100 last:border-l-0 text-slate-800">
                                                    {cell}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FULL-TEXT SEARCH (جستجوی سراسری در متن مباحث)                     */}
      {/* ========================================================================= */}
      {activeTab === 'search' && (
        <section className="space-y-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  جستجوی جامع در متن مصوب مقررات و شیوه‌نامه‌ها
                </h2>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                جستجوی ۱۰۰٪ آفلاین
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    handlePerformGlobalSearch(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePerformGlobalSearch();
                  }}
                  placeholder="عبارت، شماره ماده یا کلمه کلیدی را بنویسید (مثال: مجری، شناسنامه فنی، هیات سه نفره، داوری، جدول ۵...)"
                  className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-inner"
                />
                <Search className="w-4 h-4 text-amber-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>

              <button
                onClick={() => handlePerformGlobalSearch()}
                className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors shrink-0 shadow-xs"
              >
                جستجو
              </button>
            </div>

            {/* Quick keywords suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-slate-500 font-medium">کلیدواژه‌های پرتکرار:</span>
              {[
                'شناسنامه فنی و ملکی',
                'وظایف مجری',
                'ناظر هماهنگ‌کننده',
                'کمیته داوری',
                'بیمه کیفیت',
                'جدول شماره ۵',
                'طرح و ساخت',
              ].map((kw, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setGlobalSearchQuery(kw);
                    handlePerformGlobalSearch(kw);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition-colors border border-slate-200"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Display */}
          {hasSearched && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span>
                  یافته‌ها برای «{globalSearchQuery}»: <strong>{searchResults.length}</strong> مورد
                </span>
                <span className="text-[11px] text-slate-400">
                  جهت مطالعه بند کامل، روی هر نتیجه کلیک نمایید.
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">هیچ بندی مطابق با این عبارت یافت نشد.</p>
                  <p className="text-[11px] text-slate-500">
                    لطفاً عبارت دیگری را جستجو فرمایید یا از بخش مشاوره هوشمند استعلام بگیرید.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleJumpToClause(item.regulationId, undefined, item.clauseId)}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all p-3.5 sm:p-4 cursor-pointer space-y-2 text-right group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-xs font-mono">
                            {item.officialNumber}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 group-hover:text-amber-950">
                            {item.regulationCode}: {item.clauseTitle || item.sectionTitle}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.chapterTitle}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-2">
                        {item.matchedTextSnippet}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-bold">
                        <span>مشاهده بند در متن کامل</span>
                        <ChevronLeft className="w-3.5 h-3.5 group-hover:translate-x-[-2px] transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SMART AI CONSULTATION (مشاوره هوشمند با ۳ بخش تفکیک‌شده)          */}
      {/* ========================================================================= */}
      {activeTab === 'consultation' && (
        <section className="space-y-4 animate-fadeIn">
          <div className="rounded-3xl bg-white border border-amber-200 shadow-md overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-amber-100/40 to-white border-b border-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <span>مشاور هوشمند مقررات ملی</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h2>
                  <span className="text-[11px] text-amber-800">
                    پاسخ ساختاریافته در ۳ بخش: مستندات مقررات، تفسیر، و تحلیل مهندسی
                  </span>
                </div>
              </div>

              {aiAnswer && (
                <button
                  onClick={() => {
                    setAiAnswer(null);
                    setQuestion('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  پاک کردن
                </button>
              )}
            </div>

            {/* Input Form */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskAi();
                    }}
                    placeholder="پرسش خود را درباره هریک از مباحث، استاندارد ۲۸۰۰ یا نشریات بنویسید..."
                    className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-inner"
                  />
                  <Sparkles className="w-4 h-4 text-amber-500 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>

                <button
                  onClick={() => handleAskAi()}
                  disabled={isLoadingAi || !question.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-sm transition-all shrink-0 active:scale-95"
                >
                  {isLoadingAi ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>در حال استعلام...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>ارسال استعلام</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Questions */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>نمونه استعلام‌های پیشنهادی:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUICK_QUESTIONS.map((qPrompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuestion(qPrompt);
                        handleAskAi(qPrompt);
                      }}
                      className="text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-100 hover:text-amber-950 text-slate-700 transition-colors border border-slate-200 text-right active:scale-95"
                    >
                      {qPrompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Answer Section with 3 distinct categories */}
              {aiAnswer && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-950">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>پاسخ مستند مشاوره هوشمند:</span>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiAnswer);
                        setCopiedAiAnswer(true);
                        setTimeout(() => setCopiedAiAnswer(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-[11px] text-amber-900 hover:text-amber-950 font-bold shadow-2xs"
                    >
                      {copiedAiAnswer ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-700" />
                          <span>کپی پاسخ</span>
                        </>
                      )}
                    </button>
                  </div>

                  {activeQuery && (
                    <div className="text-[11px] font-bold text-slate-600 bg-white/70 px-3 py-1.5 rounded-xl border border-amber-100">
                      موضوع استعلام: <span className="text-slate-900">{activeQuery}</span>
                    </div>
                  )}

                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2 font-sans">
                    {formatAIResponse(aiAnswer)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
