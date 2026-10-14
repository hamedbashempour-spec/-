import { ProjectStage, InspectionItem } from '../types/project';
import { getControlsForStageName } from './stageGenerator';

/**
 * Standard Construction Work Breakdown Structure (WBS) Weight Determination
 * تخصیص وزن کارشناسی به مراحل بر اساس ماهیت فعالیت در کل پروژه
 */
export function getStageCategoryWeight(stageName: string): number {
  const n = stageName.trim();
  if (n.includes('اسکلت') || n.includes('ستون')) return 4.0;
  if (n.includes('سقف') && (n.includes('بتن') || n.includes('آرماتور'))) return 3.5;
  if (n.includes('فونداسیون') || n.includes('پی')) return 3.0;
  if (n.includes('خاکبرداری')) return 3.0;
  if (n.includes('دیوارچینی')) return 2.5;
  if (n.includes('وال‌پست')) return 2.0;
  if (n.includes('تأسیسات')) return 3.0;
  if (n.includes('کاشی') || n.includes('سرامیک')) return 2.0;
  if (n.includes('گچ') || n.includes('سفیدکاری')) return 2.0;
  if (n.includes('کف‌سازی')) return 2.0;
  if (n.includes('عایق')) return 2.0;
  if (n.includes('رنگ') || n.includes('نقاشی')) return 1.5;
  if (n.includes('پایان') || n.includes('تحویل')) return 1.0;
  return 1.5;
}

/**
 * Calculates authentic physical progress percentage of a project
 * dynamically adapting to any building floor count and custom stage progression.
 */
export function calculateProjectWbsProgress(
  stages: ProjectStage[],
  inspections: InspectionItem[]
): number {
  if (!stages || stages.length === 0) return 0;

  let totalMaxWeight = 0;
  let earnedWeight = 0;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const weight = getStageCategoryWeight(stage.name);
    totalMaxWeight += weight;

    if (stage.status === 'completed') {
      earnedWeight += weight;
    } else if (stage.status === 'in_progress') {
      const defaultItems = getControlsForStageName(stage.id, stage.name);
      const totalRequired = Math.max(defaultItems.length, 1);

      const stageInspections = inspections.filter((insp) => insp.stageId === stage.id);
      const uniqueTitles = new Set(stageInspections.map((insp) => insp.title.trim()));

      const ratio = Math.min(1, Math.max(0.15, uniqueTitles.size / totalRequired));
      earnedWeight += weight * ratio;
    }
  }

  if (totalMaxWeight === 0) return 0;
  const rawPercent = (earnedWeight / totalMaxWeight) * 100;
  return Math.min(100, Math.max(0, Math.round(rawPercent)));
}
