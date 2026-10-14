import { ProjectItem, ProjectStage, InspectionReportItem } from '../types/project';
import { toPersianDigits } from './formatters';

function executePrintHtml(title: string, htmlContent: string): void {
  try {
    // Primary: use an invisible iframe to print cleanly without popup blockers
    let printIframe = document.getElementById('print-iframe-helper') as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'print-iframe-helper';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);
    }

    const doc = printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        printIframe?.contentWindow?.focus();
        printIframe?.contentWindow?.print();
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('Iframe printing fallback to window.open', err);
  }

  // Fallback to window.open
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

/**
 * Generates an official printable HTML document for a single Inspection Report
 */
export function printInspectionReport(report: InspectionReportItem): void {
  const htmlContent = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>گزارش بازدید - ${report.reportNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      line-height: 1.8;
      font-size: 13px;
    }
    .page-border {
      border: 2px solid #1e293b;
      padding: 25px;
      min-height: 95vh;
      box-sizing: border-box;
      position: relative;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 15px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-titles { text-align: center; flex-grow: 1; }
    .header-titles h1 { font-size: 16px; margin: 0 0 5px 0; color: #0f172a; }
    .header-titles h2 { font-size: 13px; margin: 0; color: #475569; }
    .header-meta { font-size: 11px; line-height: 1.6; color: #334155; text-align: left; min-width: 140px; }
    .content-box {
      white-space: pre-wrap;
      font-family: inherit;
      font-size: 13px;
      line-height: 2;
      color: #0f172a;
      margin: 20px 0;
      text-align: justify;
      font-weight: bold;
    }
    .user-report-box {
      border: 2px solid #0f172a;
      background: #f8fafc;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 16px 0;
      page-break-inside: avoid;
    }
    .user-report-title {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .user-report-text {
      font-size: 14px;
      font-weight: 800;
      color: #000000;
      line-height: 2.1;
      white-space: pre-wrap;
      text-align: justify;
    }
    .footer-signatures {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      padding: 0 30px;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      min-width: 180px;
      border-top: 1px dashed #94a3b8;
      padding-top: 10px;
      font-weight: bold;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="page-border">
    <div class="header">
      <div style="width: 140px;">
        <span style="font-size: 10px; color: #64748b;">سامانه هوشمند مجریان</span>
      </div>
      <div class="header-titles">
        <h1>سازمان نظام مهندسی ساختمان</h1>
        <h2>برگه رسمی گزارش و صورت‌جلسه بازدید کارگاهی</h2>
      </div>
      <div class="header-meta">
        <div><strong>شماره گزارش:</strong> ${toPersianDigits(report.reportNumber)}</div>
        <div><strong>تاریخ بازدید:</strong> ${toPersianDigits(report.date)}</div>
        <div><strong>مرحله:</strong> ${report.stageName}</div>
      </div>
    </div>

    <!-- بخش مشخصات گزارش -->
    <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 11.5px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
      <div><strong>موضوع گزارش:</strong> ${report.summary}</div>
      <div><strong>مرحله ساختمانی:</strong> ${report.stageName}</div>
      <div><strong>تاریخ رویت کارگاه:</strong> ${toPersianDigits(report.date)}</div>
    </div>

    <!-- متن و شرح گزارش ثبت‌شده توسط کاربر (کاملاً بولد) -->
    <div class="user-report-box">
      <div class="user-report-title">
        متن و شرح گزارش بازدید (مشاهدات، وضعیت و دستورکار مهندس):
      </div>
      <div class="user-report-text">${report.generalNotes || report.fullReportText}</div>
    </div>

    ${report.generalNotes && report.fullReportText !== report.generalNotes ? `
    <div style="font-size: 11px; color: #475569; margin: 12px 0; white-space: pre-wrap; line-height: 1.8; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
      <div style="font-weight: bold; margin-bottom: 4px; color: #334155;">متن ابلاغیه رسمی:</div>
${report.fullReportText}
    </div>
    ` : ''}

    ${report.images && report.images.length > 0 ? `
    <div style="margin: 20px 0; page-break-inside: avoid;">
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
        تصاویر مستند بازدید کارگاهی (${toPersianDigits(report.images.length)} عکس پیوست):
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        ${report.images.map((img, i) => `
          <div style="border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden; width: 140px; height: 110px; text-align: center; background: #f8fafc;">
            <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" alt="تصویر ${i + 1}" />
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="footer-signatures">
      <div class="sig-box">
        <div>مهندس مجری ذی‌صلاح پروژه</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">مهر و امضاء</div>
      </div>
      <div class="sig-box">
        <div>کارفرما / نماینده اجرایی کارگاه</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">امضاء و تاریخ رویت</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  executePrintHtml(`گزارش بازدید - ${report.reportNumber}`, htmlContent);
}

/**
 * Generates an official comprehensive final report for the entire project
 * شامل سوابق کلی پروژه، آمار، تمام گزارش‌های بازدید، نقص‌های ثبت‌شده و اصلاح‌شده
 */
export function printComprehensiveProjectReport(
  project: ProjectItem,
  stages: ProjectStage[]
): void {
  const reports = project.reports || [];
  const discrepancies = project.discrepancies || [];
  const totalStages = stages.length;
  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const fixedDiscs = discrepancies.filter((d) => d.status === 'fixed' || d.status === 'verified').length;
  const openDiscs = discrepancies.filter((d) => d.status === 'open').length;

  // Determine current active stage name
  const currentStage = stages.find((s) => s.id === (project.currentStageId || 1))
    || stages.find((s) => s.status === 'in_progress')
    || stages[0];
  const currentStageName = project.projectStatus === 'completed' || (completedStages === totalStages && totalStages > 0)
    ? 'اتمام کل مراحل پروژه'
    : (currentStage?.name || `مرحله ${toPersianDigits(project.currentStageId || 1)}`);

  const reportsRows = reports.length > 0
    ? reports.map((r, i) => `
      <tr style="page-break-inside: avoid !important; break-inside: avoid !important;">
        <td style="text-align: center; vertical-align: top;">${toPersianDigits(i + 1)}</td>
        <td style="text-align: center; font-family: monospace; vertical-align: top;">${toPersianDigits(r.date)}</td>
        <td style="vertical-align: top;"><strong>${r.stageName}</strong></td>
        <td style="vertical-align: top;">${r.summary || 'بازدید نظارتی'}</td>
        <td style="font-size: 12px; line-height: 1.8; text-align: justify; font-weight: 800; color: #000000; vertical-align: top;">
          <div style="font-size: 11px; font-weight: 900; color: #0f172a; margin-bottom: 3px;">متن و شرح گزارش مهندس:</div>
          <div style="font-weight: 800; font-size: 12.5px; color: #000000; line-height: 1.8;">
            ${r.generalNotes || r.fullReportText}
          </div>
          ${r.images && r.images.length > 0 ? `
            <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
              ${r.images.map((img) => `<img src="${img}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1.5px solid #0f172a;" alt="عکس مستند" />`).join('')}
            </div>
          ` : ''}
        </td>
      </tr>
    `).join('')
    : `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 12px;">هیچ گزارش بازدیدی ثبت نشده است.</td></tr>`;

  const discrepanciesRows = discrepancies.length > 0
    ? discrepancies.map((d, i) => `
      <tr style="page-break-inside: avoid !important; break-inside: avoid !important;">
        <td style="text-align: center; vertical-align: top;">${toPersianDigits(i + 1)}</td>
        <td style="vertical-align: top;"><strong>${d.title}</strong></td>
        <td style="text-align: center; vertical-align: top;">${d.floor || '-'} / ${d.location || '-'}</td>
        <td style="font-size: 11px; line-height: 1.6; vertical-align: top;">${d.description}</td>
        <td style="text-align: center; font-family: monospace; vertical-align: top;">${toPersianDigits(d.date)}</td>
        <td style="text-align: center; vertical-align: top;">
          ${
            d.status === 'verified'
              ? '<span style="color: #15803d; font-weight: bold;">تأیید نهایی و رفع شد</span>'
              : d.status === 'fixed'
              ? '<span style="color: #0369a1; font-weight: bold;">اصلاح شد</span>'
              : '<span style="color: #b91c1c; font-weight: bold;">رفع‌نشده (جاری)</span>'
          }
        </td>
      </tr>
    `).join('')
    : `<tr><td colspan="6" style="text-align: center; color: #15803d; padding: 12px; font-weight: bold;">در طول اجرای این پروژه مغایرتی ثبت نشده است.</td></tr>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>گزارش کلی و جامع پروژه - ${project.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 15mm 10mm;
    }
    body {
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.6;
      font-size: 11.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .report-wrapper {
      width: 100%;
      box-sizing: border-box;
      padding: 5px 0;
    }
    .header {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .header-titles { text-align: center; flex-grow: 1; }
    .header-titles h1 { font-size: 16px; font-weight: 900; margin: 0 0 4px 0; color: #0f172a; }
    .header-titles h2 { font-size: 12.5px; margin: 0; color: #475569; font-weight: bold; }
    .header-meta { font-size: 11px; line-height: 1.6; color: #334155; text-align: left; }
    
    .section-title {
      font-size: 12.5px;
      font-weight: 800;
      background: #f1f5f9;
      padding: 6px 10px;
      border-right: 4px solid #0f172a;
      margin: 16px 0 8px 0;
      color: #0f172a;
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      background: #f8fafc;
      padding: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 11px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .stats-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin: 12px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .stat-card {
      flex: 1;
      padding: 7px 6px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      text-align: center;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .stat-val { font-size: 13.5px; font-weight: bold; color: #0f172a; }
    .stat-lbl { font-size: 10px; color: #64748b; margin-top: 2px; }

    /* Anti-split table rules */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 16px;
      font-size: 11px;
      page-break-inside: auto;
      break-inside: auto;
    }
    thead {
      display: table-header-group; /* Repeats table header neatly at top of each continuation page */
    }
    tfoot {
      display: table-footer-group;
    }
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: auto;
      break-after: auto;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      vertical-align: top;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    th {
      background: #e2e8f0 !important;
      color: #0f172a;
      font-weight: 800;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tr:nth-child(even) { background: #f8fafc; }

    .footer-signatures {
      margin-top: 35px;
      display: flex;
      justify-content: space-between;
      padding: 0 40px;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .sig-box {
      text-align: center;
      min-width: 180px;
      border-top: 1px dashed #475569;
      padding-top: 8px;
      font-weight: bold;
      font-size: 11.5px;
    }
  </style>
</head>
<body>
  <div class="report-wrapper">
    <div class="header">
      <div style="width: 120px;">
        <span style="font-size: 10px; color: #64748b;">سامانه پرونده مهندسی</span>
      </div>
      <div class="header-titles">
        <h1>انجمن مجریان ذیصلاح ارومیه</h1>
        <h2>شناسنامه و گزارش کلی و جامع سوابق پروژه</h2>
      </div>
      <div class="header-meta">
        <div><strong>وضعیت پروژه:</strong> ${project.projectStatus === 'completed' ? 'تکمیل‌شده قطعی' : 'در حال اجرا'}</div>
        <div><strong>تاریخ استخراج:</strong> ${toPersianDigits(new Date().toLocaleDateString('fa-IR'))}</div>
      </div>
    </div>

    <!-- مشخصات پروژه -->
    <div class="section-title">۱. مشخصات فنی، حقوقی و عوامل پروژه</div>
    <div class="info-grid">
      <div>نام پروژه: <strong>${project.name}</strong></div>
      <div>شماره پروانه: <strong>${toPersianDigits(project.licenseNumber || '-')}</strong></div>
      <div>شماره قرارداد: <strong>${toPersianDigits(project.contractNumber || '-')}</strong></div>

      <div>کارفرما: <strong>${project.employerName || 'نامشخص'}</strong></div>
      <div>مهندس ناظر: <strong>${project.supervisorName || 'نامشخص'}</strong></div>
      <div>مهندس مجری: <strong>${project.userId}</strong></div>

      <div>نوع سازه: <strong>${project.structureType}</strong></div>
      <div>تعداد طبقات: <strong>${toPersianDigits(project.floorsCount)} طبقه</strong></div>
      <div>متراژ زیربنا: <strong>${toPersianDigits(project.totalArea || '-')} مترمربع</strong></div>

      <div style="grid-column: span 3;">آدرس کارگاه: <strong>${project.address || 'ثبت نشده'}</strong></div>
    </div>

    <!-- آمار شاخص‌ها -->
    <div class="stats-row">
      <div class="stat-card" style="flex: 1.6;">
        <div class="stat-val" style="font-size: 11.5px; font-weight: 800; font-family: inherit; color: #0f172a; white-space: normal; line-height: 1.35; padding: 2px 4px;">
          ${currentStageName}
        </div>
        <div class="stat-lbl">مرحله در حال اجرا</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${toPersianDigits(Math.round((completedStages / (totalStages || 1)) * 100))}٪</div>
        <div class="stat-lbl">پیشرفت فیزیکی کل</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${toPersianDigits(reports.length)}</div>
        <div class="stat-lbl">کل گزارش‌های بازدید</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: #15803d;">${toPersianDigits(fixedDiscs)}</div>
        <div class="stat-lbl">نقص‌های رفع‌شده</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color: ${openDiscs > 0 ? '#b91c1c' : '#15803d'};">${toPersianDigits(openDiscs)}</div>
        <div class="stat-lbl">نقص‌های باز / رفع‌نشده</div>
      </div>
    </div>

    <!-- سوابق بازدیدها -->
    <div class="section-title">۲. سوابق گزارش‌های بازدیدهای کارگاهی</div>
    <table>
      <thead>
        <tr>
          <th style="width: 35px;">ردیف</th>
          <th style="width: 80px;">تاریخ</th>
          <th style="width: 140px;">مرحله کارگاهی</th>
          <th style="width: 130px;">عنوان بازدید</th>
          <th>شرح اقدامات و مشاهدات مهندس</th>
        </tr>
      </thead>
      <tbody>
        ${reportsRows}
      </tbody>
    </table>

    <!-- سوابق نقص‌ها و مغایرت‌ها -->
    <div class="section-title">۳. سوابق نقص‌ها و مغایرت‌های فنی و وضعیت رفع آن‌ها</div>
    <table>
      <thead>
        <tr>
          <th style="width: 35px;">ردیف</th>
          <th style="width: 130px;">موضوع نقص</th>
          <th style="width: 100px;">طبقه / محل</th>
          <th>شرح دقیق مغایرت</th>
          <th style="width: 80px;">تاریخ ثبت</th>
          <th style="width: 110px;">وضعیت اصلاح</th>
        </tr>
      </thead>
      <tbody>
        ${discrepanciesRows}
      </tbody>
    </table>

    <!-- امضاء و مهر -->
    <div class="footer-signatures">
      <div class="sig-box">
        <div>مهندس مجری ذی‌صلاح</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">مهر و امضاء رسمی</div>
      </div>
      <div class="sig-box">
        <div>مهندس ناظر هماهنگ‌کننده</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">مهر و امضاء رسمی</div>
      </div>
      <div class="sig-box">
        <div>کارفرمای پروژه</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">امضاء و تاریخ رویت</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  executePrintHtml(`گزارش کلی پروژه - ${project.name}`, htmlContent);
}
