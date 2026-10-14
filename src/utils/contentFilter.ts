// Comprehensive Persian & regional vulgarity / profanity / insult filter
// to prevent offensive or defamatory submissions in comments, artisan names, and descriptions.
// Uses strict Unicode word-boundary matching to prevent false positives on regular words (e.g. مسکونی, گلشهر, کارگاه, عنوان).

const PROFANITY_WORDS = [
  'کثافت',
  'احمق',
  'بیشعور',
  'بی‌شعور',
  'کره خر',
  'کره‌خر',
  'عوضی',
  'آشغال',
  'اشغال',
  'پدرسگ',
  'پدر سگ',
  'پدر سوخته',
  'پدرسوخته',
  'حرومزاده',
  'حرامزاده',
  'دیوس',
  'دیوث',
  'بیناموس',
  'بی‌ناموس',
  'لاشی',
  'جنده',
  'فاحشه',
  'کونی',
  'کون',
  'کیر',
  'کسکش',
  'کوس‌کش',
  'مادر به خطا',
  'مادربه‌خطا',
  'مادر خراب',
  'مادرخراب',
  'خفه شو',
  'ابله',
  'سکس',
  'سکسی',
  'پورن',
  'شارلاتان',
  'سیکتیر',
  'قحبه',
  'سگ‌صفت',
  'بی‌همه‌چیز',
  'بی همه چیز',
  'پفیوز',
];

// Normalize persian text for matching
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[\u200B-\u200D\uFEFF]/g, ' ') // zero-width spaces to space
    .replace(/[\s\-_]+/g, ' ')
    .trim();
}

/**
 * Checks whether the given text contains any inappropriate or insulting words.
 * Strictly uses Unicode letter boundaries (?<!\p{L}) ... (?!\p{L})
 * to avoid matching inside words like مسکونی, گلشهر, کارگاه, عنوان, etc.
 */
export function containsInappropriateContent(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = normalizeText(text);
  if (!normalized) return false;

  for (const word of PROFANITY_WORDS) {
    const normWord = normalizeText(word);
    if (!normWord) continue;

    try {
      // Regex with negative lookbehind and lookahead for Unicode letters
      // This ensures that 'کون' does NOT match 'مسکونی' or 'تاکنون'
      const regex = new RegExp(`(?<!\\p{L})${normWord}(?!\\p{L})`, 'u');
      if (regex.test(normalized)) {
        return true;
      }
    } catch {
      // Fallback boundary regex
      const fallbackRegex = new RegExp(`(^|\\s|[.,!?;:()«»"'\`])${normWord}($|\\s|[.,!?;:()«»"'\`])`, 'i');
      if (fallbackRegex.test(normalized)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates multiple fields at once. Returns error message if any contains profanity.
 */
export function validateSafeContent(fields: { label: string; value: string }[]): {
  isValid: boolean;
  errorMessage?: string;
} {
  for (const field of fields) {
    if (containsInappropriateContent(field.value)) {
      return {
        isValid: false,
        errorMessage: `متن بخش «${field.label}» شامل کلمات نامناسب یا توهین‌آمیز است. لطفاً متن را ویرایش فرمایید.`,
      };
    }
  }
  return { isValid: true };
}

/**
 * Replaces inappropriate words with asterisks for safe display
 */
export function maskProfanity(text: string): string {
  if (!text) return '';
  let result = text;
  for (const word of PROFANITY_WORDS) {
    try {
      const reg = new RegExp(`(?<!\\p{L})${word}(?!\\p{L})`, 'gu');
      result = result.replace(reg, '***');
    } catch {
      const reg = new RegExp(word, 'gi');
      result = result.replace(reg, '***');
    }
  }
  return result;
}
