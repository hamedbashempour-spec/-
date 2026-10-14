import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  Clock,
  Coins,
  Calendar,
  AlertTriangle,
  Trash2,
  BarChart3,
  RefreshCw,
  FileCheck,
  ClipboardList,
} from 'lucide-react';
import { WagePriceRecord, ArtisanItem } from '../../types';
import { APPROVED_CONSTRUCTION_TRADES } from '../../data/wageTradesData';
import {
  approveWagePrice,
  rejectWagePrice,
  deleteWagePrice,
} from '../../services/wageRatesService';
import {
  toPersianDigits,
  formatPersianNumber,
} from '../../utils/formatters';
import { playNotificationChime } from '../../services/notificationService';

interface AdminWageModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  wageRecords: WagePriceRecord[];
  onRefresh: () => void;
}

export const AdminWageModerationModal: React.FC<AdminWageModerationModalProps> = ({
  isOpen,
  onClose,
  wageRecords,
  onRefresh,
}) => {
  const [localRecords, setLocalRecords] = useState<WagePriceRecord[]>(wageRecords);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [serviceFilter, setServiceFilter] = useState<string>('همه خدمات');
  const [typeFilter, setTypeFilter] = useState<'all' | 'executed_contract' | 'inquiry_quote'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingRecordId, setRejectingRecordId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setLocalRecords(wageRecords);
  }, [wageRecords]);

  if (!isOpen) return null;

  // Counts from local records
  const pendingCount = localRecords.filter((w) => w.status === 'pending').length;
  const approvedCount = localRecords.filter((w) => w.status === 'approved').length;
  const rejectedCount = localRecords.filter((w) => w.status === 'rejected').length;

  // Filtered records
  const filteredRecords = localRecords.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (serviceFilter !== 'همه خدمات' && r.serviceTitle !== serviceFilter) return false;
    if (typeFilter !== 'all' && r.priceType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        r.artisanName.toLowerCase().includes(q) ||
        r.serviceTitle.toLowerCase().includes(q) ||
        (r.registeredByEngineerName && r.registeredByEngineerName.toLowerCase().includes(q)) ||
        (r.note && r.note.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  // Calculate filtered stats
  const prices = filteredRecords.map((r) => r.priceAmountTomans).filter((p) => p > 0);
  const sum = prices.reduce((a, b) => a + b, 0);
  const stats = prices.length === 0
    ? { avg: 0, min: 0, max: 0, count: 0 }
    : {
        avg: Math.round(sum / prices.length),
        min: Math.min(...prices),
        max: Math.max(...prices),
        count: prices.length,
      };

  const handleApprove = async (id: string, name: string) => {
    setProcessingId(id);
    setActionFeedback(null);
    setActionError(null);
    try {
      const updated = await approveWagePrice(id);
      playNotificationChime();
      setLocalRecords((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'approved', approvedAt: updated?.approvedAt || 'هم‌اکنون' } : r
        )
      );
      setActionFeedback(`نرخ «${name}» با موفقیت تأیید شد و در آمار عمومی بازار منتشر گردید.`);
      setTimeout(() => setActionFeedback(null), 5000);
      onRefresh();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setActionError(err?.message || 'خطا در تایید نرخ دستمزد');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async (id: string) => {
    setProcessingId(id);
    setActionFeedback(null);
    setActionError(null);
    try {
      const updated = await rejectWagePrice(id, rejectionReason.trim() || undefined);
      setLocalRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'rejected', rejectionReason: updated?.rejectionReason || rejectionReason }
            : r
        )
      );
      setActionFeedback('سابقه نرخ رد شد و از آمار عمومی خارج گردید.');
      setTimeout(() => setActionFeedback(null), 5000);
      setRejectingRecordId(null);
      setRejectionReason('');
      onRefresh();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setActionError(err?.message || 'خطا در رد نرخ دستمزد');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    setActionFeedback(null);
    setActionError(null);
    try {
      await deleteWagePrice(id);
      setLocalRecords((prev) => prev.filter((r) => r.id !== id));
      setActionFeedback('سابقه نرخ حذف گردید.');
      setTimeout(() => setActionFeedback(null), 3000);
      onRefresh();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setActionError(err?.message || 'خطا در حذف نرخ');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportExcel = () => {
    const queryParams = new URLSearchParams();
    if (statusFilter !== 'all') queryParams.set('status', statusFilter);
    if (serviceFilter !== 'همه خدمات') queryParams.set('serviceTitle', serviceFilter);
    if (typeFilter !== 'all') queryParams.set('priceType', typeFilter);

    const downloadUrl = `/api/market/wages/export-excel?${queryParams.toString()}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  مدیریت و تأیید سوابق نرخ خدمات ساختمانی
                </h3>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  پنل مدیریت
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                بررسی صحت ارقام، تایید یا رد سوابق، دریافت فایل اکسل و پایش آمار بازار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="دریافت خروجی اکسل کامل با اعمال فیلترها"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>خروجی اکسل</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionFeedback}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="text-emerald-700 hover:text-emerald-950">✕</button>
          </div>
        )}

        {actionError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-950">✕</button>
          </div>
        )}

        {/* Status Counters Tab */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="block text-[10px] sm:text-xs">در انتظار بررسی</span>
            <span className="font-mono text-sm sm:text-base font-bold">{toPersianDigits(pendingCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="block text-[10px] sm:text-xs">تاییدشده</span>
            <span className="font-mono text-sm sm:text-base font-bold">{toPersianDigits(approvedCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white font-bold border-rose-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="block text-[10px] sm:text-xs">ردشده</span>
            <span className="font-mono text-sm sm:text-base font-bold">{toPersianDigits(rejectedCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="block text-[10px] sm:text-xs">کل سوابق</span>
            <span className="font-mono text-sm sm:text-base font-bold">{toPersianDigits(wageRecords.length)}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Service Dropdown */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-9 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold focus:outline-none focus:border-teal-500"
          >
            <option value="همه خدمات">همه ۱۲ خدمت ساختمانی</option>
            {APPROVED_CONSTRUCTION_TRADES.map((t) => (
              <option key={t.id} value={t.title}>
                {t.title}
              </option>
            ))}
          </select>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="h-9 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
          >
            <option value="all">همه انواع سوابق (اجرا و استعلام)</option>
            <option value="executed_contract">فقط کار اجراشده</option>
            <option value="inquiry_quote">فقط استعلام قیمت</option>
          </select>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در استادکار، مهندس، توضیحات..."
              className="w-full h-9 pr-8 pl-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-[11px] focus:outline-none focus:border-teal-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Stats for Filtered Data */}
        {stats.count > 0 && (
          <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">تعداد فیلترشده:</span>
              <strong className="font-mono text-slate-900">{toPersianDigits(stats.count)} مورد</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">میانگین نرخ:</span>
              <strong className="font-mono text-teal-800">{formatPersianNumber(stats.avg)} ت</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">کمترین نرخ:</span>
              <strong className="font-mono text-emerald-800">{formatPersianNumber(stats.min)} ت</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">بیشترین نرخ:</span>
              <strong className="font-mono text-amber-800">{formatPersianNumber(stats.max)} ت</strong>
            </div>
          </div>
        )}

        {/* Rejection Form Modal Overlay if active */}
        {rejectingRecordId && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-2 animate-fadeIn text-xs">
            <div className="flex items-center justify-between font-bold text-rose-900">
              <span>علت رد سابقه نرخ را وارد فرمایید:</span>
              <button
                onClick={() => {
                  setRejectingRecordId(null);
                  setRejectionReason('');
                }}
                className="text-rose-700"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: نرخ غیرمنطقی و خارج از عرف بازار، عدم صحت اطلاعات..."
              className="w-full h-9 px-3 rounded-lg bg-white border border-rose-200 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => handleRejectConfirm(rejectingRecordId)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
              >
                ثبت رد سابقه
              </button>
              <button
                onClick={() => setRejectingRecordId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs"
              >
                انصراف
              </button>
            </div>
          </div>
        )}

        {/* Records List */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1 text-xs">
          {filteredRecords.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500">
              هیچ سابقه نرخی با مشخصات انتخابی یافت نشد.
            </div>
          ) : (
            filteredRecords.map((item) => {
              const isExecuted = item.priceType === 'executed_contract';
              const isPending = item.status === 'pending';
              const isApproved = item.status === 'approved';
              const isRejected = item.status === 'rejected';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                    isPending
                      ? 'bg-amber-50/20 border-amber-300 ring-1 ring-amber-400/20'
                      : isApproved
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-rose-50/15 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.serviceTitle}</span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border">
                          واحد: {item.unit}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isExecuted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {isExecuted ? 'کار اجراشده' : 'استعلام قیمت'}
                        </span>
                        {isPending && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-amber-600" />
                            در انتظار بررسی
                          </span>
                        )}
                        {isApproved && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
                            تاییدشده
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded">
                            ردشده
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1">
                        استادکار: <strong className="text-slate-800">{item.artisanName}</strong>
                        {item.artisanPhone && ` (${item.artisanPhone})`}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-left shrink-0">
                      <span className="font-mono text-base font-bold text-slate-950 block">
                        {formatPersianNumber(item.priceAmountTomans)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        تومان / {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Bar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>تاریخ کار/استعلام: <strong className="font-mono text-slate-700">{toPersianDigits(item.actionDate)}</strong></span>
                      <span>مهندس ثبت‌کننده: <strong className="text-slate-750">{item.registeredByEngineerName || 'عضو انجمن'}</strong></span>
                      {item.createdAt && <span className="text-[10px] text-slate-400">ثبت سامانه: {toPersianDigits(item.createdAt)}</span>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 mr-auto">
                      {isPending && (
                        <button
                          onClick={() => handleApprove(item.id, `${item.serviceTitle} - ${item.artisanName}`)}
                          disabled={processingId === item.id}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        >
                          {processingId === item.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{processingId === item.id ? 'در حال تأیید...' : 'تأیید و انتشار'}</span>
                        </button>
                      )}

                      {!isRejected && (
                        <button
                          onClick={() => setRejectingRecordId(item.id)}
                          disabled={processingId === item.id}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="رد سابقه"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رد</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={processingId === item.id}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="حذف سابقه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.note && (
                    <p className="text-[10.5px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      توضیح ثبت‌کننده: {item.note}
                    </p>
                  )}

                  {item.rejectionReason && (
                    <p className="text-[10.5px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      علت رد توسط مدیر: {item.rejectionReason}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
