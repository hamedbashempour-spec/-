import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Phone,
  Calendar,
  Building,
  User,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { MojriRecord } from '../types';
import { toPersianDigits, formatPersianNumber } from '../utils/formatters';

interface MojrianViewProps {
  serverStatus: any;
  onRefreshStatus?: () => Promise<void>;
  isLoading?: boolean;
  isAdmin?: boolean;
  onOpenReferralMonitoring?: () => void;
}

export const MojrianView: React.FC<MojrianViewProps> = ({
  isAdmin,
  onOpenReferralMonitoring,
}) => {
  const [mojrian, setMojrian] = useState<MojriRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Filters & Sorting (Defaulted to حقیقی as requested)
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'حقیقی' | 'حقوقی'>('حقیقی');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'metraj_desc' | 'metraj_asc' | 'tedad_desc' | 'name'>('metraj_desc');
  const [displayCount, setDisplayCount] = useState<number>(30);

  const fetchMojrianList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mojrian-list');
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          setMojrian(data.items);
          setLastUpdated(data.lastUpdated || new Date().toISOString());
        }
      }
    } catch (err) {
      console.error('Error fetching mojrian list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMojrianList();
  }, []);

  // Filtered & Sorted Records
  const filteredMojrian = useMemo(() => {
    let result = [...mojrian];

    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter((m) => m.type === typeFilter);
    }

    // Filter by grade
    if (gradeFilter !== 'all') {
      result = result.filter((m) => String(m.grade).trim() === gradeFilter);
    }

    // Search by name, phone, manager
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.manager.toLowerCase().includes(q) ||
          m.rawContact.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'metraj_desc') return b.remainingMeterage - a.remainingMeterage;
      if (sortBy === 'metraj_asc') return a.remainingMeterage - b.remainingMeterage;
      if (sortBy === 'tedad_desc') return b.remainingCount - a.remainingCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'fa');
      return 0;
    });

    return result;
  }, [mojrian, typeFilter, gradeFilter, searchQuery, sortBy]);

  const visibleMojrian = filteredMojrian.slice(0, displayCount);

  // Statistics
  const realCount = mojrian.filter((m) => m.type === 'حقیقی').length;
  const corpCount = mojrian.filter((m) => m.type === 'حقوقی').length;

  return (
    <div className="space-y-4 pb-12 animate-fadeIn text-right">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              بخش ۱
            </span>
            <h1 className="text-base font-bold text-slate-900">
              مجریان دارای ظرفیت اشتغال
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            فهرست مستقیم سازندگان حقیقی و حقوقی دارای سهمیه آزاد در شهرستان ارومیه
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMojrianList}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            title="به‌روزرسانی و دریافت نسخه جدید"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>به‌روزرسانی</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center sm:text-right">
          <span className="text-[10px] text-slate-400 block mb-0.5">کل مجریان فعال</span>
          <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
            {formatPersianNumber(mojrian.length)}
          </span>
          <span className="text-[10px] text-slate-500 block">شهر ارومیه</span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center sm:text-right">
          <span className="text-[10px] text-slate-400 block mb-0.5">مجریان حقیقی</span>
          <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono">
            {formatPersianNumber(realCount)}
          </span>
          <span className="text-[10px] text-slate-500 block">مهندسان ذی‌صلاح</span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center sm:text-right">
          <span className="text-[10px] text-slate-400 block mb-0.5">شرکت‌های حقوقی</span>
          <span className="text-sm sm:text-base font-bold text-sky-700 font-mono">
            {formatPersianNumber(corpCount)}
          </span>
          <span className="text-[10px] text-slate-500 block">سازنده حقوقی</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجوی سریع بر اساس نام سازنده، مدیرعامل، شماره تماس..."
          className="w-full h-11 pr-10 pl-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 shadow-2xs"
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

      {/* Type Tabs: All, Real, Corporate */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
        <button
          onClick={() => {
            setTypeFilter('all');
            setDisplayCount(30);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            typeFilter === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          همه ({toPersianDigits(mojrian.length)})
        </button>
        <button
          onClick={() => {
            setTypeFilter('حقیقی');
            setDisplayCount(30);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            typeFilter === 'حقیقی'
              ? 'bg-white text-emerald-800 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          مجریان حقیقی ({toPersianDigits(realCount)})
        </button>
        <button
          onClick={() => {
            setTypeFilter('حقوقی');
            setDisplayCount(30);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            typeFilter === 'حقوقی'
              ? 'bg-white text-sky-800 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          مجریان حقوقی ({toPersianDigits(corpCount)})
        </button>
      </div>

      {/* Grade and Sort Selectors */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">فیلتر پایه پروانه:</label>
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value);
              setDisplayCount(30);
            }}
            className="w-full h-9 px-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-400"
          >
            <option value="all">همه پایه‌ها</option>
            <option value="1">پایه ۱</option>
            <option value="2">پایه ۲</option>
            <option value="3">پایه ۳</option>
            <option value="ارشد">پایه ارشد</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 block mb-1">مرتب‌سازی نتایج:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full h-9 px-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-400"
          >
            <option value="metraj_desc">بیشترین مانده متراژ</option>
            <option value="metraj_asc">کمترین مانده متراژ</option>
            <option value="tedad_desc">بیشترین تعداد کار مجاز</option>
            <option value="name">نام الفبایی</option>
          </select>
        </div>
      </div>

      {/* Results Header Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>نمایش {toPersianDigits(visibleMojrian.length)} از {toPersianDigits(filteredMojrian.length)} مجری دارای سهمیه</span>
        {lastUpdated && (
          <span className="font-mono text-[10px] text-slate-400">
            بروزرسانی: {new Date(lastUpdated).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && mojrian.length === 0 && (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-800">
            در حال دریافت مستقیم فهرست مجریان از سامانه نظام مهندسی...
          </p>
          <span className="text-[10px] text-slate-400">
            لطفاً چند لحظه شکیبا باشید
          </span>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMojrian.length === 0 && (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-xs font-bold text-slate-800">
            مجری با مشخصات وارد شده یافت نشد
          </h3>
          <p className="text-[11px] text-slate-500">
            عبارت جستجو یا فیلتر پایه را تغییر دهید.
          </p>
        </div>
      )}

      {/* Executors List */}
      <div className="space-y-2.5">
        {visibleMojrian.map((mojri, idx) => (
          <div
            key={mojri.id || idx}
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-350 transition-all space-y-3"
          >
            {/* Header: Name and Type */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      mojri.type === 'حقوقی'
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {mojri.type === 'حقوقی' ? 'شرکت حقوقی' : 'سازنده حقیقی'}
                  </span>

                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    پایه {toPersianDigits(mojri.grade)}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    ارومیه
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                  {mojri.name}
                </h3>

                {mojri.manager && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    مدیرعامل: <span className="font-semibold text-slate-800">{mojri.manager}</span>
                  </p>
                )}
              </div>

              {/* Remaining Quota Meterage Display */}
              <div className="text-left shrink-0">
                <span className="text-[10px] text-slate-400 block">مانده متراژ کار:</span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono" dir="ltr">
                  {formatPersianNumber(mojri.remainingMeterage)}
                </span>
                <span className="text-[9px] text-slate-500 block">متر مربع</span>
              </div>
            </div>

            {/* Quota & Dates Meta Row */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-[10px] text-slate-400">مانده تعداد کار:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {toPersianDigits(mojri.remainingCount)} پروژه
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-[10px] text-slate-400">اعتبار پروانه:</span>
                <span className="font-mono text-slate-800 text-[11px]" dir="ltr">
                  {toPersianDigits(mojri.expireDate || '—')}
                </span>
              </div>
            </div>

            {/* Direct Call Button if Phone Available */}
            {mojri.phone && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`tel:${mojri.phone}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تماس مستقیم با مجری ({mojri.phone})</span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {visibleMojrian.length < filteredMojrian.length && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setDisplayCount((prev) => prev + 30)}
            className="w-full py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            نمایش ۳۰ مجری بعدی (باقیمانده: {toPersianDigits(filteredMojrian.length - visibleMojrian.length)})
          </button>
        </div>
      )}

      {/* Source Citation */}
      <div className="p-3 rounded-xl bg-slate-100 text-[10px] text-slate-500 border border-slate-200/80 text-center">
        اطلاعات مستقیماً از درگاه مانده ظرفیت سازمان نظام مهندسی ساختمان استان آذربایجان غربی استخراج گردیده است.
      </div>
    </div>
  );
};
