/**
 * Client-side Image Compression Utility
 * فشرده‌ساز تصاویر سمت کلاینت برای جلوگیری از سنگین شدن برنامه و دیتابیس
 * - تغییر اندازه حداکثر به ۱۲۰۰ پیکسل
 * - فشرده‌سازی با کیفیت بهینه JPEG (کاهش حجم از ۲۰ مگابایت به کمتر از ۲۰۰ کیلوبایت)
 */

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
}

export function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const maxDimension = options.maxDimension || 1200;
  const quality = options.quality ?? 0.72;

  return new Promise((resolve, reject) => {
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('فایل انتخاب‌شده تصویر نیست.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('خطا در بارگذاری تصویر'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize while maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('عدم دسترسی به بوم پردازش تصویر'));
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
