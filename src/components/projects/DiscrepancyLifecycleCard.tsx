import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DiscrepancyItem, DiscrepancyStatus } from '../../types/project';
import { getCurrentPersianDateTime } from '../../utils/jalaliDate';
import { toPersianDigits } from '../../utils/formatters';

interface DiscrepancyLifecycleCardProps {
  discrepancies: DiscrepancyItem[];
  onUpdateDiscrepancyStatus: (
    discrepancyId: string,
    newStatus: DiscrepancyStatus,
    note?: string
  ) => void;
  isArchived: boolean;
}

export const DiscrepancyLifecycleCard: React.FC<DiscrepancyLifecycleCardProps> = ({
  discrepancies,
  onUpdateDiscrepancyStatus,
  isArchived,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusNoteInput, setStatusNoteInput] = useState<{ [id: string]: string }>({});

  const handleStatusChange = (
    item: DiscrepancyItem,
    nextStatus: DiscrepancyStatus
  ) => {
    if (isArchived) return;
    const note = statusNoteInput[item.id] || undefined;
    onUpdateDiscrepancyStatus(item.id, nextStatus, note);
    setStatusNoteInput((prev) => ({ ...prev, [item.id]: '' }));
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-right">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>پرونده مغایرت‌ها و عدم‌انطباق‌های پروژه</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            پیگیری چرخه رفع ایرادات: ثبت مغایرت ← رفع ایراد ← کنترل مجدد و تأیید نهایی
          </p>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
          کل موارد: {toPersianDigits(discrepancies.length)}
        </span>
      </div>

      {discrepancies.length === 0 ? (
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
          هیچ مغایرتی برای این پروژه ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-3">
          {discrepancies.map((disc) => {
            const isExpanded = expandedId === disc.id;
            return (
              <div
                key={disc.id}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          disc.status === 'open'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : disc.status === 'fixed'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {disc.status === 'open'
                          ? 'رفع نشده'
                          : disc.status === 'fixed'
                          ? 'اصلاح شد'
                          : 'تأیید نهایی'}
                      </span>

                      <span className="text-xs font-bold text-slate-900">{disc.title}</span>

                      <span className="text-[10px] text-slate-400">({disc.stageName})</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-normal pt-1">
                      {disc.description}
                    </p>
                  </div>

                  <div className="text-left font-mono text-[10px] text-slate-400">
                    {toPersianDigits(disc.date)}
                  </div>
                </div>

                {/* Location / Floor / Element metadata */}
                {(disc.floor || disc.location || disc.element) && (
                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    {disc.floor && <span>طبقه: <strong>{disc.floor}</strong></span>}
                    {disc.location && <span>موقعیت: <strong>{disc.location}</strong></span>}
                    {disc.element && <span>بخش: <strong>{disc.element}</strong></span>}
                  </div>
                )}

                {/* Status Transition Toolbar (Only if NOT archived) */}
                {!isArchived && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-500">تغییر وضعیت:</span>

                      {disc.status === 'open' && (
                        <button
                          onClick={() => handleStatusChange(disc, 'fixed')}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors"
                        >
                          ثبت «اصلاح شد»
                        </button>
                      )}

                      {disc.status === 'fixed' && (
                        <button
                          onClick={() => handleStatusChange(disc, 'verified')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>کنترل مجدد و «تأیید نهایی»</span>
                        </button>
                      )}

                      {disc.status === 'verified' && (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>پرونده مغایرت بسته و تأیید نهایی شد</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : disc.id)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>تاریخچه وضعیت ({disc.statusHistory?.length || 0})</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                )}

                {/* Audited Status History (بدون overwrite) */}
                {isExpanded && disc.statusHistory && disc.statusHistory.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-[11px] animate-fadeIn">
                    <h5 className="font-bold text-slate-700 text-[10px] pb-1 border-b border-slate-200">
                      گردش کار و تاریخچه تغییر وضعیت:
                    </h5>
                    {disc.statusHistory.map((h, i) => (
                      <div key={i} className="flex justify-between items-center text-slate-600">
                        <span>
                          {h.note || (h.newStatus === 'open' ? 'ثبت مغایرت' : h.newStatus === 'fixed' ? 'اصلاح ایراد' : 'کنترل مجدد و تأیید نهایی')}
                          {h.changedBy ? ` (توسط ${h.changedBy})` : ''}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          {toPersianDigits(h.changedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
