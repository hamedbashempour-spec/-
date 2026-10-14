import React from 'react';
import {
  CheckCircle2,
  Lock,
  ChevronUp,
  ChevronDown,
  HardHat,
  RotateCcw,
} from 'lucide-react';
import { ProjectStage, InspectionItem } from '../../types/project';
import { toPersianDigits } from '../../utils/formatters';

interface ProjectStagesTimelineProps {
  stages: ProjectStage[];
  currentStageId: number;
  selectedStageId: number;
  inspections?: InspectionItem[];
  onSelectStage: (stageId: number) => void;
  isArchived: boolean;
}

export const ProjectStagesTimeline: React.FC<ProjectStagesTimelineProps> = ({
  stages,
  currentStageId,
  selectedStageId,
  onSelectStage,
  isArchived,
}) => {
  if (!stages || stages.length === 0) return null;

  const totalStages = stages.length;
  const selectedIndex = stages.findIndex((s) => s.id === selectedStageId);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const currentStage = stages[safeIndex];
  const prevStage = safeIndex > 0 ? stages[safeIndex - 1] : null;
  const nextStage = safeIndex < totalStages - 1 ? stages[safeIndex + 1] : null;

  const isCurrentActive = currentStage.id === currentStageId;
  const isCompleted = currentStage.status === 'completed';
  const isLocked = currentStage.id > currentStageId;

  // Navigation only changes view/preview - NEVER completes or modifies stage data!
  const handlePrev = () => {
    if (prevStage) {
      onSelectStage(prevStage.id);
    }
  };

  const handleNext = () => {
    if (nextStage) {
      onSelectStage(nextStage.id);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-3 sm:p-4 text-right select-none">
      {/* Header bar: Title & Jump-to-Active button */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <HardHat className="w-4 h-4 text-indigo-600" />
          <span>مراحل اجرای کار</span>
          <span className="text-[11px] font-mono text-slate-400 font-normal mr-1">
            ({toPersianDigits(safeIndex + 1)} از {toPersianDigits(totalStages)})
          </span>
        </div>

        {selectedStageId !== currentStageId && (
          <button
            onClick={() => onSelectStage(currentStageId)}
            className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>مرحله فعال</span>
          </button>
        )}
      </div>

      {/* ROLLER WHEEL APERTURE CONTAINER */}
      <div className="relative flex flex-col items-center justify-center py-1">
        {/* TOP SLOT: PREVIOUS STAGE */}
        <div className="w-full flex items-center justify-between px-3 py-1 opacity-60 text-xs transition-opacity hover:opacity-100">
          {prevStage ? (
            <button
              type="button"
              onClick={handlePrev}
              className="w-full flex items-center justify-between text-slate-600 hover:text-slate-900 py-1 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[10px] text-slate-400">
                  {toPersianDigits(prevStage.id)}.
                </span>
                <span className="truncate text-[11px]">{prevStage.name}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-medium shrink-0">
                {prevStage.status === 'completed' ? '✓ تکمیل‌شده' : 'مشاهده'}
              </span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-300 italic py-1">ابتدای مراحل کارگاه</div>
          )}
        </div>

        {/* CENTER SLOT: THE FOCAL APERTURE */}
        <div
          className={`w-full my-1 p-3 sm:p-3.5 rounded-2xl transition-all shadow-md flex items-center justify-between flex-wrap gap-2.5 border ${
            isCurrentActive
              ? 'bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/40 ring-2 ring-indigo-500/20'
              : isCompleted
              ? 'bg-emerald-50/80 text-emerald-950 border-emerald-300'
              : 'bg-slate-100 text-slate-600 border-slate-300'
          }`}
        >
          {/* Stage Details */}
          <div className="space-y-1 flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                  isCurrentActive
                    ? 'bg-amber-400 text-slate-950'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                مرحله {toPersianDigits(currentStage.id)} از {toPersianDigits(totalStages)}
              </span>

              {isCurrentActive && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>مرحله در حال اجرای کارگاه</span>
                </span>
              )}
              {isCompleted && (
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تکمیل‌شده</span>
                </span>
              )}
              {isLocked && (
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>مرحله بعدی</span>
                </span>
              )}
            </div>

            <h3
              className={`text-xs sm:text-sm font-extrabold truncate ${
                isCurrentActive ? 'text-white' : 'text-slate-900'
              }`}
            >
              {currentStage.name}
            </h3>
          </div>
        </div>

        {/* BOTTOM SLOT: NEXT STAGE */}
        <div className="w-full flex items-center justify-between px-3 py-1 opacity-60 text-xs transition-opacity hover:opacity-100">
          {nextStage ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full flex items-center justify-between text-slate-600 hover:text-slate-900 py-1 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[10px] text-slate-400">
                  {toPersianDigits(nextStage.id)}.
                </span>
                <span className="truncate text-[11px]">{nextStage.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {nextStage.id <= currentStageId ? '✓ مشاهده' : '🔒 مرحله بعد'}
              </span>
            </button>
          ) : (
            <div className="text-[11px] text-emerald-600 font-bold py-1">
              ✓ به پایان مراحل کارگاه رسیده‌اید
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center gap-2">
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((safeIndex + 1) / totalStages) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
