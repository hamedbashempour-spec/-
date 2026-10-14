import { ProjectStage } from '../types/project';
import { DefaultStageControlItem } from '../data/stageChecklistsMapping';

/**
 * Generates floor-adaptive construction execution stages based on building floors count and structure type.
 * مراحل اجرایی پروژه متناسب با تعداد طبقات و نوع سازه (بتنی / فولادی)
 */
export function generateProjectStages(
  floorsCount: number | string,
  structureType?: string
): ProjectStage[] {
  const count = Math.max(1, Math.min(25, Number(floorsCount) || 1));
  const isSteel =
    (structureType || '').includes('فولاد') ||
    (structureType || '').includes('فلز') ||
    (structureType || '').toLowerCase().includes('steel');

  const stagesList: { name: string }[] = [
    { name: 'شروع پروژه و اطلاعات پایه' },
    { name: 'تجهیز و آماده‌سازی کارگاه' },
    { name: 'خاکبرداری و سازه نگهبان' },
    { name: 'فونداسیون و بتن مگر' },
  ];

  if (isSteel) {
    // مراحل فونداسیون اسکلت فولادی
    stagesList.push({ name: 'آرماتوربندی و قالب‌بندی فونداسیون' });
    stagesList.push({ name: 'نصب، شابلون‌گذاری و تراز بولت‌ها و صفحه ستون‌ها (بیس‌پلیت)' });
    stagesList.push({ name: 'بتن‌ریزی فونداسیون و هواگیری بولت‌ها' });
    stagesList.push({ name: 'گروت‌ریزی زیر صفحه ستون‌ها (Grouting)' });

    // مراحل طبقات اسکلت فولادی
    for (let f = 1; f <= count; f++) {
      const floorLabel = count === 1 ? 'طبقه همکف' : f === 1 ? 'همکف (طبقه ۱)' : `طبقه ${f}`;
      stagesList.push({ name: `نصب و شاقول‌سازی ستون‌های فولادی ${floorLabel}` });
      stagesList.push({ name: `نصب تیرهای اصلی، فرعی و بادبندهای ${floorLabel}` });
      stagesList.push({ name: `کنترل اتصالات جوشی و پیچ و مهره‌ای ${floorLabel}` });
      stagesList.push({ name: `اجرای سقف (عرشه فولادی / کامپوزیت) ${floorLabel}` });
      stagesList.push({ name: `آرماتوربندی و بتن‌ریزی سقف ${floorLabel}` });
    }
  } else {
    // مراحل فونداسیون اسکلت بتنی
    stagesList.push({ name: 'آرماتوربندی فونداسیون' });
    stagesList.push({ name: 'قالب‌بندی فونداسیون' });
    stagesList.push({ name: 'بتن‌ریزی فونداسیون' });

    // مراحل طبقات اسکلت بتنی
    for (let f = 1; f <= count; f++) {
      const floorLabel = count === 1 ? 'طبقه همکف' : f === 1 ? 'همکف (طبقه ۱)' : `طبقه ${f}`;
      stagesList.push({ name: `اجرا و آرماتوربندی ستون‌های ${floorLabel}` });
      stagesList.push({ name: `قالب‌بندی و شمع‌بندی سقف ${floorLabel}` });
      stagesList.push({ name: `آرماتوربندی و تیرچه‌ریزی سقف ${floorLabel}` });
      stagesList.push({ name: `بتن‌ریزی سقف ${floorLabel}` });
    }
  }

  // سفت‌کاری و دیوارهای پیرامونی مشترک
  for (let f = 1; f <= count; f++) {
    const floorLabel = count === 1 ? 'طبقه همکف' : f === 1 ? 'همکف (طبقه ۱)' : `طبقه ${f}`;
    stagesList.push({ name: `دیوارچینی ${floorLabel}` });
    stagesList.push({ name: `وال‌پست و مهار لرزه‌ای دیوارها ${floorLabel}` });
  }

  // نازک‌کاری، تأسیسات و تحویل
  stagesList.push(
    { name: 'تأسیسات لوله‌کشی آب و فاضلاب' },
    { name: 'تأسیسات برق‌کشی و ارت ساختمان' },
    { name: 'عایق‌کاری رطوبتی سرویس‌ها و بالکن‌ها' },
    { name: 'کف‌سازی و شیب‌بندی طبقات' },
    { name: 'کاشی‌کاری و سرامیک' },
    { name: 'سفیدکاری و گچ‌کاری' },
    { name: 'نقاشی و رنگ‌آمیزی' },
    { name: 'تکمیل نصبیات تأسیسات و آسانسور' },
    { name: 'کنترل‌های نهایی، ایمنی و پایان کار' },
    { name: 'پایان پروژه و تحویل قطعی' }
  );

  return stagesList.map((s, index) => ({
    id: index + 1,
    name: s.name,
    status: index === 0 ? 'in_progress' : 'not_started',
  }));
}

