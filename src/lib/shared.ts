/**
 * Shared utilities and constants used across multiple pages.
 */

/** Type-safe sum helper. */
export function sumBy<T>(items: T[], getter: (item: T) => number): number {
  return items.reduce((total, item) => total + getter(item), 0);
}

/**
 * Triggers a browser file download for the given Blob.
 * Handles object URL lifecycle (create → click → revoke).
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Shared Recharts tooltip style using design tokens. */
export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
};
