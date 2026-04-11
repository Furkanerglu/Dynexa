"use client";

import { useState, useEffect } from "react";

export function useImagePreloader(frameCount: number = 40) {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded: HTMLImageElement[] = [];
    let loadedCount = 0;

    const frameImages = Array.from({ length: frameCount }, (_, i) => {
      const num = String(i + 1).padStart(3, "0");
      return `/animated-image-printer/printer_frame_${num}.jpg`;
    });

    frameImages.forEach((src, index) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        loaded[index] = img;
        setProgress(Math.round((loadedCount / frameCount) * 100));
        if (loadedCount === frameCount) {
          setImages(loaded);
          setIsLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        setProgress(Math.round((loadedCount / frameCount) * 100));
        if (loadedCount === frameCount) {
          setImages(loaded);
          setIsLoaded(true);
        }
      };
      img.src = src;
    });
  }, [frameCount]);

  return { images, progress, isLoaded };
}
