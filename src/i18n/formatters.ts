import { SupportedLanguage } from './config';

/**
 * Locale-aware date and time formatting using standard browser Intl APIs.
 */
export function formatLocaleDate(
  dateOrTimestamp: Date | number,
  locale: SupportedLanguage,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }
): string {
  try {
    const d = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch (err) {
    console.warn('formatLocaleDate failed, falling back to English:', err);
    return new Date(dateOrTimestamp).toLocaleString();
  }
}

/**
 * Relative day label (e.g. Today / Tomorrow / in X days) in locale
 */
export function formatRelativeLocaleDay(
  timestamp: number,
  locale: SupportedLanguage
): string {
  const now = new Date();
  const target = new Date(timestamp);

  const isToday =
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    tomorrow.getFullYear() === target.getFullYear() &&
    tomorrow.getMonth() === target.getMonth() &&
    tomorrow.getDate() === target.getDate();

  const timeStr = formatLocaleDate(timestamp, locale, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const RELATIVE_LABELS: Record<SupportedLanguage, { today: string; tomorrow: string }> = {
    'en-IN': { today: 'Today', tomorrow: 'Tomorrow' },
    'hi-IN': { today: 'आज', tomorrow: 'कल' },
    'pa-IN': { today: 'ਅੱਜ', tomorrow: 'ਭਲਕੇ (ਕੱਲ੍ਹ)' },
    'bn-IN': { today: 'আজ', tomorrow: 'আগামীকাল' },
    'mr-IN': { today: 'आज', tomorrow: 'उद्या' },
    'gu-IN': { today: 'આજે', tomorrow: 'આવતીકાલે' },
    'ta-IN': { today: 'இன்று', tomorrow: 'நாளை' },
    'te-IN': { today: 'ఈ రోజు', tomorrow: 'రేపు' },
  };

  const labels = RELATIVE_LABELS[locale] || RELATIVE_LABELS['en-IN'];

  if (isToday) {
    return `${labels.today}, ${timeStr}`;
  }
  if (isTomorrow) {
    return `${labels.tomorrow}, ${timeStr}`;
  }

  return formatLocaleDate(timestamp, locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
