// Centralized 12 Approved Construction Trades and Fixed Rate Units
// Decision of the project: strictly fixed units per trade, no custom units, no "نجار",
// and "آرماتوربند" represents the entire rebar/formwork/concrete team.

export interface ConstructionTradeDefinition {
  id: string;
  title: string;
  unit: string;
  category: string;
  description: string;
}

export const APPROVED_CONSTRUCTION_TRADES: ConstructionTradeDefinition[] = [
  {
    id: 'banna',
    title: 'بنا',
    unit: 'روزمزد',
    category: 'سفت‌کاری و بنایی',
    description: 'عملیات بنایی، دیوارچینی سفال و بلوک، سفت‌کاری',
  },
  {
    id: 'kargar',
    title: 'کارگر',
    unit: 'روزمزد',
    category: 'خدمات عمومی و کارگری',
    description: 'کارگر ساده ساختمانی، جابجایی مصالح، تخریب و کمک‌بنا',
  },
  {
    id: 'armatorband',
    title: 'آرماتوربند',
    unit: 'مترمربع',
    category: 'سازه و اسکلت',
    description: 'اکیپ آرماتوربندی، قالب‌بندی و بتن‌ریزی فونداسیون و سقف',
  },
  {
    id: 'gachkar',
    title: 'گچکار',
    unit: 'مترمربع زیربنا',
    category: 'نازک‌کاری',
    description: 'گچ و خاک، سفیدکاری، کشته‌کشی و ابزارزنی',
  },
  {
    id: 'simankar',
    title: 'سیمانکار',
    unit: 'مترمربع سطح',
    category: 'سفت‌کاری و نما',
    description: 'سیمان‌کاری زیرکار، رویه، تگری، آستر و شست‌وشو',
  },
  {
    id: 'kashikar',
    title: 'کاشیکار',
    unit: 'مترمربع',
    category: 'نازک‌کاری و بهداشتی',
    description: 'کاشی‌کاری، سرامیک‌کاری کف و بدنه و سرویس‌ها',
  },
  {
    id: 'sangkar',
    title: 'سنگکار',
    unit: 'مترمربع سنگ',
    category: 'سازه و نما',
    description: 'سنگ‌کاری نمای ساختمان، راه‌پله، کف و دیوارهای داخلی',
  },
  {
    id: 'naghash',
    title: 'نقاش ساختمان',
    unit: 'مترمربع دیوار',
    category: 'تزئینات و رنگ',
    description: 'رنگ‌آمیزی پلاستیک، روغنی، اکرلیک و ماستیک سطوح',
  },
  {
    id: 'loolehkash',
    title: 'لوله‌کش',
    unit: 'مترمربع',
    category: 'تاسیسات مکانیکی',
    description: 'لوله‌کشی آب سرد و گرم، فاضلاب، پکیج و تاسیسات زیربنایی',
  },
  {
    id: 'barghkar',
    title: 'برقکار',
    unit: 'مترمربع',
    category: 'تاسیسات الکتریکی',
    description: 'برق‌کشی ساختمان، شیارزنی، لوله‌گذاری، سیم‌کشی و نصبیات',
  },
  {
    id: 'jooshkar',
    title: 'جوشکار',
    unit: 'کیلوگرم',
    category: 'اسکلت فلزی و آهنگری',
    description: 'ساخت و نصب اسکلت فلزی، جوشکاری سازه، نبشی‌کشی و وال‌پست',
  },
  {
    id: 'cabinetsaz',
    title: 'کابینت‌ساز',
    unit: 'متر کابینت',
    category: 'دکوراسیون و صنایع چوب',
    description: 'ساخت و نصب کابینت آشپزخانه (هوایی و زمینی)، کمد دیواری',
  },
];

/**
 * Returns the immutable fixed rate unit for a given trade title.
 * If the trade is unknown, defaults to 'مترمربع'.
 */
export function getFixedUnitForTrade(tradeTitle: string): string {
  const clean = (tradeTitle || '').trim();
  const matched = APPROVED_CONSTRUCTION_TRADES.find(
    (t) => t.title.trim() === clean
  );
  return matched ? matched.unit : 'مترمربع';
}

/**
 * Checks if a trade title is part of the approved 12 construction trades.
 */
export function isApprovedTrade(tradeTitle: string): boolean {
  const clean = (tradeTitle || '').trim();
  return APPROVED_CONSTRUCTION_TRADES.some((t) => t.title.trim() === clean);
}

/**
 * Returns the matching approved trade definition (from the 12 trades) for an artisan's category/trade.
 * Supports exact matches and standard keyword/synonym variations (e.g. بنا و سفت‌کار -> بنا).
 */
export function getApprovedTradeForCategory(trade: string): ConstructionTradeDefinition | undefined {
  if (!trade) return undefined;
  const clean = trade.trim();

  // 1. Exact title match
  const exact = APPROVED_CONSTRUCTION_TRADES.find((t) => t.title === clean);
  if (exact) return exact;

  // 2. Keyword/synonym matching for the 12 trades
  if (clean.includes('آرماتور') || clean.includes('قالب‌بند')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'armatorband');
  }
  if (clean.includes('بنا')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'banna');
  }
  if (clean.includes('کارگر')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'kargar');
  }
  if (clean.includes('گچ')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'gachkar');
  }
  if (clean.includes('سیمان')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'simankar');
  }
  if (clean.includes('کاشی')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'kashikar');
  }
  if (clean.includes('سنگ')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'sangkar');
  }
  if (clean.includes('نقاش')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'naghash');
  }
  if (clean.includes('لوله‌کش') || clean.includes('لوله کش') || clean.includes('تاسیسات مکانیکی') || clean.includes('تاسیسات آب')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'loolehkash');
  }
  if (clean.includes('برق') || clean.includes('سیم‌کشی') || clean.includes('سیم کشی')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'barghkar');
  }
  if (clean.includes('جوش') || clean.includes('اسکلت فلزی') || clean.includes('آهنگر')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'jooshkar');
  }
  if (clean.includes('کابینت')) {
    return APPROVED_CONSTRUCTION_TRADES.find((t) => t.id === 'cabinetsaz');
  }

  return undefined;
}

/**
 * Checks if an artisan's trade is eligible for wage rate registration (one of the 12 trades).
 */
export function isWageRateRegistrationAllowed(trade: string): boolean {
  return !!getApprovedTradeForCategory(trade);
}
