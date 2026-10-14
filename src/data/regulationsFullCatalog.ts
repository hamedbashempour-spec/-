import { RegulationDocument, SearchResultItem } from '../types/regulationStructure';
import { mabhas2CompleteData } from './mabhas2CompleteData';

export interface RegulationCatalogItem {
  id: string;
  code: string;
  title: string;
  edition: string;
  year: string;
  discipline: 'سازه' | 'معماری' | 'تأسیسات مکانیکی' | 'تأسیسات برقی' | 'عمومی و ایمنی';
  status: 'مصوب و ملاک عمل' | 'پیش‌نویس' | 'در حال بازنگری';
  officialPublisher: string;
  summary: string;
  hasFullText: boolean;
  sourceFileId?: string;
  pdfUrl?: string;
  referenceLink?: string;
}

export const ALL_REGULATIONS_CATALOG: RegulationCatalogItem[] = [
  {
    id: 'mabhas-1',
    code: 'مبحث ۱',
    title: 'تعاریف مقررات ملی ساختمان',
    edition: 'ویرایش ۱۳۹۲',
    year: '۱۳۹۲',
    discipline: 'عمومی و ایمنی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'واژه‌نامه و تعاریف اصطلاحات فنی، حقوقی و اجرایی به کار رفته در تمامی مباحث ۲۳‌گانه مقررات ملی ساختمان ایران.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-2',
    code: 'مبحث ۲',
    title: 'نظامات اداری مقررات ملی ساختمان',
    edition: 'ویرایش ۱۳۸۴',
    year: '۱۳۸۴',
    discipline: 'عمومی و ایمنی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'شرح وظایف و اختیارات طراحان، مجریان ذیصلاح، ناظران، صاحبان کار، شهرداری‌ها، سازمان نظام مهندسی، شناسنامه فنی و ملکی، شرایط عمومی پیمان و قراردادهای همسان.',
    hasFullText: true,
    sourceFileId: 'mabhas2_cleaned.md',
    pdfUrl: '/Mabhas2-v1-1384-ATNasr.ir.pdf',
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-3',
    code: 'مبحث ۳',
    title: 'حفاظت ساختمان‌ها در مقابل حریق',
    edition: 'ویرایش ۱۳۹۵',
    year: '۱۳۹۵',
    discipline: 'عمومی و ایمنی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'ضوابط ایمنی آتش، راه‌های خروج و فرار، دوربندی پلکان‌ها، دیوارهای جداکننده آتش، سیستم‌های کشف و اطفای حریق و مقاومت سازه در برابر حریق.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-4',
    code: 'مبحث ۴',
    title: 'الزامات عمومی ساختمان',
    edition: 'ویرایش ۱۳۹۶',
    year: '۱۳۹۶',
    discipline: 'معماری',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'ضوابط ابعادی، ارتفاع کف تا سقف، نورگیری، تهویه، رمپ‌ها، پله‌ها، پارکینگ و دسترسی معلولان در کاربری‌های گوناگون.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-5',
    code: 'مبحث ۵',
    title: 'مصالح و فرآورده‌های ساختمانی',
    edition: 'ویرایش ۱۳۹۶',
    year: '۱۳۹۶',
    discipline: 'سازه',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'مشخصات فنی و استانداردهای مصالح ساختمانی نظیر سیمان، بتن، فولاد، آجر، عایق‌ها، سنگ و شرایط پذیرش در کارگاه.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-6',
    code: 'مبحث ۶',
    title: 'بارهای وارد بر ساختمان',
    edition: 'ویرایش ۱۳۹۸',
    year: '۱۳۹۸',
    discipline: 'سازه',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'بار مرده، بار زنده، بار برف، بار باد، بار باران، فشار خاک و آب و ترکیب‌های بارگذاری طراحی سازه.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-7',
    code: 'مبحث ۷',
    title: 'پی و پی‌سازی و گودبرداری',
    edition: 'ویرایش ۱۴۰۰',
    year: '۱۴۰۰',
    discipline: 'سازه',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'شناسایی ژئوتکنیکی زمین، ظرفیت باربری خاک، طراحی انواع پی‌ها، گودبرداری ایمن، سازه‌های نگهبان و پایش نشست ابنیه مجاور.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-8',
    code: 'مبحث ۸',
    title: 'طرح و اجرای ساختمان‌های با مصالح بنایی',
    edition: 'ویرایش ۱۳۹۸',
    year: '۱۳۹۸',
    discipline: 'سازه',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'ضوابط طراحی و اجرای ساختمان‌های بنایی مسلح و غیرمسلح محصور با کلاف‌های بتنی یا فولادی.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-9',
    code: 'مبحث ۹',
    title: 'طرح و اجرای ساختمان‌های بتن‌آرمه',
    edition: 'ویرایش ۱۳۹۹',
    year: '۱۳۹۹',
    discipline: 'سازه',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'طراحی حالت‌های حدی بتن‌آرمه، طول مهاری، وصله پوششی آرماتورها، کنترل خیز و ترک، ضوابط ویژه شکل‌پذیری و کنترل کیفیت بتن کارگاهی.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-10',
    code: 'مبحث ۱۰',
    title: 'طرح و اجرای ساختمان‌های فولادی',
    edition: 'ویرایش ۱۴۰۱',
    year: '۱۴۰۱',
    discipline: 'سازه',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'طراحی اعضای کششی، فشاری و خمشی فولادی، اتصالات پیچی و جوشی، اتصالات گیردار پیش‌تأییدشده و کنترل لرزه‌ای قاب‌های فولادی.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-11',
    code: 'مبحث ۱۱',
    title: 'طرح و اجرای صنعتی ساختمان‌ها',
    edition: 'ویرایش ۱۳۹۹',
    year: '۱۳۹۹',
    discipline: 'سازه',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'فناوری‌های نوین و صنعتی‌سازی ساختمان نظیر بتن پیش‌ساخته، سازه‌های سبک فولادی (LSF)، قالب‌های ماندگار (ICF) و پانل‌های سه‌بعدی.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-12',
    code: 'مبحث ۱۲',
    title: 'ایمنی و حفاظت کار در حین اجرا',
    edition: 'ویرایش ۱۳۹۲',
    year: '۱۳۹۲',
    discipline: 'عمومی و ایمنی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'ایمنی کارگاه‌های ساختمانی، داربست‌ها، وسایل حفاظت فردی، راه‌بندها، پیشگیری از سقوط و حفاظت از عابران و کارگران.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-13',
    code: 'مبحث ۱۳',
    title: 'طرح و اجرای تأسیسات برقی ساختمان‌ها',
    edition: 'ویرایش ۱۳۹۵',
    year: '۱۳۹۵',
    discipline: 'تأسیسات برقی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'سیستم‌های توزیع برق، هم‌بندی، اتصال به زمین (ارتینگ)، کلیدهای محافظ جان RCD، روشنایی، مدارها و کابل‌کشی استاندارد.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-14',
    code: 'مبحث ۱۴',
    title: 'تأسیسات مکانیکی ساختمان',
    edition: 'ویرایش ۱۳۹۶',
    year: '۱۳۹۶',
    discipline: 'تأسیسات مکانیکی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'سیستم‌های گرمایش، سرمایش، تعویض هوا، تخلیه هوا، کانال‌کشی، دیگ‌ها، چیلرها و موتورخانه‌های بهداشتی.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-15',
    code: 'مبحث ۱۵',
    title: 'آسانسورها و پلکان‌برقی',
    edition: 'ویرایش ۱۳۹۲',
    year: '۱۳۹۲',
    discipline: 'تأسیسات مکانیکی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'الزامات ابعادی چاهک و موتورخانه، استانداردهای ایمنی آسانسورهای مسافری و باری، سیستم پاراشوت و پلکان‌برقی.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-16',
    code: 'مبحث ۱۶',
    title: 'تأسیسات بهداشتی ساختمان',
    edition: 'ویرایش ۱۳۹۸',
    year: '۱۳۹۸',
    discipline: 'تأسیسات مکانیکی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'لوله‌کشی آب مصرفی، فاضلاب، لوله‌کشی هواکش (ونت)، آب باران، مخازن ذخیره آب و بوگیرها.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-17',
    code: 'مبحث ۱۷',
    title: 'لوله‌کشی گاز طبیعی ساختمان‌ها',
    edition: 'ویرایش ۱۴۰۱',
    year: '۱۴۰۱',
    discipline: 'تأسیسات مکانیکی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'طراحی، محاسبه و اجرای لوله‌کشی گاز با فشار ۱/۴ پوند بر اینچ مربع و ۲ پوند، تست فشار، دودکش‌ها و تامین هوای احتراق.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-18',
    code: 'مبحث ۱۸',
    title: 'عایق‌بندی و تنظیم صدا',
    edition: 'ویرایش ۱۳۹۶',
    year: '۱۳۹۶',
    discipline: 'معماری',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'کنترل نوفه، افت صدابندی هوابرد و کوبه‌ای دیوارها و سقف‌ها و تامین حدود آسایش صوتی کاربران ساختمان.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-19',
    code: 'مبحث ۱۹',
    title: 'صرفه‌جویی در مصرف انرژی',
    edition: 'ویرایش ۱۳۹۹',
    year: '۱۳۹۹',
    discipline: 'معماری',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'عایق‌کاری حرارتی پوسته خارجی ساختمان، پنجره‌های دوجداره، محاسبه ضریب انتقال حرارت مرجع و سیستم‌های کنترل هوشمند انرژی.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-20',
    code: 'مبحث ۲۰',
    title: 'علائم و تابلوها',
    edition: 'ویرایش ۱۳۹۶',
    year: '۱۳۹۶',
    discipline: 'عمومی و ایمنی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'ضوابط ایمنی، ابعادی و ارتفاع نصب تابلوهای راهنما، علائم اخباری، اخطاری و تابلوهای تبلیغاتی و تجاری در معابر.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-21',
    code: 'مبحث ۲۱',
    title: 'پدافند غیرعامل',
    edition: 'ویرایش ۱۳۹۵',
    year: '۱۳۹۵',
    discipline: 'عمومی و ایمنی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'الزامات پایداری سازه، پناهگاه‌ها، سامانه‌های تخلیه اضطراری، حفاظت از شریان‌های حیاتی و کاهش آسیب‌پذیری در حوادث بحرانی.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-22',
    code: 'مبحث ۲۲',
    title: 'مراقبت و نگهداری از ساختمان‌ها',
    edition: 'ویرایش ۱۳۹۲',
    year: '۱۳۹۲',
    discipline: 'عمومی و ایمنی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'بازرسی‌های دوره‌ای، تعمیرات و نگهداری تأسیسات مکانیکی، برقی، سازه‌ای و پوسته خارجی ساختمان در طول دوره بهره‌برداری.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'mabhas-23',
    code: 'مبحث ۲۳',
    title: 'الزامات ترافیکی ساختمان',
    edition: 'ویرایش ۱۴۰۱',
    year: '۱۴۰۱',
    discipline: 'معماری',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'دفتر مقررات ملی و کنترل ساختمان',
    summary: 'بررسی عارضه‌سنجی ترافیکی، ورود و خروج وسایل نقلیه، پارکینگ‌های تجاری و بزرگ و همخوانی با شبکه معابر پیرامونی.',
    hasFullText: false,
    referenceLink: 'https://inbr.ir',
  },
  {
    id: 'payvast-6-2800',
    code: 'پیوست ۶ ۲۸۰۰',
    title: 'طراحی لرزه‌ای و اجرای اجزای غیرسازه‌ای معماری (وال‌پست‌ها)',
    edition: 'ویرایش چهارم استاندارد ۲۸۰۰',
    year: '۱۳۹۸',
    discipline: 'سازه',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'مرکز تحقیقات راه، مسکن و شهرسازی',
    summary: 'مهار لرزه‌ای دیوارهای پیرامونی و تیغه‌های داخلی، وادارهای قائم، اتصال تلسکوپی، میلگرد بستر گالوانیزه و درز انقطاع لرزه‌ای.',
    hasFullText: false,
    referenceLink: 'https://bhrc.ac.ir',
  },
  {
    id: 'nashrieh-55',
    code: 'نشریه ۵۵',
    title: 'مشخصات فنی عمومی کارهای ساختمانی',
    edition: 'تجدیدنظر دوم',
    year: '۱۳۸۴',
    discipline: 'سازه',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'سازمان برنامه و بودجه کشور',
    summary: 'دستورالعمل‌ها و مشخصات فنی استاندارد خاکبرداری، بتن‌ریزی در هوای سرد و گرم، عمل‌آوری، آجرچینی، عایق‌کاری و ملات‌ها.',
    hasFullText: false,
    referenceLink: 'https://mporg.ir',
  },
  {
    id: 'nashrieh-4311',
    code: 'نشریه ۴۳۱۱',
    title: 'شرایط عمومی و خصوصی پیمان و مقررات پیمانکاری',
    edition: 'مصوب سازمان مدیریت و برنامه‌ریزی',
    year: '۱۳۷۸',
    discipline: 'عمومی و ایمنی',
    status: 'مصوب و ملاک عمل',
    officialPublisher: 'سازمان برنامه و بودجه کشور',
    summary: 'مجموعه ضوابط حقوقی و اجرایی شرایط عمومی پیمان، تعهدات پیمانکار و کارفرما، صورت‌وضعیت‌ها، تحویل موقت و قطعی و حل اختلاف.',
    hasFullText: false,
    referenceLink: 'https://mporg.ir',
  },
];

