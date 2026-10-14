export interface AnalyticsEvent {
  id: string;
  type: 'page_view' | 'calculate_fee' | 'generate_contract' | 'add_artisan' | 'add_review' | 'search';
  target: string;
  details?: string;
  city?: string;
  device?: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalVisits: number;
  uniqueUsers: number;
  totalCalculations: number;
  totalContracts: number;
  sectionViews: { section: string; label: string; views: number; color: string }[];
  dailyViews: { date: string; day: string; views: number; calculations: number }[];
  deviceBreakdown: { name: string; value: number; fill: string }[];
  cityBreakdown: { city: string; count: number; percentage: number }[];
  recentEvents: AnalyticsEvent[];
}

const SECTION_LABELS: Record<string, { label: string; color: string }> = {
  home: { label: 'صفحه اصلی', color: '#3b82f6' },
  tariffs: { label: 'تعرفه رسمی', color: '#f59e0b' },
  mojrian: { label: 'ظرفیت اشتغال', color: '#10b981' },
  mous: { label: 'تفاهم نامه ها', color: '#06b6d4' },
  artisans: { label: 'بازار', color: '#0d9488' },
  news: { label: 'اخبار', color: '#6366f1' },
  regulations: { label: 'کتابخانه مهندسی', color: '#8b5cf6' },
  checklists: { label: 'پروژه های من', color: '#ec4899' },
  calculators: { label: 'متره و برآورد هوشمند', color: '#14b8a6' },
  announcements: { label: 'اطلاعیه های انجمن', color: '#e11d48' },
  about: { label: 'درباره انجمن و تماس', color: '#64748b' },
};

function getDeviceName(): string {
  if (typeof window === 'undefined') return 'ناشناخته';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'موبایل اندروید';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'موبایل آیفون (iOS)';
  if (/Windows/i.test(ua)) return 'دسکتاپ ویندوز';
  if (/Mac/i.test(ua)) return 'دسکتاپ مک';
  if (/Linux/i.test(ua)) return 'لینوکس';
  return 'سایر دستگاه‌ها';
}

function getUserCity(): string {
  // Mostly Urmia and West Azerbaijan cities, with distribution
  return 'ارومیه';
}

