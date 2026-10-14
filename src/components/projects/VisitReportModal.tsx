import React, { useState, useRef } from 'react';
import {
  FileText,
  Check,
  X,
  Calendar,
  Layers,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react';
import { ProjectItem, ProjectStage, DiscrepancyItem, InspectionReportItem } from '../../types/project';
import { getCurrentJalaliDate } from '../../utils/jalaliDate';
import { toPersianDigits } from '../../utils/formatters';
import { compressImageFile } from '../../utils/imageCompressor';

interface VisitReportModalProps {
  project: ProjectItem;
  stages: ProjectStage[];
  currentStageId: number;
  currentUsername: string;
  discrepancies: DiscrepancyItem[];
  onSaveReport: (report: Omit<InspectionReportItem, 'id' | 'createdAt' | 'createdBy'>) => void;
  onClose: () => void;
}

export const VisitReportModal: React.FC<VisitReportModalProps> = ({
  project,
  stages,
  currentStageId,
  currentUsername,
  discrepancies,
  onSaveReport,
  onClose,
}) => {
  const todayFa = getCurrentJalaliDate().formatted;
  const currentStage = stages.find((s) => s.id === currentStageId) || stages[0];

  const [visitDate, setVisitDate] = useState(todayFa);
  const [selectedStageId, setSelectedStageId] = useState(currentStageId || 1);
  const [summary, setSummary] = useState(`بازدید از ${currentStage?.name || 'کارگاه'}`);
  const [description, setDescription] = useState('');
  const [selectedDiscIds, setSelectedDiscIds] = useState<string[]>([]);

  // Photos state (up to 4 compressed images)
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const selectedStageName = stages.find((s) => s.id === selectedStageId)?.name || 'مرحله کارگاهی';

  // Toggle discrepancy
  const handleToggleDisc = (id: string) => {
    setSelectedDiscIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  // Handle Image Selection with Automatic Client-side Compression
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      return;
    }

    const reportNum = `گ‌ب-${todayFa.replace(/\//g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    // Build formal full report text incorporating the typed description
    const selectedDiscs = discrepancies.filter((d) => selectedDiscIds.includes(d.id));
    const discLines =
      selectedDiscs.length > 0
        ? `\n\nنقص‌ها و مغایرت‌های مرتبط با این بازدید:\n` +
          selectedDiscs
            .map(
              (d, i) =>
                `${toPersianDigits(i + 1)}. ${d.title}: ${d.description}${
                  d.floor ? ` (طبقه: ${d.floor})` : ''
                }`
            )
            .join('\n')
        : '';

    const engineerDisplayName = currentUsername.startsWith('مهندس')
      ? currentUsername
      : `مهندس ${currentUsername}`;

    const fullText = `گزارش بازدید کارگاهی
پروژه: ${project.name}
کارفرما: ${project.employerName || 'نامشخص'} | مهندس مجری: ${engineerDisplayName}
تاریخ بازدید: ${visitDate}
مرحله: ${selectedStageName}

شرح اقدامات و مشاهدات بازدید:
${description.trim()}${discLines}

امضاء مهندس مجری: ${engineerDisplayName}`;

    onSaveReport({
      reportNumber: reportNum,
      date: visitDate,
      stageId: selectedStageId,
      stageName: selectedStageName,
      summary: summary.trim() || `بازدید ${selectedStageName}`,
      generalNotes: description.trim(),
      discrepancyIds: selectedDiscIds,
      fullReportText: fullText,
      images: images.length > 0 ? images : undefined,
    });

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn text-right">
        <div className="w-full max-w-xl bg-white rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  ثبت گزارش بازدید کارگاهی
                </h3>
                <p className="text-xs text-slate-500">پروژه {project.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Row 1: Date & Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>تاریخ بازدید:</span>
                </label>
                <input
                  type="text"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  placeholder="مثال: ۱۴۰۵/۰۷/۱۰"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>مرحله کارگاهی:</span>
                </label>
                <select
                  value={selectedStageId}
                  onChange={(e) => {
                    const sId = Number(e.target.value);
                    setSelectedStageId(sId);
                    const st = stages.find((s) => s.id === sId);
                    if (st) setSummary(`بازدید از ${st.name}`);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      مرحله {toPersianDigits(s.id)}: {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Title / Summary */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">موضوع / عنوان خلاصه بازدید:</label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="مثال: بازدید نظارتی از بتن‌ریزی سقف طبقه ۲"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Row 3: Description */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>شرح کامل بازدید انجام‌شده (متن آزاد مهندسی):</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ثبت در گزارش کلی پروژه
                </span>
              </label>
              <textarea
                rows={4}
                required
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="شرح مواردی که در کارگاه مشاهده، بررسی یا دستورکار داده شد را اینجا تایپ کنید. مثال: در بازدید مورخ جاری، عملیات آرماتوربندی و تراز قالب‌ها کنترل گردید..."
                className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 text-xs sm:text-[13px] font-bold text-slate-900 leading-relaxed resize-none font-sans"
              />
            </div>

            {/* Row 4: Photo Attachments Section (Camera & Gallery, Max 4) */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>تصاویر مستند بازدید</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({toPersianDigits(images.length)} از {toPersianDigits(4)} عکس)
                  </span>
                </span>

                {/* Upload buttons */}
                {images.length < 4 && (
                  <div className="flex items-center gap-1.5">
                    {/* Hidden file inputs */}
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

                    {/* Camera Button */}
                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] flex items-center gap-1 transition-colors"
                      title="عکس‌برداری با دوربین"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>دوربین</span>
                    </button>

                    {/* Gallery Button */}
                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                      title="انتخاب از گالری"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                      <span>گالری</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Compression loading indicator */}
              {isCompressing && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال بهینه‌سازی و فشرده‌سازی خودکار تصویر...</span>
                </div>
              )}

              {/* Thumbnails grid */}
              {images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {images.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-300 bg-slate-100 aspect-square shadow-2xs"
                    >
                      <img
                        src={imgSrc}
                        alt={`تصویر مستند ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => setPreviewImage(imgSrc)}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(imgSrc)}
                          className="p-1 rounded-full bg-white/90 text-slate-800 hover:bg-white"
                          title="مشاهده بزرگ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                          title="حذف عکس"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  در صورت نیاز می‌توانید تا ۴ تصویر مستند از محل کارگاه با دوربین یا گالری ضمیمه کنید.
                </p>
              )}
            </div>

            {/* Optional: Associate with open discrepancies */}
            {discrepancies.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>مغایرت‌ها یا نقص‌های مورد پایش در این بازدید (اختیاری):</span>
                </label>
                <div className="max-h-24 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {discrepancies.map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-[11px] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDiscIds.includes(d.id)}
                        onChange={() => handleToggleDisc(d.id)}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span className="truncate flex-1 font-medium text-slate-800">
                        {d.title} ({d.stageName})
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          d.status === 'open'
                            ? 'bg-rose-100 text-rose-800'
                            : d.status === 'fixed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {d.status === 'open' ? 'رفع‌نشده' : d.status === 'fixed' ? 'اصلاح شد' : 'تأیید نهایی'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isCompressing}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ثبت گزارش بازدید</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Full-size Image Preview Modal */}
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
