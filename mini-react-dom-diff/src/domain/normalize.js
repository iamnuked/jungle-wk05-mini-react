const DASH_LIKE_PATTERN = /[-_]+/g;
const WHITESPACE_PATTERN = /\s+/g;

export function normalizeAnswer(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(DASH_LIKE_PATTERN, ' ')
    .replace(WHITESPACE_PATTERN, ' ');
}