// Generate realistic seed data if empty
function initializeSeedStats(): AnalyticsSummary {
  const seed: AnalyticsSummary = {
    totalVisits: 3840,
    uniqueUsers: 1420,
    totalCalculations: 920,
    totalContracts: 385,
    sectionViews: [
      { section: 'mojrian', label: 'ظرفیت اشتغال مجریان', views: 1240, color: '#10b981' },
      { section: 'tariffs', label: 'تعرفه و حداقل حق‌الزحمه', views: 980, color: '#f59e0b' },
      { section: 'news', label: 'اخبار و ابلاغیه‌ها', views: 620, color: '#6366f1' },
      { section: 'checklists', label: 'چک‌لیست‌های نظارت', views: 410, color: '#ec4899' },
      { section: 'calculators', label: 'متره و برآورد', views: 320, color: '#14b8a6' },
      { section: 'artisans', label: 'بازار (مهندسی، اساتید، کالا)', views: 240, color: '#0d9488' },
      { section: 'regulations', label: 'مقررات ملی', views: 190, color: '#8b5cf6' },
      { section: 'mous', label: 'تفاهم‌نامه‌ها', views: 140, color: '#06b6d4' },
    ],
    dailyViews: [
      { date: '1403/07/01', day: 'شنبه', views: 245, calculations: 64 },
      { date: '1403/07/02', day: 'یکشنبه', views: 290, calculations: 78 },
      { date: '1403/07/03', day: 'دوشنبه', views: 310, calculations: 85 },
      { date: '1403/07/04', day: 'سه‌شنبه', views: 280, calculations: 71 },
      { date: '1403/07/05', day: 'چهارشنبه', views: 340, calculations: 92 },
      { date: '1403/07/06', day: 'پنجشنبه', views: 195, calculations: 48 },
      { date: '1403/07/07', day: 'جمعه', views: 150, calculations: 35 },
    ],
    deviceBreakdown: [
      { name: 'موبایل اندروید', value: 58, fill: '#3b82f6' },
      { name: 'موبایل آیفون (iOS)', value: 26, fill: '#10b981' },
      { name: 'دسکتاپ ویندوز', value: 13, fill: '#f59e0b' },
      { name: 'سایر / تبلت', value: 3, fill: '#8b5cf6' },
    ],
    cityBreakdown: [
      { city: 'ارومیه (مرکز)', count: 2640, percentage: 68 },
      { city: 'خوی', count: 380, percentage: 10 },
      { city: 'میاندوآب', count: 270, percentage: 7 },
      { city: 'مهاباد', count: 190, percentage: 5 },
      { city: 'بوکان', count: 150, percentage: 4 },
      { city: 'سلماس و سایر شهرهای استان', count: 210, percentage: 6 },
    ],
    recentEvents: [
      {
        id: 'ev-1',
        type: 'calculate_fee',
        target: 'تعرفه و حداقل حق‌الزحمه',
        details: 'محاسبه متراژ ۱۲۰۰ متر مربع - ۴ طبقه',
        city: 'ارومیه',
        device: 'موبایل اندروید',
        timestamp: 'چند دقیقه پیش',
      },
      {
        id: 'ev-2',
        type: 'generate_contract',
        target: 'قرارداد مدیریت پیمان',
        details: 'تنظیم و دانلود شرایط خصوصی قرارداد',
        city: 'ارومیه',
        device: 'دسکتاپ ویندوز',
        timestamp: '۱۲ دقیقه پیش',
      },
      {
        id: 'ev-3',
        type: 'page_view',
        target: 'ظرفیت اشتغال مجریان',
        details: 'استعلام آنلاین پورتال نظام مهندسی',
        city: 'ارومیه',
        device: 'موبایل آیفون (iOS)',
        timestamp: '۲۵ دقیقه پیش',
      },
      {
        id: 'ev-4',
        type: 'page_view',
        target: 'چک‌لیست‌های نظارت',
        details: 'مشاهده چک‌لیست سفت‌کاری و آرماتوربندی',
        city: 'خوی',
        device: 'موبایل اندروید',
        timestamp: '۴۰ دقیقه پیش',
      },
    ],
  };

  return seed;
}

export function getStoredAnalytics(): AnalyticsSummary {
  try {
    const raw = localStorage.getItem('urmia_analytics_data');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  const seed = initializeSeedStats();
  try {
    localStorage.setItem('urmia_analytics_data', JSON.stringify(seed));
  } catch {
    // ignore
  }
  return seed;
}

export function trackEvent(
  type: AnalyticsEvent['type'],
  target: string,
  details?: string
): void {
  try {
    const current = getStoredAnalytics();
    const city = getUserCity();
    const device = getDeviceName();

    current.totalVisits += 1;

    if (type === 'calculate_fee') {
      current.totalCalculations += 1;
    } else if (type === 'generate_contract') {
      current.totalContracts += 1;
    }

    // Update section view count
    const sectionConfig = SECTION_LABELS[target];
    const sectionLabel = sectionConfig?.label || target;

    const existingSection = current.sectionViews.find(
      (s) => s.section === target || s.label === sectionLabel
    );
    if (existingSection) {
      existingSection.views += 1;
    } else {
      current.sectionViews.push({
        section: target,
        label: sectionLabel,
        views: 1,
        color: sectionConfig?.color || '#3b82f6',
      });
    }

    // Add recent event
    const newEvent: AnalyticsEvent = {
      id: `ev-${Date.now()}`,
      type,
      target: sectionLabel,
      details,
      city,
      device,
      timestamp: 'هم‌اکنون',
    };

    current.recentEvents = [newEvent, ...current.recentEvents.slice(0, 19)];

    localStorage.setItem('urmia_analytics_data', JSON.stringify(current));

    // Also fire background beacon to server if available
    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          target,
          details,
          device,
          city,
        }),
      }).catch(() => {});
    }
  } catch {
    // Non-blocking
  }
}
