/**
 * Utility functions for Persian formatting, numbers, and dates
 */

export function toPersianDigits(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return '';
  const str = String(n);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

export function formatPersianNumber(n: number | string | undefined | null): string {
  if (n === undefined || n === null || n === '') return '۰';
  const num = typeof n === 'number' ? n : parseFloat(String(n).replace(/,/g, ''));
  if (isNaN(num)) return '۰';
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(num);
  return toPersianDigits(formatted);
}

export function formatIsoToPersianTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '';
  }
}

export function formatIsoToPersianDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

/**
 * Sanitizes numeric input string:
 * - Converts Persian (۰-۹) and Arabic (٠-٩) digits to standard ASCII digits (0-9)
 * - Removes invalid characters
 * - Strips leading zero if followed by other digits (e.g. '05' -> '5', '012' -> '12')
 *   while preserving '0.' for decimal numbers like '0.8'
 * - Returns empty string "" when cleared so user can fully delete the number without a stuck '0'
 */
export function sanitizeNumericInput(val: string, allowDecimal = true): string {
  if (val === undefined || val === null || val === '') return '';
  let cleaned = String(val)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  if (allowDecimal) {
    cleaned = cleaned.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
  } else {
    cleaned = cleaned.replace(/[^0-9]/g, '');
  }

  // Strip leading zeros if followed by another digit (e.g. '05' -> '5', '00' -> '0')
  // while preserving decimals like '0.8'
  if (/^0[0-9]+/.test(cleaned)) {
    cleaned = cleaned.replace(/^0+/, '');
    if (cleaned === '') cleaned = '0';
  }

  return cleaned;
}

