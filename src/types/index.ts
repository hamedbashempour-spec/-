export type ActiveTab =
  | 'home'
  | 'tariffs'
  | 'mojrian'
  | 'mous'
  | 'artisans'
  | 'news'
  | 'regulations'
  | 'checklists'
  | 'calculators'
  | 'announcements'
  | 'about'
  | 'profile'
  | 'admin';

export interface TariffRow {
  row: number;
  buildingGroup: string; // e.g. الف A, الف B, ب, ج A, ج B, د A, د B, د C
  groupCode: 'الف A' | 'الف B' | 'ب' | 'ج A' | 'ج B' | 'د A' | 'د B' | 'د C';
  floorsDescription: string; // e.g. ۱ یا ۲ طبقه, ۳ تا ۵ طبقه, ۶ و ۷ طبقه, ۸ تا ۱۰ طبقه, ۱۱ و ۱۲ طبقه, ۱۳ تا ۱۵ طبقه, ۱۶ طبقه به بالا
  minFloors: number;
  maxFloors: number;
  meterageDescription: string; // e.g. زیر ۴۰۰, از ۴۰۰ تا ۶۰۰, از ۶۰۰ تا ۲۰۰۰, از ۲۰۰۰ تا ۵۰۰۰, بالای ۵۰۰۰
  minMeterage: number;
  maxMeterage: number;
  feePerM2Rials: number; // e.g. 3180855
  feePerM2Tomans: number; // e.g. 318085.5
  feePerM2Formatted: string; // e.g. ۳/۱۸۰/۸۵۵
}

export interface MoUItem {
  id: string;
  title: string;
  partnerOrganization: string; // طرف تفاهم‌نامه
  partnerCategory: 'بانک و تسهیلات' | 'بیمه' | 'مصالح و آزمایشگاه' | 'آموزش و پژوهش' | 'سازمان نظام مهندسی و شهرداری';
  signingDate: string;
  expiryDate?: string;
  status: 'معتبر و فعال' | 'در حال تمدید';
  summary: string;
  keyBenefits: string[];
  contactPerson?: string;
  phone?: string;
  officialAnnouncementUrl?: string;
}

export interface ArtisanReview {
  id: string;
  reviewerUserId?: string; // شناسه کاربر یا نام کاربری در سامانه
  reviewerName: string; // نام مهندس مجری یا ناظر ثبت‌کننده
  reviewerLicense?: string; // پروانه اشتغال
  reviewerPhone?: string; // شماره تماس کاربر
  isAnonymous?: boolean; // ثبت نظر به صورت ناشناس
  score: number; // 1 to 5
  comment?: string; // نظر متنی (اختیاری)
  date: string;
  updatedAt?: string;
  criteria?: {
    quality: number; // کیفیت کار یا کالا
    speed: number; // سرعت و دقت
    safety: number; // رعایت ایمنی یا استانداردهای فنی
    commitment: number; // تعهد و خوش‌قولی
  };
}

export interface ArtisanItem {
  id: string;
  entityType?: 'engineering_service' | 'artisan' | 'vendor'; // 'engineering_service' (خدمات مهندسی اعضا), 'artisan' (استادکاران), یا 'vendor' (فروشندگان کالا)
  fullName: string;
  storeName?: string; // نام شرکت، دفتر مهندسی، فروشگاه یا برند
  managerName?: string; // نام مسئول، مدیر یا صاحب پروانه
  trade: string; // e.g. طراحی سازه، متره و برآورد یا آرماتوربند یا دسته کالا
  tradeCategory: string;
  experienceYears: number;
  phone: string;
  district: string; // محله، آدرس یا محدوده فعالیت در ارومیه
  description: string;
  referrerName: string; // نام معرف (مهندس ناظر یا مجری یا خود عضو)
  referrerLicense?: string; // شماره پروانه مهندسی
  referrerPhone?: string; // تلفن همراه معرف
  referrerUserId?: string;
  createdByUserId?: string; // شناسه کاربری ثبت‌کننده (جهت ویرایش اختصاصی توسط همان کاربر)
  createdByUsername?: string; // نام کاربری ثبت‌کننده
  rating?: number;
  ratingCount?: number;
  verifiedByAssociation?: boolean;
  status?: 'pending' | 'approved';
  approvedAt?: string;
  registeredByEngineer?: string;
  createdAt?: string;
  reviews?: ArtisanReview[];
}

export interface TelegramPost {
  id: string;
  post: string;
  text: string;
  title: string;
  photo: string | null;
  time: string;
  timeDisplay: string;
  telegramUrl: string;
}

export interface MojrianServerStatus {
  success: boolean;
  online: boolean;
  statusCode: number;
  latencyMs: number;
  httpUrl: string;
  httpsUrl: string;
  provider: string;
  checkedAt: string;
  note: string;
  error?: string;
}

export interface MojriRecord {
  id: string;
  name: string;
  type: 'حقیقی' | 'حقوقی';
  grade: string;
  phone: string;
  manager: string;
  rawContact: string;
  expireDate: string;
  remainingCount: number;
  remainingMeterage: number;
  city: string;
}

export interface RegulationClause {
  number: string;
  title: string;
  content: string;
}

export interface RegulationSection {
  code?: string;
  title: string;
  description?: string;
}

export interface RegulationChapter {
  number: string;
  title: string;
  summary?: string;
  fullContent?: string;
  sections?: RegulationSection[];
  clauses?: RegulationClause[];
}