// Ingested full documents database (extensible to all 23 topics)
const LOADED_DOCUMENTS: Record<string, RegulationDocument> = {
  'mabhas-2': mabhas2CompleteData,
};

export function getLoadedDocument(regulationId: string): RegulationDocument | null {
  return LOADED_DOCUMENTS[regulationId] || null;
}

/**
 * 100% Client-Side Offline Full-Text Search
 * Searches through all loaded documents without any network calls!
 */
export function searchRegulationsClientSide(query: string): SearchResultItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  const results: SearchResultItem[] = [];

  for (const doc of Object.values(LOADED_DOCUMENTS)) {
    for (const chapter of doc.chapters) {
      for (const section of chapter.sections) {
        for (const clause of section.clauses) {
          const matchInOfficialNum = clause.officialNumber.toLowerCase().includes(trimmed);
          const matchInTitle = clause.title ? clause.title.toLowerCase().includes(trimmed) : false;
          const matchInContent = clause.content.toLowerCase().includes(trimmed);
          const matchInNotes = clause.notes
            ? clause.notes.some((n) => n.toLowerCase().includes(trimmed))
            : false;

          if (matchInOfficialNum || matchInTitle || matchInContent || matchInNotes) {
            // Find snippet around match
            let snippet = '';
            const idx = clause.content.toLowerCase().indexOf(trimmed);
            if (idx >= 0) {
              const start = Math.max(0, idx - 60);
              const end = Math.min(clause.content.length, idx + trimmed.length + 90);
              snippet = (start > 0 ? '... ' : '') + clause.content.substring(start, end) + (end < clause.content.length ? ' ...' : '');
            } else if (clause.notes && matchInNotes) {
              const matchedNote = clause.notes.find((n) => n.toLowerCase().includes(trimmed)) || '';
              snippet = matchedNote.substring(0, 150);
            } else {
              snippet = clause.content.substring(0, 150) + '...';
            }

            results.push({
              regulationId: doc.id,
              regulationCode: doc.code,
              regulationTitle: doc.title,
              chapterTitle: chapter.title,
              sectionTitle: section.title,
              clauseId: clause.id,
              officialNumber: clause.officialNumber,
              clauseTitle: clause.title,
              matchedTextSnippet: snippet,
            });

            if (results.length >= 60) {
              return results;
            }
          }
        }
      }
    }
  }

  return results;
}
