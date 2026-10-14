import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Coins,
  Calendar,
  Layers,
  FileCheck,
  ClipboardList,
  Filter,
  BarChart3,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { WagePriceRecord, ArtisanItem } from '../../types';
import {
  APPROVED_CONSTRUCTION_TRADES,
  getFixedUnitForTrade,
} from '../../data/wageTradesData';
import { calculate30DayStats } from '../../services/wageRatesService';
import {
  toPersianDigits,
  formatPersianNumber,
} from '../../utils/formatters';

interface ServiceStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
  allWageRecords: WagePriceRecord[];
  onOpenAddRateForService: (serviceTitle: string) => void;
}

export const ServiceStatsModal: React.FC<ServiceStatsModalProps> = ({
  isOpen,
  onClose,
  serviceTitle,
  allWageRecords,
  onOpenAddRateForService,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'executed_contract' | 'inquiry_quote'>('all');

  if (!isOpen) return null;

  const unit = getFixedUnitForTrade(serviceTitle);

  // 1. Calculate 30-day statistics based strictly on ACTUAL actionDate
  const stats = calculate30DayStats(allWageRecords, serviceTitle, selectedTypeFilter);

  // 2. Filter approved records for this service and current filter
  const approvedRecords = allWageRecords
    .filter(
      (r) =>
        r.status === 'approved' &&
        r.serviceTitle === serviceTitle &&
        (selectedTypeFilter === 'all' || r.priceType === selectedTypeFilter) &&
        r.priceAmountTomans > 0
    )
    .sort((a, b) => (a.actionDate || '').localeCompare(b.actionDate || '')); // Chronological for chart

  // 3. Prepare Chart Data (chronological order)
  const chartData = approvedRecords.map((r, idx) => ({
    name: toPersianDigits(r.actionDate || `نمونه ${idx + 1}`),
    price: r.priceAmountTomans,
    formattedPrice: formatPersianNumber(r.priceAmountTomans),
    typeLabel: r.priceType === 'executed_contract' ? 'کار اجراشده' : 'استعلام قیمت',
    artisanName: r.artisanName,
  }));

  // Chronological reverse for list view (newest to oldest)
  const listRecords = [...approvedRecords].reverse();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  تحلیل و آمار نرخ: {serviceTitle}
                </h3>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  واحد ثابت: {unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                مبتنی بر استعلام‌ها و کارهای اجراشده ثبت‌شده توسط مهندسان
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toggle: All vs Executed vs Inquiry */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              همه سوابق ({toPersianDigits(approvedRecords.length)})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('executed_contract')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedTypeFilter === 'executed_contract'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3 h-3" />
              <span>کار اجراشده</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('inquiry_quote')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedTypeFilter === 'inquiry_quote'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3 h-3" />
              <span>استعلام قیمت</span>
            </button>
          </div>

          <button
            onClick={() => onOpenAddRateForService(serviceTitle)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>ثبت نرخ جدید برای این خدمت</span>
          </button>
        </div>

        {/* Condition Check: If no approved data */}
        {!stats.hasEnoughData && approvedRecords.length === 0 ? (
          <div className="p-8 rounded-2xl bg-amber-50/50 border border-dashed border-amber-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Coins className="w-6 h-6 text-amber-600" />
            </div>
            {/* Exact Required Message */}
            <p className="text-sm font-bold text-slate-800 leading-relaxed max-w-md mx-auto">
              «هنوز قیمت ثبت‌شده‌ای برای این خدمت وجود ندارد. شما می‌توانید نخستین نفری باشید که قیمت این خدمت را ثبت می‌کند.»
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              با ثبت حتی یک سابقه قیمت واقعی یا استعلام، آمار و نمودار این تخصص برای کلیه مهندسان ارومیه شکل خواهد گرفت.
            </p>
            <button
              onClick={() => onOpenAddRateForService(serviceTitle)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ثبت نخستین نرخ برای {serviceTitle}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 4 KPI Cards (30-day stats) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Average */}
              <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200/90 text-right space-y-1">
                <span className="text-[10px] font-bold text-teal-900 block">
                  میانگین ۳۰ روز اخیر:
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-base font-bold text-teal-950">
                    {formatPersianNumber(stats.averagePrice)}
                  </span>
                  <span className="text-[9px] text-teal-800">تومان</span>
                </div>
                <span className="text-[9px] text-teal-700 block font-medium">
                  بر مبنای هر {unit}
                </span>
              </div>

              {/* 2. Min */}
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-right space-y-1">
                <span className="text-[10px] font-bold text-emerald-900 block">
                  کمترین نرخ ۳۰ روز:
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-base font-bold text-emerald-950">
                    {formatPersianNumber(stats.minPrice)}
                  </span>
                  <span className="text-[9px] text-emerald-800">تومان</span>
                </div>
                <span className="text-[9px] text-emerald-700 block font-medium">
                  کف قیمت گزارش‌شده
                </span>
              </div>

              {/* 3. Max */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-right space-y-1">
                <span className="text-[10px] font-bold text-amber-900 block">
                  بیشترین نرخ ۳۰ روز:
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-base font-bold text-amber-950">
                    {formatPersianNumber(stats.maxPrice)}
                  </span>
                  <span className="text-[9px] text-amber-800">تومان</span>
                </div>
                <span className="text-[9px] text-amber-700 block font-medium">
                  سقف قیمت گزارش‌شده
                </span>
              </div>

              {/* 4. Sample Count */}
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-right space-y-1">
                <span className="text-[10px] font-bold text-slate-700 block">
                  تعداد نمونه‌های معتبر:
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-base font-bold text-slate-900">
                    {toPersianDigits(stats.sampleCount)}
                  </span>
                  <span className="text-[9px] text-slate-500">مورد</span>
                </div>
                <span className="text-[9px] text-slate-500 block truncate">
                  {toPersianDigits(stats.executedCount)} اجرا · {toPersianDigits(stats.inquiryCount)} استعلام
                </span>
              </div>
            </div>

            {/* Price Change Chart with Recharts */}
            {chartData.length > 1 && (
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    <span>نمودار روند تغییرات نرخ دستمزد (بر حسب تومان):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    واحد: {unit}
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="wageRateGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => formatPersianNumber(v)}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl text-right text-xs shadow-xl space-y-1">
                                <p className="font-bold text-amber-300">{d.artisanName}</p>
                                <p className="font-mono">
                                  {d.formattedPrice} تومان / {unit}
                                </p>
                                <p className="text-[10px] text-slate-300">
                                  {d.typeLabel} ({d.name})
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#0d9488"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#wageRateGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* List of Verified Rates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
                <span>فهرست سوابق تاییدشده ({toPersianDigits(listRecords.length)} مورد):</span>
                <span className="text-[10px] font-normal text-slate-500">
                  مرتب‌سازی از جدیدترین تاریخ
                </span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {listRecords.map((item) => {
                  const isExecuted = item.priceType === 'executed_contract';
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900">{item.artisanName}</strong>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              isExecuted
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            {isExecuted ? 'کار اجراشده' : 'استعلام قیمت'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>تاریخ کار/استعلام: {toPersianDigits(item.actionDate)}</span>
                          {item.note && (
                            <>
                              <span>·</span>
                              <span className="text-slate-600 line-clamp-1">{item.note}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="font-mono text-sm font-bold text-slate-950 block">
                          {formatPersianNumber(item.priceAmountTomans)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          تومان / {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
