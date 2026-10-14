/**
 * Jalali / Persian Date Utilities
 * Accurately calculates days remaining, compares Persian dates, and formats date-times.
 */

export function normalizePersianDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

/**
 * Calculates absolute days from beginning of era for a given Jalali (solar hijri) date
 */
export function jalaliToDays(year: number, month: number, day: number): number {
  let days = year * 365 + Math.floor((year * 682 - 110) / 2816);
  for (let m = 1; m < month; m++) {
    if (m <= 6) days += 31;
    else days += 30;
  }
  days += day;
  return days;
}

/**
 * Parses Jalali date string like "1405/08/15" or "1405-08-15"
 */
export function parseJalaliDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const clean = normalizePersianDigits(dateStr.trim());
  const match = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * Returns current Persian date components
 */
export function getCurrentJalaliDate(): { year: number; month: number; day: number; formatted: string } {
  const nowFa = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // e.g. "1405/07/09"
  
  const [yearStr, monthStr, dayStr] = nowFa.split('/');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  return {
    year,
    month,
    day,
    formatted: `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
  };
}

/**
 * Returns current Persian date and time string: e.g. "1405/07/09 ساعت ۱۴:۳۵"
 */
export function getCurrentPersianDateTime(): string {
  const cur = getCurrentJalaliDate();
  const timeStr = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
  return `${cur.formatted} ساعت ${timeStr}`;
}

/**
 * Computes remaining days from today until the target Jalali date.
 * Returns:
 *   > 0: days remaining
 *   0: today is the last day
 *   < 0: expired by X days
 *   null: if date invalid
 */
export function getDaysRemainingToPersianDate(targetDateStr: string): number | null {
  const parsed = parseJalaliDate(targetDateStr);
  if (!parsed) return null;
  const cur = getCurrentJalaliDate();

  const targetDays = jalaliToDays(parsed.year, parsed.month, parsed.day);
  const curDays = jalaliToDays(cur.year, cur.month, cur.day);

  return targetDays - curDays;
}

/**
 * Evaluates contract status based on expiration date and whether user explicitly terminated it.
 */
export function evaluateContractStatus(
  contractEndDate: string,
  isArchivedOrTerminated: boolean
): {
  status: 'active' | 'near_expiry' | 'expired' | 'terminated';
  daysRemaining: number;
  label: string;
  badgeClass: string;
} {
  if (isArchivedOrTerminated) {
    return {
      status: 'terminated',
      daysRemaining: 0,
      label: 'خاتمه همکاری (بایگانی‌شده)',
      badgeClass: 'bg-slate-800 text-white border-slate-700',
    };
  }

  const days = getDaysRemainingToPersianDate(contractEndDate);
  if (days === null) {
    return {
      status: 'active',
      daysRemaining: 999,
      label: 'فعال',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  }

  if (days < 0) {
    return {
      status: 'expired',
      daysRemaining: days,
      label: 'منقضی‌شده',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  }

  if (days <= 30) {
    return {
      status: 'near_expiry',
      daysRemaining: days,
      label: 'نزدیک به پایان',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-400 font-bold',
    };
  }

  return {
    status: 'active',
    daysRemaining: days,
    label: 'فعال',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
}

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
  const rem = (((year - 474) % 2820 + 2820) % 2820 + 474) % 33;
  return breaks.includes(rem) ? 30 : 29;
}

