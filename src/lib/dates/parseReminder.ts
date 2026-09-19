import * as chrono from 'chrono-node';

export interface ParsedReminderResult {
  success: boolean;
  title: string;
  dueDate: Date | null;
  dueTimestamp: number | null;
  dueDateFormatted: string;
  isAmbiguous: boolean;
  rawMatchedText?: string;
  error?: string;
}

/**
 * Deterministically parses natural language reminder input using chrono-node.
 * Example: "Remind me tomorrow at 7 PM to pay electricity bill"
 * -> Title: "Pay electricity bill"
 * -> DueDate: Tomorrow at 19:00
 */
export function parseReminderInput(input: string, referenceDate: Date = new Date()): ParsedReminderResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      success: false,
      title: '',
      dueDate: null,
      dueTimestamp: null,
      dueDateFormatted: '',
      isAmbiguous: false,
      error: 'Please enter what you would like Saathi to remind you about.',
    };
  }

  // Parse using chrono
  const parsedResults = chrono.parse(trimmed, referenceDate, { forwardDate: true });

  if (!parsedResults || parsedResults.length === 0) {
    // No date found in input - title is the input itself, date needs to be specified
    return {
      success: false,
      title: cleanTitle(trimmed),
      dueDate: null,
      dueTimestamp: null,
      dueDateFormatted: '',
      isAmbiguous: true,
      error: 'No specific time or date recognized. Please pick a time below.',
    };
  }

  // Take the primary parsed result
  const primary = parsedResults[0];
  const parsedDate = primary.start.date();

  // If time was not explicitly stated (e.g. "tomorrow"), default to 09:00 AM rather than midnight
  if (!primary.start.isCertain('hour')) {
    parsedDate.setHours(9, 0, 0, 0);
  }

  // Clean out the date phrase and common prompt prefixes from title
  let cleanedTitle = trimmed;
  cleanedTitle = cleanedTitle.replace(primary.text, ' ');
  cleanedTitle = cleanTitle(cleanedTitle);

  // If title became empty (e.g. user just typed "tomorrow at 5pm")
  if (!cleanedTitle) {
    cleanedTitle = 'Reminder';
  }

  // Format the date nicely for senior citizen reading
  const formatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(parsedDate);

  // Check if date is in the past
  const now = referenceDate.getTime();
  const isPast = parsedDate.getTime() < now;

  return {
    success: !isPast,
    title: cleanedTitle,
    dueDate: parsedDate,
    dueTimestamp: parsedDate.getTime(),
    dueDateFormatted: formatted,
    isAmbiguous: isPast || !primary.start.isCertain('hour'),
    rawMatchedText: primary.text,
    error: isPast ? 'This time has already passed. Please choose an upcoming time.' : undefined,
  };
}

function cleanTitle(str: string): string {
  let res = str;
  // Remove "remind me to", "remind me", "reminder to", "to ", etc.
  res = res.replace(/^(please\s+)?remind(\s+me)?(\s+to)?\s+/i, '');
  res = res.replace(/^to\s+/i, '');
  res = res.replace(/\s+at\s*$/i, '');
  res = res.replace(/\s+on\s*$/i, '');
  res = res.replace(/\s+/g, ' ').trim();

  // Capitalize first letter
  if (res.length > 0) {
    res = res.charAt(0).toUpperCase() + res.slice(1);
  }
  return res;
}
