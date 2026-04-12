/** Dosya girişini parse eder. Eski format (düz URL) ile yeni format ({ url, name }) her ikisini destekler. */
export function parseFileEntry(entry: string): { url: string; name: string } {
  try {
    const parsed = JSON.parse(entry);
    if (parsed && typeof parsed.url === "string") {
      return {
        url:  parsed.url,
        name: parsed.name ?? fallbackName(parsed.url),
      };
    }
  } catch {
    // Eski format: düz URL
  }
  return { url: entry, name: fallbackName(entry) };
}

function fallbackName(url: string): string {
  return decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "dosya");
}

/** Cross-origin URL'leri fetch edip blob olarak indirir. */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const res     = await fetch(url);
  const blob    = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href        = blobUrl;
  a.download    = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
