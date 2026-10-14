import React, { useState } from 'react';
import { FileText, Eye, Copy, Check, Printer, Download, Clock, Share2, Camera, X } from 'lucide-react';
import { InspectionReportItem } from '../../types/project';
import { toPersianDigits } from '../../utils/formatters';
import { printInspectionReport } from '../../utils/reportPrinter';

interface InspectionReportsListProps {
  reports: InspectionReportItem[];
  onOpenNewReportModal: () => void;
  isArchived: boolean;
}

export const InspectionReportsList: React.FC<InspectionReportsListProps> = ({
  reports,
  onOpenNewReportModal,
  isArchived,
}) => {
  const [viewingReport, setViewingReport] = useState<InspectionReportItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleCopy = (rep: InspectionReportItem) => {
    navigator.clipboard.writeText(rep.fullReportText);
    setCopiedId(rep.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrintOrPdf = (rep: InspectionReportItem) => {
    printInspectionReport(rep);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-right">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>سوابق گزارش‌های رسمی بازدید پروژه</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            فهرست مکاتبات و ابلاغیه‌های کارگاهی با قابلیت پرینت مستقیم، خروجی PDF و کپی متن
          </p>
        </div>

        {!isArchived && (
          <button
            onClick={onOpenNewReportModal}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            <span>تنظیم گزارش بازدید جدید</span>
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
          هنوز گزارش بازدیدی برای این پروژه ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-2.5">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between flex-wrap gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px]">
                    {toPersianDigits(rep.reportNumber)}
                  </span>
                  <span className="font-bold text-slate-900">{rep.summary}</span>
                  {rep.images && rep.images.length > 0 && (
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>{toPersianDigits(rep.images.length)} عکس</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>مرحله: {rep.stageName}</span>
                  <span>•</span>
                  <span>
                    شامل {toPersianDigits(rep.discrepancyIds?.length || 0)} مورد مغایرت
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-mono pl-2">
                  {toPersianDigits(rep.date)}
                </span>

                {/* Print button */}
                <button
                  onClick={() => handlePrintOrPdf(rep)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1"
                  title="پرینت مستقیم و خروجی PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>پرینت / PDF</span>
                </button>

                {/* Copy button */}
                <button
                  onClick={() => handleCopy(rep)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1"
                  title="کپی کل متن گزارش"
                >
                  {copiedId === rep.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>کپی متن</span>
                    </>
                  )}
                </button>

                {/* View button */}
                <button
                  onClick={() => setViewingReport(rep)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>مشاهده</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW FULL REPORT MODAL */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  گزارش رسمی شماره {toPersianDigits(viewingReport.reportNumber)}
                </h4>
                <p className="text-xs text-slate-400">تاریخ: {toPersianDigits(viewingReport.date)}</p>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Report Header Info Bar */}
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs flex items-center justify-between flex-wrap gap-2 text-indigo-950">
              <div>
                <strong>مرحله کارگاه:</strong> {viewingReport.stageName}
              </div>
              <div>
                <strong>موضوع:</strong> {viewingReport.summary}
              </div>
              <div>
                <strong>تاریخ:</strong> {toPersianDigits(viewingReport.date)}
              </div>
            </div>

            {/* User-Written Report Description - Prominent & Heavy Bold */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>متن و شرح گزارش بازدید (نوشته‌شده توسط مهندس):</span>
              </label>
              <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-400/80 text-sm sm:text-base font-black text-slate-950 leading-loose whitespace-pre-wrap font-sans shadow-xs">
                {viewingReport.generalNotes || viewingReport.fullReportText}
              </div>
            </div>

            {/* Full Administrative Text Collapsible / Secondary if different */}
            {viewingReport.generalNotes && viewingReport.fullReportText !== viewingReport.generalNotes && (
              <details className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <summary className="cursor-pointer font-bold text-slate-700 hover:text-indigo-600">
                  مشاهده نسخه کامل متن اداری و ابلاغیه
                </summary>
                <div className="mt-2.5 pt-2 border-t border-slate-200 whitespace-pre-wrap leading-relaxed font-sans text-slate-800">
                  {viewingReport.fullReportText}
                </div>
              </details>
            )}

            {/* Attached Photos Gallery */}
            {viewingReport.images && viewingReport.images.length > 0 && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>تصاویر مستند پیوست ({toPersianDigits(viewingReport.images.length)} عکس)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {viewingReport.images.map((imgSrc, i) => (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden border border-slate-300 aspect-square shadow-2xs group relative cursor-pointer"
                      onClick={() => setPreviewImage(imgSrc)}
                    >
                      <img
                        src={imgSrc}
                        alt={`تصویر مستند ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {/* Print button */}
                <button
                  onClick={() => handlePrintOrPdf(viewingReport)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>پرینت مستقیم / خروجی PDF</span>
                </button>

                {/* Copy button */}
                <button
                  onClick={() => handleCopy(viewingReport)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedId === viewingReport.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">متن کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>کپی کل متن</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image zoom preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 left-3 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="نمای بزرگ تصویر مستند"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
