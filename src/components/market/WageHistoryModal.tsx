import React from 'react';
import {
  X,
  History,
  Coins,
  Calendar,
  FileCheck,
  ClipboardList,
  PlusCircle,
  AlertCircle,
  Building,
} from 'lucide-react';
import { WagePriceRecord, ArtisanItem } from '../../types';
import {
  toPersianDigits,
  formatPersianNumber,
} from '../../utils/formatters';

interface WageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  artisan: ArtisanItem | null;
  serviceTitle: string;
  unit: string;
  records: WagePriceRecord[];
  onOpenAddRate: (artisan: ArtisanItem, serviceTitle: string) => void;
}

export const WageHistoryModal: React.FC<WageHistoryModalProps> = ({
  isOpen,
  onClose,
  artisan,
  serviceTitle,
  unit,
  records,
  onOpenAddRate,
}) => {
  if (!isOpen || !artisan) return null;

  // Filter approved records for this artisan and service, sorted newest to oldest
  const filteredRecords = records
    .filter(
      (r) =>
        r.status === 'approved' &&
        r.artisanId === artisan.id &&
        r.serviceTitle === serviceTitle
    )
    .sort((a, b) => {
      const dCmp = (b.actionDate || '').localeCompare(a.actionDate || '');
      if (dCmp !== 0) return dCmp;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  تاریخچه نرخ: {serviceTitle}
                </h3>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  واحد: {unit}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                استادکار: <strong className="text-slate-800">{artisan.fullName}</strong> ({artisan.phone})
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

        {/* Content */}
        {filteredRecords.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Coins className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">
                هنوز نرخ تاییدشده‌ای برای این خدمت ثبت نشده است.
              </p>
              <p className="text-[11px] text-slate-500">
                شما می‌توانید اولین نرخ واقعی یا استعلامی این استادکار را ثبت فرمایید.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAddRate(artisan, serviceTitle);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ثبت نرخ جدید برای این خدمت</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>تعداد سوابق تاییدشده: {toPersianDigits(filteredRecords.length)} مورد</span>
              <span>مرتب‌سازی: از جدیدترین به قدیمی‌ترین</span>
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {filteredRecords.map((item, idx) => {
                const isExecuted = item.priceType === 'executed_contract';
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Price & Unit */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-base font-bold text-slate-950">
                          {formatPersianNumber(item.priceAmountTomans)}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          تومان / {item.unit}
                        </span>
                      </div>

                      {/* Type Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          isExecuted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}
                      >
                        {isExecuted ? (
                          <>
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            <span>کار اجراشده</span>
                          </>
                        ) : (
                          <>
                            <ClipboardList className="w-3 h-3 text-blue-600" />
                            <span>استعلام قیمت</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Metadata: Date & Submitter Note */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2 flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>تاریخ:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {toPersianDigits(item.actionDate)}
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-[10.5px] text-slate-600 line-clamp-1 max-w-xs" title={item.note}>
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Action to Register Another Rate */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  onClose();
                  onOpenAddRate(artisan, serviceTitle);
                }}
                className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>ثبت نرخ جدید برای این استادکار</span>
              </button>
              <button
                onClick={onClose}
                className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                بستن
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
