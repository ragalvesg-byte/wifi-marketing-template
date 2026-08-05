/**
 * Helper utility to map aspect ratio values to standard CSS aspect-ratio strings.
 */
export function getAspectRatioValue(ratio?: string | null): string {
  if (!ratio) return '16 / 9';
  const cleanRatio = ratio.trim();
  if (cleanRatio === '1:1') return '1 / 1';
  if (cleanRatio === '4:5') return '4 / 5';
  if (cleanRatio === '9:16') return '9 / 16';
  if (cleanRatio === '16:9') return '16 / 9';
  return '16 / 9'; // fallback for 'custom/horizontal'
}
