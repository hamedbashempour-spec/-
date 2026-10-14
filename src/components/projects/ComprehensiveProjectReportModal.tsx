import React, { useState } from 'react';
import { FileText, Printer, X, CheckCircle2, AlertTriangle, Layers, Calendar, Building, User, Award, Camera, Eye } from 'lucide-react';
import { ProjectItem, ProjectStage } from '../../types/project';
import { toPersianDigits } from '../../utils/formatters';
import { printComprehensiveProjectReport } from '../../utils/reportPrinter';

interface ComprehensiveProjectReportModalProps {
  project: ProjectItem;
  stages: ProjectStage[];
  onClose: () => void;
}

export const ComprehensiveProjectReportModal: React.FC<ComprehensiveProjectReportModalProps> = ({
  project,
  stages,
  onClose,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const reports = project.reports || [];
  const discrepancies = project.discrepancies || [];
  const totalStages = stages.length;
  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const fixedDiscs = discrepancies.filter((d) => d.status === 'fixed' || d.status === 'verified').length;
  const openDiscs = discrepancies.filter((d) => d.status === 'open').length;
  const isAllCompleted = completedStages === totalStages && totalStages > 0;

  const currentStage = stages.find((s) => s.id === (project.currentStageId || 1))
    || stages.find((s) => s.status === 'in_progress')
    || stages[0];
  const currentStageName = project.projectStatus === 'completed' || isAllCompleted
    ? 'اتمام کل مراحل پروژه'
    : (currentStage?.name || `مرحله ${toPersianDigits(project.currentStageId || 1)}`);

  const handlePrint = () => {
    printComprehensiveProjectReport(project, stages);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn text-right">
      <div className="w-full max-w-4xl bg-white rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                گزارش کلی و جامع سوابق پروژه
              </h3>
              <p className="text-xs text-slate-500">
                شناسنامه فنی، سوابق بازدیدهای کارگاهی و رفع مغایرت‌ها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ رسمی / خروجی PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Completion Badge if finished */}
        {isAllCompleted && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تمام مراحل کارگاه به اتمام رسیده و پروژه رسماً تکمیل گردیده است.</span>
            </div>
            <span className="font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              پیشرفت فیزیکی: ۱۰۰٪
            </span>
          </div>
        )}

        {/* Section 1: Project Specs Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>مشخصات فنی و عوامل اجرایی پروژه</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">نام پروژه:</span>
              <strong className="text-slate-900">{project.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">کارفرما:</span>
              <strong className="text-slate-900">{project.employerName || 'نامشخص'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">مهندس ناظر:</span>
              <strong className="text-slate-900">{project.supervisorName || 'نامشخص'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">مهندس مجری:</span>
              <strong className="text-slate-900">{project.userId}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">نوع سازه:</span>
              <strong className="text-indigo-800">{project.structureType}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">تعداد طبقات:</span>
              <strong className="text-slate-900">{toPersianDigits(project.floorsCount)} طبقه</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">شماره پروانه:</span>
              <strong className="font-mono text-slate-800">{project.licenseNumber || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">شماره قرارداد:</span>
              <strong className="font-mono text-slate-800">{project.contractNumber || '-'}</strong>
            </div>

            <div className="col-span-2 sm:col-span-4">
              <span className="text-slate-500 block text-[11px]">آدرس کارگاه:</span>
              <strong className="text-slate-800">{project.address || 'ثبت نشده'}</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
            <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug truncate" title={currentStageName}>
              {currentStageName}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">مرحله در حال اجرا</div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
            <div className="font-mono text-base font-extrabold text-indigo-700">
              {toPersianDigits(reports.length)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">کل گزارش‌های بازدید</div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
            <div className="font-mono text-base font-extrabold text-emerald-700">
              {toPersianDigits(fixedDiscs)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">نقص‌های رفع‌شده</div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
            <div className={`font-mono text-base font-extrabold ${openDiscs > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {toPersianDigits(openDiscs)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">نقص‌های باز (جاری)</div>
          </div>
        </div>

        {/* Section 3: All Site Visit Inspection Reports */}
        <div className="space-y-2.5">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>سوابق گزارش‌های بازدید کارگاهی ({toPersianDigits(reports.length)})</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">ثبت‌شده توسط مهندس مجری</span>
          </h4>

          {reports.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              هنوز هیچ گزارش بازدیدی برای این پروژه ثبت نشده است. با زدن دکمه «ثبت گزارش بازدید» می‌توانید مشاهدات کارگاهی را ذخیره نمایید.
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((rep, idx) => (
                <div key={rep.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                        #{toPersianDigits(idx + 1)}
                      </span>
                      <strong className="text-slate-900">{rep.summary || rep.stageName}</strong>
                      <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {rep.stageName}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                      تاریخ: {toPersianDigits(rep.date)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-indigo-600" />
                      <span>متن و شرح گزارش بازدید (ثبت‌شده توسط مهندس):</span>
                    </span>
                    <p className="font-black text-slate-950 leading-loose bg-white p-3.5 rounded-xl border-2 border-slate-400/80 whitespace-pre-wrap text-xs sm:text-sm shadow-xs">
                      {rep.generalNotes || rep.fullReportText}
                    </p>
                  </div>

                  {/* Attached Photos in Comprehensive Report */}
                  {rep.images && rep.images.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>تصاویر مستند بازدید ({toPersianDigits(rep.images.length)} عکس پیوست):</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {rep.images.map((imgSrc, i) => (
                          <div
                            key={i}
                            className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border border-slate-300 cursor-pointer shadow-2xs group relative"
                            onClick={() => setPreviewImage(imgSrc)}
                          >
                            <img
                              src={imgSrc}
                              alt={`مستند ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: All Discrepancies and Resolutions */}
        <div className="space-y-2.5">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>سوابق نقص‌ها، مغایرت‌ها و وضعیت رفع آن‌ها ({toPersianDigits(discrepancies.length)})</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">
              {toPersianDigits(fixedDiscs)} مورد رفع‌شده
            </span>
          </h4>

          {discrepancies.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-medium">
              در طول مراحل اجرایی این پروژه هیچ مغایرت یا نقص فنی ثبت نشده است و عملیات کاملاً منطبق بوده است.
            </div>
          ) : (
            <div className="space-y-2">
              {discrepancies.map((disc, idx) => {
                const isFixed = disc.status === 'fixed' || disc.status === 'verified';
                return (
                  <div
                    key={disc.id || idx}
                    className={`p-3.5 rounded-xl border space-y-1.5 text-xs ${
                      disc.status === 'verified'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : disc.status === 'fixed'
                        ? 'bg-blue-50/70 border-blue-200'
                        : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          #{toPersianDigits(idx + 1)}
                        </span>
                        <strong className="text-slate-900">{disc.title}</strong>
                        <span className="text-[11px] text-slate-500">
                          ({disc.stageName}{disc.floor ? ` - ${disc.floor}` : ''})
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          disc.status === 'verified'
                            ? 'bg-emerald-600 text-white'
                            : disc.status === 'fixed'
                            ? 'bg-blue-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {disc.status === 'verified'
                          ? 'تأیید نهایی و رفع شد'
                          : disc.status === 'fixed'
                          ? 'اصلاح شد'
                          : 'رفع‌نشده (جاری)'}
                      </span>
                    </div>

                    <p className="text-slate-700 bg-white/90 p-2 rounded-lg border border-slate-200/60 leading-relaxed">
                      {disc.description}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>تاریخ ثبت: <strong className="font-mono">{toPersianDigits(disc.date)}</strong></span>
                      {disc.updatedAt && (
                        <span>آخرین وضعیت: <strong className="font-mono">{toPersianDigits(disc.updatedAt)}</strong></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="text-[11px] text-slate-500">
            گزارش استخراج‌شده در تاریخ {toPersianDigits(new Date().toLocaleDateString('fa-IR'))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              بستن
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ رسمی / ذخیره PDF</span>
            </button>
          </div>
        </div>
      </div>

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
