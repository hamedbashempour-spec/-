import React, { useState, useRef } from 'react';
import {
  FileText,
  Send,
  Check,
  X,
  AlertTriangle,
  Printer,
  Copy,
  Camera,
  Image as ImageIcon,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react';
import { ProjectItem, DiscrepancyItem, InspectionReportItem } from '../../types/project';
import { getCurrentJalaliDate, getCurrentPersianDateTime } from '../../utils/jalaliDate';
import { toPersianDigits } from '../../utils/formatters';
import { printInspectionReport } from '../../utils/reportPrinter';
import { compressImageFile } from '../../utils/imageCompressor';

interface InspectionReportModalProps {
  project: ProjectItem;
  currentUsername: string;
  discrepancies: DiscrepancyItem[];
  stageId: number;
  stageName: string;
  onSaveReport: (report: Omit<InspectionReportItem, 'id' | 'createdAt' | 'createdBy'>) => void;
  onClose: () => void;
}

export const InspectionReportModal: React.FC<InspectionReportModalProps> = ({
  project,
  currentUsername,
  discrepancies,
  stageId,
  stageName,
  onSaveReport,
  onClose,
}) => {
  const todayFa = getCurrentJalaliDate().formatted;
  const [reportDate, setReportDate] = useState(todayFa);
  const [summary, setSummary] = useState(`بازدید مرحله ${stageName}`);
  const [generalNotes, setGeneralNotes] = useState('');
  const [selectedDiscrepancyIds, setSelectedDiscrepancyIds] = useState<string[]>(() =>
    discrepancies.filter((d) => d.status !== 'verified').map((d) => d.id)
  );

  // Photos state (up to 4 compressed images)
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Generate initial formal editable report text
  const generateInitialText = (selectedIds: string[], note: string, date: string) => {
    const selectedDiscs = discrepancies.filter((d) => selectedIds.includes(d.id));
    const discLines =
      selectedDiscs.length > 0
        ? selectedDiscs
            .map(
              (d, idx) =>
                `${idx + 1}. ${d.title}: ${d.description}${d.floor ? ` (طبقه: ${d.floor})` : ''}${
                  d.element ? ` (محل: ${d.element})` : ''
                }`
            )
            .join('\n\n')
        : 'در این بازدید ایراد بحرانی خاصی مشاهده نگردید و عملیات جاری کنترل شد.';

    const engineerTitle = currentUsername.startsWith('مهندس')
      ? currentUsername
      : `مهندس ${currentUsername}`;

    return `گزارش بازدید کارگاهی پروژه

مشخصات پروژه:
- نام پروژه: ${project.name}
- آدرس: ${project.address || 'ثبت نشده'}
- شماره پروانه ساختمانی: ${project.licenseNumber || 'ثبت نشده'}
- شماره قرارداد مدیریت پیمان: ${project.contractNumber || 'ثبت نشده'}
- کارفرما: ${project.employerName || 'نامشخص'}
- تاریخ بازدید: ${date}
- مرحله کنترل‌شده: ${stageName}

کارفرما / پیمانکار محترم، جناب آقای / سرکار خانم ${project.employerName || 'کارفرما'}
با سلام و احترام

پیرو بازدید انجام‌شده از پروژه «${project.name}» در تاریخ ${date} در مرحله «${stageName}»، موارد عدم انطباق و ایرادات اجرایی زیر در محل کارگاه مشاهده گردید:

${discLines}

${note ? `توضیحات تکمیلی نظارت و اجرا:\n${note}\n\n` : ''}بدیهی است باید در اسرع وقت اقدام به بررسی و رفع اصولی موارد فوق بر اساس نقشه‌ها مصوب و ضوابط ملی ساختمان گردد و پس از رفع ایرادات، جهت کنترل مجدد به اینجانب اعلام فرمایید.

مجری ذی‌صلاح پروژه: ${engineerTitle}
تاریخ گزارش: ${date}
امضاء و مهر مجری`;
  };

  const [fullReportText, setFullReportText] = useState(() =>
    generateInitialText(selectedDiscrepancyIds, generalNotes, todayFa)
  );

  const handleToggleDiscrepancy = (id: string) => {
    const nextIds = selectedDiscrepancyIds.includes(id)
      ? selectedDiscrepancyIds.filter((item) => item !== id)
      : [...selectedDiscrepancyIds, id];
    setSelectedDiscrepancyIds(nextIds);
    setFullReportText(generateInitialText(nextIds, generalNotes, reportDate));
  };

  const handleImageFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    const files = Array.from(filesList);
    const availableSlots = 4 - images.length;
    if (availableSlots <= 0) return;

    const filesToProcess = files.slice(0, availableSlots);
    setIsCompressing(true);

    try {
      const compressedResults: string[] = [];
      for (const file of filesToProcess) {
        const compressedBase64 = await compressImageFile(file, {
          maxDimension: 1200,
          quality: 0.72,
        });
        compressedResults.push(compressedBase64);
      }

      setImages((prev) => [...prev, ...compressedResults].slice(0, 4));
    } catch (err) {
      console.error('Error compressing image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const reportNum = `گ‌ب-${todayFa.replace(/\//g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    onSaveReport({
      reportNumber: reportNum,
      date: reportDate,
      stageId,
      stageName,
      summary: summary.trim() || `بازدید مرحله ${stageName}`,
      generalNotes: generalNotes.trim() || undefined,
      discrepancyIds: selectedDiscrepancyIds,
      fullReportText: fullReportText.trim(),
      images: images.length > 0 ? images : undefined,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto animate-fadeIn text-right">
        <div className="w-full max-w-2xl bg-white rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 my-6 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  تهیه و تنظیم گزارش رسمی بازدید پروژه
                </h3>
                <p className="text-xs text-slate-500">پروژه: {project.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">تاریخ بازدید:</label>
                <input
                  type="text"
                  required
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    setFullReportText(
                      generateInitialText(selectedDiscrepancyIds, generalNotes, e.target.value)
                    );
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">مرحله کارگاه:</label>
                <input
                  type="text"
                  disabled
                  value={stageName}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">عنوان خلاصه گزارش:</label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Select Discrepancies */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>انتخاب مغایرت‌های درج شونده در این گزارش:</span>
                <span className="text-[11px] text-slate-400">
                  {toPersianDigits(selectedDiscrepancyIds.length)} از {toPersianDigits(discrepancies.length)} مورد
                </span>
              </label>

              {discrepancies.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-center">
                  در حال حاضر هیچ مغایرتی برای این پروژه ثبت نشده است.
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50">
                  {discrepancies.map((d) => (
                    <label
                      key={d.id}
                      className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDiscrepancyIds.includes(d.id)}
                        onChange={() => handleToggleDiscrepancy(d.id)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 truncate">{d.title}</strong>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              d.status === 'open'
                                ? 'bg-rose-100 text-rose-800'
                                : d.status === 'fixed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {d.status === 'open' ? 'رفع‌نشده' : d.status === 'fixed' ? 'اصلاح شد' : 'تأیید نهایی'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {d.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Photo Attachments (Max 4) */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>تصاویر مستند گزارش ({toPersianDigits(images.length)} از {toPersianDigits(4)} عکس)</span>
                </span>

                {images.length < 4 && (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        handleImageFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleImageFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />

                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>دوربین</span>
                    </button>

                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] flex items-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                      <span>گالری</span>
                    </button>
                  </div>
                )}
              </div>

              {isCompressing && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال فشرده‌سازی خودکار تصویر...</span>
                </div>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {images.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-300 bg-slate-100 aspect-square shadow-2xs"
                    >
                      <img
                        src={imgSrc}
                        alt={`مستند ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setPreviewImage(imgSrc)}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(imgSrc)}
                          className="p-1 rounded-full bg-white/90 text-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 rounded-full bg-rose-600 text-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Editable Full Report Text */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>متن رسمی گزارش (قابل ویرایش):</span>
                <span className="text-[11px] text-slate-400">
                  این متن عیناً در نسخه چاپی و PDF خروجی قرار می‌گیرد
                </span>
              </label>
              <textarea
                rows={9}
                value={fullReportText}
                onChange={(e) => setFullReportText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    printInspectionReport({
                      id: 'temp',
                      reportNumber: `گ‌ب-${reportDate.replace(/\//g, '')}-پیش‌نویس`,
                      date: reportDate,
                      stageId,
                      stageName,
                      summary,
                      discrepancyIds: selectedDiscrepancyIds,
                      fullReportText,
                      images,
                      createdAt: todayFa,
                      createdBy: currentUsername,
                    });
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 flex items-center gap-1.5 transition-colors"
                  title="پیش‌نمایش پرینت و خروجی PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>پرینت / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(fullReportText);
                    setCopyFeedback(true);
                    setTimeout(() => setCopyFeedback(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
                  title="کپی متن گزارش"
                >
                  {copyFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی متن</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold shadow-xs transition-transform active:scale-95"
                >
                  ثبت و ذخیره گزارش در پرونده
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Image Preview Modal */}
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
    </>
  );
};
