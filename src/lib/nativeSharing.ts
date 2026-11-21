import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Shares a file natively on Android/iOS, or runs a browser fallback download.
 * @param fileName The name of the file (e.g. 'backup.json' or 'invoice.pdf')
 * @param base64Data The file content as a Base64 string (without the data URI prefix)
 * @param fallbackFn The browser fallback download function
 */
export const shareFileNatively = async (
  fileName: string,
  base64Data: string,
  fallbackFn: () => void
) => {
  // 1. AndroidBridge Direct Native Handler (Fastest & most reliable on Android)
  const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
  if (androidBridge && typeof androidBridge.saveBackupFile === "function") {
    try {
      const decodedData = decodeURIComponent(escape(atob(base64Data)));
      const ok = androidBridge.saveBackupFile(fileName, decodedData);
      if (ok) return;
    } catch (e) {
      console.warn("AndroidBridge save failed, trying Capacitor/Web...", e);
    }
  }

  // 2. Capacitor native platform
  if (Capacitor.isNativePlatform()) {
    try {
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      await Share.share({
        title: fileName,
        url: writeResult.uri
      });
      return;
    } catch (error: any) {
      console.error("Native sharing failed, falling back to browser download...", error);
      fallbackFn();
    }
  } else {
    // 3. Web browser fallback
    fallbackFn();
  }
};
