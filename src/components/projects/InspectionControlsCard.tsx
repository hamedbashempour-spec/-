import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  Plus,
  FileCheck,
  Check,
  X,
  Lock,
} from 'lucide-react';
import {
  InspectionItem,
  DiscrepancyItem,
} from '../../types/project';
import { DefaultStageControlItem } from '../../data/stageChecklistsMapping';
import { getControlsForStageName } from '../../utils/stageGenerator';
import { getCurrentJalaliDate } from '../../utils/jalaliDate';
import { toPersianDigits } from '../../utils/formatters';

interface InspectionControlsCardProps {
  stageId: number;
  stageName: string;
  structureType?: string;
  isCurrentActiveStage: boolean;
  isStageCompleted: boolean;
  isStageLocked: boolean;
  inspections: InspectionItem[];
  onAddInspection: (
    item: Omit<InspectionItem, 'id' | 'createdAt'>,
    discrepancyData?: Omit<DiscrepancyItem, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
  ) => void;
  onBulkAddInspections?: (
    items: Omit<InspectionItem, 'id' | 'createdAt'>[]
  ) => void;
  onCompleteStage?: (stageId: number) => void;
  isArchived: boolean;
}

export const InspectionControlsCard: React.FC<InspectionControlsCardProps> = ({
  stageId,
  stageName,
  structureType,
  isCurrentActiveStage,
  isStageCompleted,
  isStageLocked,
  inspections,
  onAddInspection,
  onBulkAddInspections,
  onCompleteStage,
  isArchived,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [highlightSubmit, setHighlightSubmit] = useState(false);

  // Auto-scroll helper to bring the submit button into view smoothly
  const scrollToSubmitButton = () => {
    setHighlightSubmit(true);
    setTimeout(() => {
      submitButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      submitButtonRef.current?.focus();
    }, 120);
    setTimeout(() => {
      setHighlightSubmit(false);
    }, 2500);
  };

  // Auto-scroll to show the first checklist item whenever the stage changes
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [stageId]);

  // Modal for discrepancy input when user clicks "مغایرت"
  const [activeDiscrepancyItem, setActiveDiscrepancyItem] = useState<{
    id?: string;
    title: string;
  } | null>(null);
  const [discDesc, setDiscDesc] = useState('');
  const [discLocation, setDiscLocation] = useState('');
  const [discFloor, setDiscFloor] = useState('');
  const [discElement, setDiscElement] = useState('');

  // Custom Item Modal
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const todayFa = getCurrentJalaliDate().formatted;

  // Single unified checklist items for this stage matching the project's structure type
  const displayedControls: DefaultStageControlItem[] =
    getControlsForStageName(stageId, stageName, structureType);

  // Map of inspection results already recorded in this stage by title (first encountered is newest)
  const recordedByTitle = new Map<string, InspectionItem>();
  inspections
    .filter((i) => i.stageId === stageId)
    .forEach((item) => {
      if (!recordedByTitle.has(item.title.trim())) {
        recordedByTitle.set(item.title.trim(), item);
      }
    });

  // Fast action: "کنترل شد / مطابق"
  const handleMarkCompliant = (title: string) => {
    if (isArchived || isStageLocked) return;
    onAddInspection({
      stageId,
      stageName,
      title: title.trim(),
      result: 'compliant',
      notes: 'کنترل شد - مطابق نقشه‌های مصوب و ضوابط فنی و ایمنی',
      date: todayFa,
    });
  };

  // Fast action: "شامل پروژه نیست"
  const handleMarkNotApplicable = (title: string) => {
    if (isArchived || isStageLocked) return;
    onAddInspection({
      stageId,
      stageName,
      title: title.trim(),
      result: 'not_applicable',
      notes: 'شامل این پروژه نیست',
      date: todayFa,
    });
  };

  // Open Discrepancy Form
  const handleOpenDiscrepancyModal = (title: string, id?: string) => {
    if (isArchived || isStageLocked) return;
    setActiveDiscrepancyItem({ id, title });
    setDiscDesc('');
    setDiscLocation('');
    setDiscFloor('');
    setDiscElement('');
  };

  // Submit Discrepancy Form
  const handleSaveDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDiscrepancyItem || !discDesc.trim()) {
      alert('لطفاً شرح مغایرت مشاهده‌شده را وارد فرمایید.');
      return;
    }

    onAddInspection(
      {
        stageId,
        stageName,
        title: activeDiscrepancyItem.title.trim(),
        result: 'discrepancy',
        date: todayFa,
      },
      {
        stageId,
        stageName,
        title: activeDiscrepancyItem.title.trim(),
        description: discDesc.trim(),
        location: discLocation.trim() || undefined,
        floor: discFloor.trim() || undefined,
        element: discElement.trim() || undefined,
        date: todayFa,
        status: 'open',
      }
    );

    setActiveDiscrepancyItem(null);
  };

  // Instant Bulk Action: Approve all pending items in one batch (instant 1-click)
  const handleApproveAllPending = () => {
    if (isArchived || isStageLocked) return;

    const pendingItems: Omit<InspectionItem, 'id' | 'createdAt'>[] = [];
    displayedControls.forEach((item) => {
      const existing = recordedByTitle.get(item.title.trim());
      if (!existing || existing.result !== 'compliant') {
        pendingItems.push({
          stageId,
          stageName,
          title: item.title.trim(),
          result: 'compliant',
          notes: 'تأیید شد - مطابق نقشه‌ها و ضوابط',
          date: todayFa,
        });
      }
    });

    if (pendingItems.length === 0) {
      scrollToSubmitButton();
      return;
    }

    if (onBulkAddInspections) {
      onBulkAddInspections(pendingItems);
    } else {
      pendingItems.forEach((it) => onAddInspection(it));
    }

    // Automatically scroll down to the submit button
    scrollToSubmitButton();
  };

  // Save custom added item
  const handleSaveCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    handleMarkCompliant(customTitle.trim());
    setCustomTitle('');
    setIsCustomFormOpen(false);
  };

  return (
    <div
      ref={cardRef}
      id="stage-inspection-card"
      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-right scroll-mt-20"
    >
      {/* Locked Stage Preview Banner */}
      {isStageLocked && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            این مرحله هنوز در کارگاه شروع نشده است (حالت پیش‌نمایش). با اتمام مرحله فعلی، این مرحله فعال و قابل ثبت خواهد شد.
          </span>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <span>کنترل‌های مرحله «{stageName}»</span>
        </h3>

        {!isArchived && !isStageLocked && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleApproveAllPending}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              title="تأیید سریع همه موارد به عنوان کنترل شد"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>تأیید همه موارد</span>
            </button>

            <button
              onClick={() => setIsCustomFormOpen(!isCustomFormOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن مورد جدید</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Custom Item Input */}
      {isCustomFormOpen && !isArchived && !isStageLocked && (
        <form
          onSubmit={handleSaveCustomItem}
          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 animate-fadeIn text-xs"
        >
          <input
            type="text"
            required
            placeholder="عنوان مورد کنترلی دلخواه برای این کارگاه..."
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 text-amber-400 font-bold whitespace-nowrap"
          >
            ثبت و کنترل
          </button>
          <button
            type="button"
            onClick={() => setIsCustomFormOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Checklist Items List */}
      <div className="space-y-2">
        {displayedControls.map((item, index) => {
          const recorded = recordedByTitle.get(item.title.trim());
          const isCompliant = recorded?.result === 'compliant';
          const isDiscrepancy = recorded?.result === 'discrepancy';
          const isNotApplicable = recorded?.result === 'not_applicable';

          return (
            <div
              key={item.id || index}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between flex-wrap gap-2.5 ${
                isCompliant
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : isDiscrepancy
                  ? 'bg-rose-50/70 border-rose-300'
                  : isNotApplicable
                  ? 'bg-slate-100/70 border-slate-300'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Item Details */}
              <div className="space-y-1 flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    #{toPersianDigits(index + 1)}
                  </span>

                  <span className="text-xs font-bold text-slate-900 leading-snug">
                    {item.title}
                  </span>
                </div>

                {item.tip && (
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    💡 نکته: {item.tip}
                  </p>
                )}
              </div>

              {/* Action Buttons (1-click) */}
              {!isArchived && !isStageLocked && (
                <div className="flex items-center gap-1.5 shrink-0 text-xs">
                  {/* Button 1: تایید با تیک سبز */}
                  <button
                    type="button"
                    onClick={() => handleMarkCompliant(item.title)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                      isCompliant
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    }`}
                    title="تایید"
                  >
                    <Check className={`w-4 h-4 ${isCompliant ? 'text-white' : 'text-emerald-600'} stroke-[2.5]`} />
                    <span>تایید</span>
                  </button>

                  {/* Button 2: عدم تایید با ضربدر قرمز */}
                  <button
                    type="button"
                    onClick={() => handleOpenDiscrepancyModal(item.title, item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                      isDiscrepancy
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                    }`}
                    title="عدم تایید و ثبت مغایرت"
                  >
                    <X className={`w-4 h-4 ${isDiscrepancy ? 'text-white' : 'text-rose-600'} stroke-[2.5]`} />
                    <span>عدم تایید</span>
                  </button>

                  {/* Button 3: شامل نیست */}
                  <button
                    type="button"
                    onClick={() => handleMarkNotApplicable(item.title)}
                    className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                      isNotApplicable
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                    title="شامل این پروژه نیست"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* STAGE COMPLETION: SINGLE MINIMAL ACTION BUTTON AS REQUESTED */}
      {onCompleteStage && !isArchived && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            ref={submitButtonRef}
            type="button"
            onClick={() => onCompleteStage(stageId)}
            className={`px-8 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all duration-300 flex items-center gap-1.5 active:scale-95 ${
              highlightSubmit
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 ring-offset-2 scale-105 shadow-lg'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>ثبت</span>
          </button>
        </div>
      )}

      {/* DISCREPANCY DESCRIPTION POPUP MODAL */}
      {activeDiscrepancyItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn text-right">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    ثبت عدم تایید و نقص کارگاهی
                  </h4>
                  <p className="text-xs text-slate-500">{stageName}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveDiscrepancyItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDiscrepancy} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">موضوع مورد کنترلی:</label>
                <input
                  type="text"
                  required
                  value={activeDiscrepancyItem.title}
                  readOnly
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  شرح کامل عدم تایید و ایراد مشاهده‌شده (متن آزاد مهندسی):
                </label>
                <textarea
                  rows={4}
                  required
                  autoFocus
                  placeholder="شرح دقیق ایراد یا نقص مشاهده‌شده در کارگاه..."
                  value={discDesc}
                  onChange={(e) => setDiscDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-rose-300 focus:outline-none focus:border-rose-500 bg-white text-xs leading-relaxed resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-600">طبقه:</label>
                  <input
                    type="text"
                    placeholder="مثال: فونداسیون / همکف"
                    value={discFloor}
                    onChange={(e) => setDiscFloor(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600">محل / موقعیت:</label>
                  <input
                    type="text"
                    placeholder="مثال: ضلع شمالی، محور C"
                    value={discLocation}
                    onChange={(e) => setDiscLocation(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600">عضو ساختمانی:</label>
                  <input
                    type="text"
                    placeholder="مثال: ستون C3، تیر T12"
                    value={discElement}
                    onChange={(e) => setDiscElement(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDiscrepancyItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-transform active:scale-95"
                >
                  ثبت عدم تایید در پرونده پروژه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
