// Definition of data structures for Mojrian Daily Monitoring & Referral Analysis

export interface DailyMojriItem {
  id: string; // e.g. "1-0" or name if no id
  name: string;
  type: 'حقیقی' | 'حقوقی';
  grade?: string;
  phone?: string;
  manager?: string;
  remainingCount: number | null; // null if record has no count (کارهای بدون تعداد کار)
  remainingMeterage: number;
}

export interface MojrianDailySnapshot {
  date: string; // "1405/07/01" or ISO / Shamsi formatted
  timestamp: number;
  items: DailyMojriItem[];
}

export type ReferralChangeType =
  | 'new_job' // کار جدید
  | 'released_job' // خاتمه‌یافته و آزادسازی ظرفیت
  | 'no_change'; // بدون تغییر

export interface MojriChangeDetail {
  name: string;
  type: 'حقیقی' | 'حقوقی';
  reason: 'count_changed' | 'meterage_changed' | 'removed_from_list' | 'added_to_list' | 'no_change';
  eventCount: number; // how many new or released jobs this represents
  eventType: ReferralChangeType;
  oldCount: number | null;
  newCount: number | null;
  countDelta: number; // newCount - oldCount
  oldMeterage: number;
  newMeterage: number;
  meterageDelta: number; // newMeterage - oldMeterage
  description: string;
}

export interface ZeroCountMojriRecord {
  name: string;
  type: 'حقیقی' | 'حقوقی';
  phone?: string;
  manager?: string;
  meterage: number;
  isSuspicious: boolean; // meterage > 300
  statusLabel: string; // 'کار بدون تعداد کار - در محدوده مجاز' | 'کار بدون تعداد کار - بالاتر از حد ۳۰۰ مترمربع'
}

export interface DailyReferralReport {
  date: string; // e.g. "1405/07/07"
  timestamp: number;
  totalMojrian: number;
  
  // Daily comparison stats compared to previous date
  newJobsCount: number; // تعداد کارهای جدید
  releasedJobsCount: number; // تعداد کارهای خاتمه‌یافته و آزادسازی ظرفیت
  removedMojrianCount: number; // تعداد مجریان حذف‌شده از فهرست (اتمام ظرفیت و دریافت کار جدید)
  addedMojrianCount: number; // تعداد مجریان اضافه‌شده به فهرست (خاتمه کار و آزادسازی ظرفیت)
  
  // کارهای بدون تعداد کار (مجزا از آمار اصلی)
  zeroCountJobsTotal: number; // تعداد کارهای بدون تعداد کار
  zeroCountJobsWithinLimit: number; // متراژ <= 300
  zeroCountJobsExceedingLimit: number; // متراژ > 300 (مورد مشکوک به تخلف / نیازمند بررسی)
  zeroCountTotalMeterage: number; // مجموع متراژ کارهای بدون تعداد کار
  zeroCountExceedingMeterage: number; // مجموع متراژ کارهای بدون تعداد کار بالاتر از ۳۰۰ مترمربع

  // List of zero count records for detailed audit
  zeroCountRecords: ZeroCountMojriRecord[];

  // Detailed change events for this day
  changes: MojriChangeDetail[];
}

export interface ReferralAnalysisTimeline {
  dates: string[];
  history: DailyReferralReport[];
}
