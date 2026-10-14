/**
 * Digital Project Control, Inspection Recording, Discrepancy Logging, and Inspection Report Data Model
 * مدل پرونده دیجیتال کنترل پروژه، ثبت بازدید، ثبت مغایرت و تهیه گزارش بازدید
 */

export type ProjectExecutionStatus = 'active' | 'paused' | 'completed';
// 'active' = فعال | 'paused' = متوقف | 'completed' = تکمیل‌شده

export type ContractStatus = 'active' | 'near_expiry' | 'expired' | 'terminated';
// 'active' = فعال (> 30 days)
// 'near_expiry' = نزدیک به پایان (<= 30 days and >= 0)
// 'expired' = منقضی‌شده (< 0 days and not explicitly terminated)
// 'terminated' = خاتمه همکاری (explicitly terminated and archived)

export interface ProjectStatusHistory {
  previousStatus: string;
  newStatus: string;
  changedAt: string; // Persian date/time, e.g. 1405/07/10 14:30
  changedBy: string; // User ID / username
  note?: string;
}

// 22 Default Execution Stages (۲۲ مرحله اجرایی استاندارد پروژه)
export interface ProjectStage {
  id: number; // 1 to 22
  name: string; // نام مرحله
  status: 'not_started' | 'in_progress' | 'completed'; // شروع‌نشده | در حال اجرا | تکمیل‌شده
  completedAt?: string;
}

export const DEFAULT_PROJECT_STAGES: { id: number; name: string }[] = [
  { id: 1, name: 'شروع پروژه و اطلاعات پایه' },
  { id: 2, name: 'تجهیز و آماده‌سازی کارگاه' },
  { id: 3, name: 'خاکبرداری' },
  { id: 4, name: 'فونداسیون' },
  { id: 5, name: 'آرماتوربندی فونداسیون' },
  { id: 6, name: 'قالب‌بندی فونداسیون' },
  { id: 7, name: 'بتن‌ریزی فونداسیون' },
  { id: 8, name: 'اجرای اسکلت' },
  { id: 9, name: 'آرماتوربندی طبقات' },
  { id: 10, name: 'قالب‌بندی طبقات' },
  { id: 11, name: 'بتن‌ریزی' },
  { id: 12, name: 'دیوارچینی' },
  { id: 13, name: 'وال‌پست و مهار دیوارها' },
  { id: 14, name: 'تأسیسات' },
  { id: 15, name: 'نازک‌کاری' },
  { id: 16, name: 'کف‌سازی' },
  { id: 17, name: 'کاشی‌کاری' },
  { id: 18, name: 'گچ‌کاری' },
  { id: 19, name: 'رنگ‌آمیزی' },
  { id: 20, name: 'تکمیل تأسیسات' },
  { id: 21, name: 'کنترل‌های نهایی' },
  { id: 22, name: 'پایان پروژه' },
];

// نتیجه کنترل: دقیقاً ۳ حالت
export type ControlResult = 'compliant' | 'discrepancy' | 'not_applicable';
// compliant = مطابق | discrepancy = مغایرت | not_applicable = شامل پروژه نیست

// چرخه اصلاح مغایرت: ۳ وضعیت
export type DiscrepancyStatus = 'open' | 'fixed' | 'verified';
// open = رفع‌نشده | fixed = اصلاح شد | verified = تأیید نهایی

export interface DiscrepancyStatusHistory {
  previousStatus: DiscrepancyStatus;
  newStatus: DiscrepancyStatus;
  changedAt: string; // Persian date/time
  changedBy: string;
  note?: string;
}