export interface RegulationItem {
  id: string;
  category: string;
  code: string;
  title: string;
  edition?: string;
  year?: string;
  discipline?: 'سازه' | 'معماری' | 'تأسیسات مکانیکی' | 'تأسیسات برقی' | 'عمومی و ایمنی';
  status?: string;
  summary: string;
  keyPoints: string[];
  referenceLink?: string;
  downloadLabel?: string;
  officialPublisher?: string;
  officialClauses?: RegulationClause[];
  chapters?: RegulationChapter[];
  fullOfficialText?: string;
  pdfUrl?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  tip?: string;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  category: string;
  stage: string;
  description: string;
  items: ChecklistItem[];
}

export interface AnnouncementItem {
  id: string;
  title: string;
  category: 'جلسات' | 'دوره‌های آموزشی' | 'تغییرات مقررات' | 'فراخوان‌ها' | 'اطلاعیه‌های فوری' | 'اطلاعیه‌های انجمن';
  date: string;
  urgent: boolean;
  summary: string;
  details: string;
  issuer: string;
}

export interface GeminiChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  error?: boolean;
}

export type AppRestrictedSection =
  | 'projects' // کارپوشه و کنترل پروژه‌ها و چک‌لیست‌ها
  | 'tariffs' // محاسبه تعرفه و قرارداد شرایط خصوصی
  | 'artisans' // بازار (خدمات مهندسی، استادکاران و فروشندگان)
  | 'regulations' // مباحث مقررات ملی و استعلامات
  | 'checklists' // چک‌لیست‌های نظارتی
  | 'calculators' // ماشین‌حساب‌های مهندسی
  | 'mojrian' // رصد ظرفیت و سهمیه مجریان
  | 'mous' // تفاهم‌نامه‌ها و مصوبات
  | 'news'; // اخبار و بخشنامه‌ها

export interface UserRestrictionRecord {
  username: string;
  isBlocked?: boolean; // محدودیت کلی: مسدودسازی کامل ورود و دسترسی
  blockReason?: string; // علت مسدودسازی
  restrictedSections?: string[]; // محدودیت استفاده از قسمت‌های مهم برنامه
  notes?: string;
  userTag?: string; // تگ یا نشان سازمانی (مدیرعامل، هیات مدیره، بازرس، و...)
  updatedAt?: string;
}

export interface AuthUser {
  username: string;
  fullName?: string; // نام و نام خانوادگی مهندس جهت نمایش در برنامه
  name?: string;
  password?: string;
  role: 'admin' | 'user';
  eDate: string;
  field?: string; // رشته تخصصی مهندسی (عمران، معماری، تأسیسات مکانیکی، تأسیسات برقی، ...)
  baseGrade?: string; // پایه پروانه اشتغال (پایه ۳، پایه ۲، پایه ۱، ارشد)
  licenseNo?: string; // شماره پروانه اشتغال نظام مهندسی
  phone?: string; // شماره تلفن همراه مهندس
  nationalCode?: string; // شماره / کد ملی
  avatar?: string; // تصویر پروفایل یا آواتار مهندس
  userTag?: string; // تگ یا عنوان سازمانی (مثلا: مدیرعامل انجمن، هیات مدیره انجمن، و...)
  isExpired?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  restrictedSections?: string[];
  notes?: string;
}

export interface UserSession {
  username: string;
  fullName?: string;
  name?: string;
  role: 'admin' | 'user';
  eDate: string;
  field?: string;
  baseGrade?: string;
  licenseNo?: string;
  phone?: string;
  nationalCode?: string;
  avatar?: string;
  userTag?: string; // تگ یا عنوان سازمانی
  loggedInAt: number;
  isBlocked?: boolean;
  blockReason?: string;
  restrictedSections?: string[];
}

// --- WAGE RATES & MARKET TYPES ---

export type WagePriceType = 'executed_contract' | 'inquiry_quote';
export type WageApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface WagePriceRecord {
  id: string;
  artisanId: string;
  artisanName: string;
  artisanPhone?: string;
  serviceTitle: string; // One of the 12 approved trades
  unit: string; // Auto-assigned immutable unit (e.g. 'روزمزد', 'مترمربع', etc.)
  priceAmountTomans: number; // Stored in Tomans
  priceType: WagePriceType; // 'executed_contract' (کار اجراشده) or 'inquiry_quote' (استعلام قیمت)
  actionDate: string; // Actual date of work or quote, e.g. "1405/07/20"
  createdAt: string; // System record timestamp, e.g. "1405/07/20 ساعت ۱۴:۳۰"
  registeredByUserId: string;
  registeredByEngineerName: string;
  registeredByLicense?: string;
  status: WageApprovalStatus; // 'pending' | 'approved' | 'rejected'
  rejectionReason?: string;
  note?: string; // Optional note / description
  projectInfo?: {
    isConfidential?: boolean;
    projectName?: string;
    locationArea?: string;
  };
  approvedAt?: string;
  approvedBy?: string;
}

export interface ArtisanLatestWage {
  serviceTitle: string;
  unit: string;
  priceAmountTomans: number;
  priceType: WagePriceType;
  actionDate: string;
  recordId: string;
}

export interface WageServiceStatistics {
  serviceTitle: string;
  unit: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  sampleCount: number;
  hasEnoughData: boolean;
  executedCount: number;
  inquiryCount: number;
}

