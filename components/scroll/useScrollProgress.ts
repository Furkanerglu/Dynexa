"use client";

// Bu hook artık kullanılmıyor.
// PrinterCanvas section-snap sistemine geçti — wheel/touch event ile
// her gesture bir section'a atlar, useScrollProgress'e gerek kalmadı.

export function useScrollProgress(
  _containerRef: React.RefObject<HTMLElement | null>
): number {
  return 0;
}
