// Riot IDs are "Name#TAG" and can contain characters that are invalid in a
// filename on any of Windows/macOS/Linux — strip/replace rather than assume
// a summoner name is filesystem-safe as-is.
function sanitizeForFileName(input: string): string {
  return input
    .replace(/#/g, '-')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildExportFileName(
  summonerName: string,
  extension: 'png' | 'pdf',
  date: Date = new Date(),
): string {
  return `OracleLens_${sanitizeForFileName(summonerName)}_${formatLocalDate(date)}.${extension}`;
}
