// Domain models for National Building Regulations (مقررات ملی ساختمان)

export type ReviewStatus =
  | 'draft_cleaned_source' // نسخه استخراج‌شده اولیه از منبع متنی
  | 'pending_official_pdf_audit' // در انتظار تطبیق با نسخه چاپی مصوب
  | 'verified_with_official_pdf'; // بازبینی‌شده و تأییدشده با نسخه مصوب

export interface RegulationTableData {
  id: string;
  tableNumber: string; // e.g., "جدول شماره ۱"
  title: string;
  headers: string[];
  rows: string[][];
  notes?: string[];
}

export interface RegulationClauseData {
  id: string; // Stable internal identifier, e.g. "m2-sec-1-1"
  officialNumber: string; // Official clause/article numbering, e.g. "۱‌۱‌۲" or "ماده ۴"
  title?: string; // Optional title or heading
  content: string; // Full exact verbatim text
  subClauses?: Array<{
    officialNumber: string;
    content: string;
    notes?: string[];
  }>;
  notes?: string[]; // تبصره‌ها
  printPage?: number; // شماره صفحه چاپی در صورت وجود
  filePage?: number; // شماره صفحه در فایل PDF
  tables?: RegulationTableData[];
  reviewStatus: ReviewStatus;
  flaggedForReview?: boolean;
  reviewNotes?: string;
}

export interface RegulationSectionData {
  id: string;
  officialNumber: string; // e.g. "۱‌۲" or "فصل دوم: طراحی ساختمان" or "بخش الف"
  title: string;
  summary?: string;
  clauses: RegulationClauseData[];
  tables?: RegulationTableData[];
  notes?: string[];
}

export interface RegulationChapterData {
  id: string;
  officialNumber: string; // e.g. "بخش اصلی" or "فصل اول" or "پیوست"
  title: string;
  description?: string;
  sections: RegulationSectionData[];
}

export interface RegulationDocument {
  id: string; // Stable internal ID: "mabhas-2"
  code: string; // Official code: "مبحث ۲"
  title: string; // Official title: "نظامات اداری"
  edition: string; // "ویرایش ۱۳۸۴"
  year: string; // "۱۳۸۴"
  discipline: 'سازه' | 'معماری' | 'تأسیسات مکانیکی' | 'تأسیسات برقی' | 'عمومی و ایمنی';
  status: 'مصوب و ملاک عمل' | 'پیش‌نویس' | 'در حال بازنگری';
  officialPublisher: string; // "دفتر مقررات ملی و کنترل ساختمان"
  summary: string;
  sourceFileId: string; // "mabhas2_cleaned.md"
  reviewStatus: ReviewStatus;
  hasFullText: boolean;
  pdfUrl?: string;
  referenceLink?: string;
  printPageCount?: number;
  chapters: RegulationChapterData[];
}

export interface SearchResultItem {
  regulationId: string;
  regulationCode: string;
  regulationTitle: string;
  chapterTitle: string;
  sectionTitle: string;
  clauseId: string;
  officialNumber: string;
  matchedTextSnippet: string;
  clauseTitle?: string;
}