/**
 * Returns tailored checklist items for any stage name, dynamically aligned with project structure type.
 * چک‌لیست کنترل‌های کارگاهی منطبق بر نوع سازه (فولادی یا بتنی)
 */
export function getControlsForStageName(
  stageId: number,
  stageName: string,
  structureType?: string
): DefaultStageControlItem[] {
  const name = stageName.trim();
  const isSteel =
    (structureType || '').includes('فولاد') ||
    (structureType || '').includes('فلز') ||
    (structureType || '').toLowerCase().includes('steel');

  // ==========================================
  // بخش ۱: موارد اختصاصی سازه فولادی (Steel)
  // ==========================================
  if (name.includes('بولت') || name.includes('صفحه ستون') || name.includes('بیس‌پلیت')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل آکس‌بندی، فواصل و تراز رقوم ارتفاعی بولت‌ها با دوربین نقشه‌برداری طبق نقشه` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل شابلون‌بندی صلب و مهار بولت‌ها به آرماتورهای فونداسیون قبل از بتن‌ریزی` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل طول رزوه آزاد، گریس‌کاری و پوشش حفاظتی رزوه‌ها جهت جلوگیری از پاشش بتن` },
      { id: `dyn-${stageId}-t4`, category: 'technical', title: `کنترل مهره و واشرهای دوبل و نشیمن بیس‌پلیت طبق جزئیات محاسباتی` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `نصب درپوش ایمنی روی رزوه‌های بیرون‌زده بولت‌ها جهت جلوگیری از بریدگی و جراحت` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `تأمین مسیر عبور ایمن روی شبکه میلگردها حین کارگذاری و نقشه‌برداری بیس‌پلیت‌ها` },
    ];
  }

  if (name.includes('گروت‌ریزی')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `تمیزکاری سطح زیر صفحه ستون، زدودن گرد و غبار، چربی و مرطوب‌سازی قبل از گروت` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `استفاده از گروت پایه سیمانی بدون انقباض (Non-shrink) با مقاومت استاندارد` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل شیوه ریختن پیوسته از یک طرف جهت خروج کامل حباب‌های هوا از سوراخ‌های هواکش` },
      { id: `dyn-${stageId}-t4`, category: 'technical', title: `عمل‌آوری رطوبتی (کیورینگ) گروت به مدت حداقل ۴۸ ساعت پس از اجرا` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `استفاده از عینک محافظ، ماسک ضد گرد و غبار و دستکش لاستیکی حین مخلوط کردن گروت` },
    ];
  }

  if (name.includes('ستون‌های فولادی') || (isSteel && name.includes('ستون'))) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل ابعاد مقطع، ضخامت ورق‌های ستون، پلیت‌های تقویتی و سلامت ظاهری قطعات` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل شاقولی ستون‌ها در دو جهت متعامد با دوربین نقشه‌برداری / شاقول لیزری` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل راستا و هم‌محوری وصله ستون‌ها و تمیز بودن سطوح اتصال ورق‌های وصله` },
      { id: `dyn-${stageId}-t4`, category: 'technical', title: `مهاربندی موقت و صلب ستون‌ها با سیم بکسل، کابل و تیفور تا تکمیل اتصالات گیردار` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `استفاده الزامی از کمربند ایمنی متصل به لایف‌لاین و داربست پایدار حین نصب در ارتفاع` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `حفظ حریم ایمن جرثقیل و نظارت بر بکسل‌بندی استاندارد قطعات سنگین فولادی` },
    ];
  }

  if (name.includes('تیرهای اصلی') || name.includes('بادبند') || (isSteel && name.includes('تیر'))) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل نمره پروفیل تیرهای اصلی و فرعی، ورق‌های نشیمن و لچکی‌ها طبق نقشه` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل تراز روی بال تیرها و اتصال صلب (گیردار) یا مفصلی به ستون` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل ضخامت و ابعاد ورق‌های گاست‌پلیت (Gusset) و هم‌راستایی بادبندها` },
      { id: `dyn-${stageId}-t4`, category: 'technical', title: `کنترل عدم وجود تابیدگی، پیچش یا له‌شدگی در مقاطع فلزی` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `استفاده از طناب مهار (Tag line) برای هدایت تیرها در حین بالا کشیدن توسط جرثقیل` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `ممنوعیت عبور و توقف کارگران در زیر بار معلق جرثقیل و محصور کردن شعاع عملیات` },
    ];
  }

  if (name.includes('اتصالات جوشی') || name.includes('پیچ و مهره') || (isSteel && name.includes('اتصالات'))) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل بعد (سایز گلویی)، طول و کیفیت ظاهری جوش‌ها (عدم بریدگی کناره، ترک یا تخلخل)` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل گواهینامه جوشکاران و گزارش تست‌های غیرمخرب (NDT: چشمی VT، مایع نافذ PT و التراسونیک UT)` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل رده مقاومتی پیچ و مهره‌ها (گرید 8.8 یا 10.9) و استفاده از آچار ترکمتر کالیبره` },
      { id: `dyn-${stageId}-t4`, category: 'technical', title: `کنترل عدم استفاده از پیچ‌های صدمه‌دیده و بکارگیری واشرهای سخت‌کاری‌شده` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `استفاده از شیلد محافظ چشم، دستکش چرمی ساق‌بلند و لباس کار مقاوم به حریق` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `استقرار کپسول‌های آتش‌نشانی آماده به کار در مجاورت محل جوشکاری و برشکاری` },
    ];
  }

  if (name.includes('عرشه فولادی') || (isSteel && name.includes('سقف') && !name.includes('بتن‌ریزی'))) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل ضخامت و گالوانیزاسیون ورق‌های عرشه فولادی (حداقل ۰.۸ میلی‌متر) و فرم هندسی` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل تثبیت و دوختن ورق‌ها با پیچ خودکار و فلاشینگ‌های دور سقف و بازشوها` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل ابعاد، فواصل و تست خمش گلمیخ‌ها (Shear Studs) با دستگاه استاد ولدینگ` },
      { id: `dyn-${stageId}-t4`, category: 'technical', title: `کنترل شبکه مش آرماتور حرارتی، اورلپ و رعایت فاصله از روی ورق با اسپیسر` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `نصب توری نجات یا تخته‌کشی کامل در زیر دهانه‌های باز طبقات قبل از پهن کردن ورق` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `مهار لبه‌های پیرامونی سقف و چاله آسانسور با حفاظ استاندارد جهت پیشگیری از سقوط` },
    ];
  }

  // ==========================================
  // بخش ۲: موارد اختصاصی سازه بتنی (Concrete)
  // ==========================================
  if (!isSteel && name.includes('ستون')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل نمره، تعداد و طول همپوشانی (اورلپ) میلگردهای طولی ستون‌ها طبق نقشه` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل فاصله خاموت‌ها در ناحیه بحرانی (یک‌ششم ابتدایی و انتهایی) و ناحیه میانی` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل زاویه خم ۱۳۵ درجه خاموت‌ها و سنجاقی‌های ستون طبق ضوابط لرزه‌ای` },
      { id: `dyn-${stageId}-t4`, category: 'technical', title: `کنترل شاقولی، ابعاد مقطع و رعایت کاور بتن با اسپیسرهای استاندارد بتنی/پلاستیکی` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `نصب کلاهک قارچی سر میلگردهای انتظار جهت جلوگیری از فرورفتگی` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `پاگرد استاندارد و کمربند ایمنی حین آرماتوربندی ستون‌ها در ارتفاع` },
      { id: `dyn-${stageId}-s3`, category: 'safety', title: `مهاربندی موقت قالب ستون‌ها در برابر باد تا زمان بتن‌ریزی` },
    ];
  }

  if (!isSteel && name.includes('قالب‌بندی') && name.includes('سقف')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل تراز کف قالب، خیز منفی سقف و ابعاد قالب تیرها طبق نقشه محاسباتی` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل فواصل جک‌های سقفی و کفشک‌های چوبی زیر پایه‌ها` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل روغن‌کاری قالب‌ها و درزبندی اتصالات جهت عدم فرار شیره بتن` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `نصب نرده یا توری حفاظتی در لبه‌های پرتگاهی سقف و چاله آسانسور` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `کنترل سلامت رزوه جک‌ها و مهار ضربدری لوله‌های داربست زیر سقف` },
      { id: `dyn-${stageId}-s3`, category: 'safety', title: `پوشش کامل بازشوهای بزرگ سقف (داکت‌ها و نورگیرها) با تخته محکم` },
    ];
  }

  if (!isSteel && name.includes('آرماتوربندی') && name.includes('سقف')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل نمره و تعداد میلگردهای طولی تیرها، تقویتی‌ها و لنگر منفی طبق نقشه` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل نشیمن تیرچه‌ها روی تیر، میلگردهای ادکا و ممان منفی` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل کلاف میانی (ژوئن)، فاصله میلگردهای حرارتی و رعایت کاور بتن` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `تخته‌گذاری مطمئن جهت تردد کارگران و پرهیز از راه رفتن روی یونولیت‌ها` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `استفاده از کمربند ایمنی متصل به لایف‌لاین در لبه‌های پیرامونی سقف` },
      { id: `dyn-${stageId}-s3`, category: 'safety', title: `عدم انباشت سنگین بسته‌های میلگرد در یک نقطه متمرکز سقف` },
    ];
  }

  // بتن‌ریزی سقف (مشترک با در نظر گرفتن ضخامت دال بتنی)
  if (name.includes('بتن‌ریزی') && name.includes('سقف')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `اخذ مجوز بتن‌ریزی ناظر و کنترل عیار سیمان، اسلامپ و نمونه‌گیری آزمایشگاه بتن` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل ضخامت بتن سقف، تراز شیلنگ‌تراز و سالم ماندن اسپیسرها حین بتن‌ریزی` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل تراکم با ویبراتور مناسب و پرهیز از اعمال بار زودهنگام روی سقف` },
      { id: `dyn-${stageId}-t4`, category: 'technical', title: `عمل‌آوری رطوبتی مداوم بتن (کیورینگ با آب / گونی نم‌دار) حداقل به مدت یک هفته` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `استقرار دیده‌بان در زیر سقف جهت پایش سلامت پایه‌ها و جک‌ها حین بارگذاری بتن` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `مهار مطمئن لوله پمپ دکل و استفاده از چکمه و عینک توسط کارگران بتن‌ریز` },
    ];
  }

  // ==========================================
  // بخش ۳: مراحل مشترک ساختمانی (Common)
  // ==========================================
  if (name.includes('دیوارچینی')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل راستا، شاقولی و ریسمانی بودن دیوارهای پیرامونی و تیغه‌ها` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل پیوند ملات، مرطوب‌سازی بلوک‌ها و هشت‌گیر کردن تقاطع دیوارها` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل عایق صوتی و حرارتی دیوارهای پیرامونی مطابق مبحث ۱۹ مقررات ملی` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `ممنوعیت اکید چیدن دیوار روی بشکه و تخته‌های ناپایدار در ارتفاع` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `مهاربندی موقت دیوارهای خارجی در برابر باد تا زمان گیرش کامل ملات` },
      { id: `dyn-${stageId}-s3`, category: 'safety', title: `نصب حفاظ پرتگاه در بازشوهای پنجره‌ها و نما حین دیوارچینی` },
    ];
  }

  if (name.includes('وال‌پست')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل اجرای وادارهای میانی (H و U) و وال‌پست طبق پیوست ششم استاندارد ۲۸۰۰` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل درز جداسازی دیوار از سازه (حداقل ۲.۵ سانتی‌متر با پشم سنگ یا پلی‌استایرن)` },
      { id: `dyn-${stageId}-t3`, category: 'technical', title: `کنترل اجرای بست‌های رادیکالی و میلگرد بستر گالوانیزه در هر دو یا سه رج` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `استفاده از شیلد صورت، عینک و دستکش چرمی حین جوشکاری و برشکاری قطعات وال‌پست` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `استقرار کپسول آتش‌نشانی در مجاورت محل نصب و جوشکاری وادارها` },
    ];
  }

  if (name.includes('خاکبرداری')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل رقوم عمق گود، پایش تغییر شکل دیواره‌های مجاور و گزارش ژئوتکنیک` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل اجرای مرحله‌ای سازه نگهبان و چاهک‌های پایه‌ها طبق نقشه مصوب` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `نصب نرده و حفاظ ایمنی مقاوم (حداقل ۹۰ سانتی‌متر) دور تا دور لبه گود` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `نصب چراغ هشدار چشمک‌زن شب و نردبان استاندارد ورود و خروج به گود` },
      { id: `dyn-${stageId}-s3`, category: 'safety', title: `ممنوعیت تجمع نخاله و بار متمرکز ماشین‌آلات سنگین در لبه بالایی گود` },
    ];
  }

  if (name.includes('فونداسیون') && !name.includes('بولت') && !name.includes('گروت')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل آکس‌بندی، رقوم مگر و تطابق ابعاد و آرماتورهای فونداسیون با نقشه` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل کاور بتن، اسپیسرهای استاندارد و مهار میلگردهای ریشه یا شابلون بولت‌ها` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `نصب کلاهک قارچی سر میلگردها و دستکش ضد برش برای آرماتوربندها` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `روشنایی کافی محوطه فونداسیون و کابل‌کشی استاندارد بارانی تابلو برق کارگاه` },
    ];
  }

  if (name.includes('تأسیسات')) {
    return [
      { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل تست فشار و آب‌بندی لوله‌ها، شیب‌بندی فاضلاب و لوله‌گذاری برق طبق نقشه` },
      { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل عدم شیارزنی افقی یا تخریب المان‌های سازه‌ای باربر جهت عبور لوله` },
      { id: `dyn-${stageId}-s1`, category: 'safety', title: `مهار کپسول‌های گاز، کلمپ شیلنگ‌ها و وجود کپسول آتش‌نشانی در کارگاه` },
      { id: `dyn-${stageId}-s2`, category: 'safety', title: `استفاده از کلید محافظ جان (RCD) و سیستم اتصال به زمین (ارت)` },
    ];
  }

  // چک‌لیست عمومی برای سایر مراحل (Finishing / General)
  return [
    { id: `dyn-${stageId}-t1`, category: 'technical', title: `کنترل تطابق کامل عملیات مرحله «${name}» با نقشه‌های مصوب و مباحث مقررات ملی ساختمان` },
    { id: `dyn-${stageId}-t2`, category: 'technical', title: `کنترل کیفیت مصالح مصرفی، رواداری‌ها و استانداردهای اجرایی در مرحله «${name}»` },
    { id: `dyn-${stageId}-s1`, category: 'safety', title: `رعایت الزامات مبحث ۱۲، استفاده از وسایل حفاظت فردی (PPE) و حفظ ایمنی کارگاه` },
    { id: `dyn-${stageId}-s2`, category: 'safety', title: `حفاظت از معابر تردد، پاکسازی مسیرها و رفع خطرات حادثه‌ساز در مرحله «${name}»` },
  ];
}