export interface DiscrepancyItem {
  id: string;
  stageId: number;
  stageName: string;
  inspectionItemId?: string;
  title: string; // موضوع مغایرت
  description: string; // شرح مغایرت (متن آزاد مهندسی)
  location?: string; // محل/موقعیت
  floor?: string; // طبقه
  element?: string; // عضو یا بخش ساختمان
  date: string; // تاریخ ثبت بازدید
  notes?: string; // توضیحات تکمیلی
  status: DiscrepancyStatus; // رفع‌نشده | اصلاح شد | تأیید نهایی
  statusHistory: DiscrepancyStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

// رکورد مورد کنترل در بازدید
export interface InspectionItem {
  id: string;
  stageId: number;
  stageName: string;
  title: string; // عنوان کنترل (مثلاً: آرماتوربندی ستون‌های طبقه اول)
  result: ControlResult; // مطابق | مغایرت | شامل پروژه نیست
  notes?: string; // توضیح اختیاری در صورت مطابق بودن
  discrepancyId?: string; // شناسه مغایرت مرتبط در صورت وجود
  date: string; // تاریخ بازدید
  createdAt: string;
}

// گزارش بازدید رسمی
export interface InspectionReportItem {
  id: string;
  reportNumber: string; // شماره گزارش، مثلاً "گ‌ب-۱۴۰۵/۰۷-۰۱"
  date: string; // تاریخ بازدید
  stageId: number;
  stageName: string;
  summary: string; // خلاصه موضوع بازدید
  generalNotes?: string; // توضیحات کلی بازدید
  discrepancyIds: string[]; // شناسه‌های مغایرت‌های مندرج در این گزارش
  fullReportText: string; // متن رسمی و قابل ویرایش گزارش
  images?: string[]; // حداکثر ۴ تصویر مستند فشرده‌شده کارگاهی (Base64)
  createdAt: string;
  createdBy: string;
}

export interface ProjectItem {
  id: string;
  userId: string; // مالکیت پروژه بر اساس شناسه کاربری مجری واردشده (Username)

  // ۱. اطلاعات پایه پروژه
  name: string; // نام پروژه
  address: string; // آدرس پروژه
  contractNumber: string; // شماره قرارداد مدیریت پیمان
  contractStartDate: string; // تاریخ عقد قرارداد (شمسی YYYY/MM/DD)
  contractEndDate: string; // تاریخ پایان قرارداد (شمسی YYYY/MM/DD)
  licenseNumber: string; // شماره پروانه ساختمانی

  // عوامل پروژه
  employerName: string; // نام کارفرما
  employerPhone: string; // شماره تماس کارفرما
  supervisorName: string; // نام ناظر
  supervisorPhone: string; // شماره تماس ناظر
  structuralDesignerName: string; // نام طراح سازه
  structuralDesignerPhone: string; // شماره تماس طراح سازه

  // مشخصات فنی
  structureType: string; // نوع سازه (بتنی، فولادی، بنایی، سایر)
  floorsCount: number | string; // تعداد طبقات
  totalArea: number | string; // زیربنا (متر مربع)
  description?: string; // توضیحات

  // ۲. وضعیت‌های پروژه و قرارداد
  projectStatus: ProjectExecutionStatus; // وضعیت اجرایی: فعال | متوقف | تکمیل‌شده
  contractStatus: ContractStatus; // وضعیت قرارداد: فعال | نزدیک به پایان | منقضی‌شده | خاتمه همکاری

  // ۳. روند مراحل اجرایی پروژه
  currentStageId: number; // شناسه مرحله فعلی (1 تا 22)
  stages: ProjectStage[];

  // ۴. پرونده سوابق بازدید، کنترل‌ها، مغایرت‌ها و گزارش‌ها
  inspections: InspectionItem[];
  discrepancies: DiscrepancyItem[];
  reports: InspectionReportItem[];

  // ۵. خاتمه همکاری و بایگانی
  isArchived: boolean; // آیا پروژه بایگانی شده است؟
  terminatedAt?: string; // تاریخ و زمان ثبت خاتمه همکاری
  terminatedBy?: string; // شناسه کاربری ثبت‌کننده خاتمه
  terminationNote?: string; // توضیحات یا صورت‌جلسه خاتمه همکاری

  // ۶. تاریخچه رویدادها
  nearExpiryNotified?: boolean;
  statusHistory: ProjectStatusHistory[];

  createdAt: string;
  updatedAt: string;
}
