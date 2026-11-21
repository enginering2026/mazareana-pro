// Local Automatic Backup System with Destination Folder Selection & Old Version Replacement
// Mazareana Pro - المنظومة المالية

import { generateSystemBackupData } from "@/lib/googleDriveSync";
import { toast } from "sonner";
import { sendPhoneNotification } from "@/lib/notifications";

export interface LocalAutoBackupState {
  enabled: boolean;
  folderName: string | null;
  folderUri: string | null;
  lastBackupTime: string | null;
  lastBackupFileName: string | null;
  lastBackupSize: number | null;
  deletedOldCount: number;
  isVerified: boolean;
}

const STORAGE_KEY = "local_auto_backup_config_v1";

export const getLocalAutoBackupState = (): LocalAutoBackupState => {
  let state: LocalAutoBackupState = {
    enabled: true,
    folderName: null,
    folderUri: null,
    lastBackupTime: null,
    lastBackupFileName: null,
    lastBackupSize: null,
    deletedOldCount: 0,
    isVerified: false
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = { ...state, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error reading local auto-backup state:", e);
  }

  // Check AndroidBridge native status if running inside Android app
  try {
    const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
    if (androidBridge && typeof androidBridge.getAutoBackupFolderInfo === "function") {
      const infoStr = androidBridge.getAutoBackupFolderInfo();
      if (infoStr) {
        const info = JSON.parse(infoStr);
        if (info.hasFolder && info.folderName) {
          state.folderName = info.folderName;
          state.folderUri = info.folderUri || state.folderUri;
          if (info.lastBackupTimestamp > 0) {
            state.lastBackupTime = new Date(info.lastBackupTimestamp).toISOString();
            state.lastBackupFileName = info.lastBackupFile || state.lastBackupFileName;
            state.lastBackupSize = info.lastBackupSize || state.lastBackupSize;
            state.isVerified = true;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not sync with native folder info:", e);
  }

  return state;
};

export const saveLocalAutoBackupState = (partial: Partial<LocalAutoBackupState>): LocalAutoBackupState => {
  const current = getLocalAutoBackupState();
  const updated: LocalAutoBackupState = { ...current, ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// Opens Android Folder Picker (Storage Access Framework) to select destination folder
export const pickLocalBackupFolder = (): Promise<{ success: boolean; folderName?: string; folderUri?: string; message: string }> => {
  return new Promise((resolve) => {
    const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;

    // 1. Android Native Bridge with Storage Access Framework (SAF)
    if (androidBridge && typeof androidBridge.chooseBackupFolder === "function") {
      // Setup one-shot listener
      (window as any).onAutoBackupFolderSelected = (folderName: string | null, folderUri: string | null) => {
        delete (window as any).onAutoBackupFolderSelected;
        if (folderName && folderUri) {
          saveLocalAutoBackupState({
            folderName,
            folderUri,
            enabled: true
          });
          resolve({
            success: true,
            folderName,
            folderUri,
            message: `تم اختيار المجلد بنجاح: ${folderName}`
          });
        } else {
          resolve({
            success: false,
            message: "تم إلغاء اختيار المجلد"
          });
        }
      };

      androidBridge.chooseBackupFolder();
      return;
    }

    // 2. Web Browser Fallback: File System Access API (showDirectoryPicker)
    if (typeof (window as any).showDirectoryPicker === "function") {
      (window as any).showDirectoryPicker({ mode: "readwrite" })
        .then((dirHandle: any) => {
          const folderName = dirHandle.name || "المجلد المختار";
          saveLocalAutoBackupState({
            folderName,
            folderUri: "browser_fs_handle",
            enabled: true
          });
          (window as any).__lastDirHandle = dirHandle;
          resolve({
            success: true,
            folderName,
            folderUri: "browser_fs_handle",
            message: `تم اختيار المجلد بنجاح: ${folderName}`
          });
        })
        .catch((err: any) => {
          resolve({
            success: false,
            message: err?.name === "AbortError" ? "تم إلغاء اختيار المجلد" : `تعذر اختيار المجلد: ${err?.message || ""}`
          });
        });
      return;
    }

    resolve({
      success: false,
      message: "ميزة اختيار المجلد المباشر تتطلب تطبيق الهاتف الرسمي أو متصفح يدعم اختيار المجلدات."
    });
  });
};

// Executes the backup: Deletes the old backup file, writes the new backup file, and verifies it
export const executeLocalAutoBackup = async (isManual = false): Promise<{
  success: boolean;
  message: string;
  fileName?: string;
  folderName?: string;
  deletedOldCount?: number;
  size?: number;
}> => {
  const state = getLocalAutoBackupState();

  if (!state.folderName && !state.folderUri) {
    return {
      success: false,
      message: "يرجى اختيار مجلد النسخ الاحتياطي أولاً!"
    };
  }

  const { jsonString, fileName } = generateSystemBackupData();
  const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;

  // 1. Android Native SAF Execution
  if (androidBridge && typeof androidBridge.performAutoBackup === "function") {
    try {
      const resStr = androidBridge.performAutoBackup(jsonString, fileName);
      if (!resStr) {
        throw new Error("لم يتم استلام رد من النظام");
      }

      const res = JSON.parse(resStr);
      if (res.success) {
        const nowIso = new Date().toISOString();
        saveLocalAutoBackupState({
          lastBackupTime: nowIso,
          lastBackupFileName: res.fileName || fileName,
          lastBackupSize: res.size || jsonString.length,
          deletedOldCount: res.deletedOldCount || 0,
          isVerified: true
        });

        return {
          success: true,
          message: `✅ تم حفظ النسخة الجديدة (${((res.size || jsonString.length) / 1024).toFixed(1)} ك.ب) وحذف النسخة السابقة بنجاح في مجلد: ${res.folderName || state.folderName}`,
          fileName: res.fileName || fileName,
          folderName: res.folderName || state.folderName,
          deletedOldCount: res.deletedOldCount || 0,
          size: res.size || jsonString.length
        };
      } else {
        return {
          success: false,
          message: res.message || "فشل تنفيذ النسخ الاحتياطي في المجلد المختار"
        };
      }
    } catch (e: any) {
      console.error("Local auto-backup native execution error:", e);
      return {
        success: false,
        message: e?.message || "حدث خطأ أثناء حفظ النسخة في المجلد"
      };
    }
  }

  // 2. Web Browser showDirectoryPicker Fallback
  if ((window as any).__lastDirHandle) {
    try {
      const dirHandle = (window as any).__lastDirHandle;

      // Delete old backup files in the directory handle
      let deletedCount = 0;
      try {
        for await (const [name, handle] of (dirHandle as any).entries()) {
          if (handle.kind === "file" && (name.startsWith("MazareanaPro_AutoBackup_") || name.startsWith("المشروع_المالي_نسخة_تلقائية_"))) {
            await dirHandle.removeEntry(name);
            deletedCount++;
          }
        }
      } catch (err) {
        console.warn("Could not list or remove old entries:", err);
      }

      // Create new file
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();

      const createdFile = await fileHandle.getFile();
      const fileSize = createdFile.size;

      const nowIso = new Date().toISOString();
      saveLocalAutoBackupState({
        lastBackupTime: nowIso,
        lastBackupFileName: fileName,
        lastBackupSize: fileSize,
        deletedOldCount: deletedCount,
        isVerified: true
      });

      return {
        success: true,
        message: `✅ تم حفظ النسخة الجديدة في مجلد (${state.folderName}) وحذف النسخة السابقة بنجاح`,
        fileName,
        folderName: state.folderName || "المجلد المختار",
        deletedOldCount: deletedCount,
        size: fileSize
      };
    } catch (err: any) {
      return {
        success: false,
        message: `تعذر الكتابة في المجلد: ${err?.message || ""}`
      };
    }
  }

  return {
    success: false,
    message: "تطبيق الهاتف غير متاح لتنفيذ النسخ المحلي المباشر"
  };
};

// Check and trigger scheduled background local auto-backup on app launch
export const checkAndRunScheduledLocalAutoBackup = async (): Promise<boolean> => {
  const state = getLocalAutoBackupState();

  // If feature is disabled or no folder is chosen yet, do nothing
  if (!state.enabled || !state.folderName) {
    return false;
  }

  const today = new Date().toISOString().split("T")[0];
  const lastDate = state.lastBackupTime ? state.lastBackupTime.split("T")[0] : null;

  // If already backed up today, skip
  if (lastDate === today) {
    return true;
  }

  try {
    const res = await executeLocalAutoBackup(false);
    if (res.success) {
      console.log("[LocalAutoBackup] Scheduled daily auto-backup completed successfully:", res.fileName);
      sendPhoneNotification("النسخ الاحتياطي التلقائي", `تم تحديث النسخة الاحتياطية بنجاح وحذف السابقة في مجلد: ${res.folderName}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error("[LocalAutoBackup] Scheduled auto-backup failed:", err);
    return false;
  }
};

// Clears the selected folder and resets config
export const resetLocalBackupFolder = () => {
  try {
    const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
    if (androidBridge && typeof androidBridge.clearAutoBackupFolder === "function") {
      androidBridge.clearAutoBackupFolder();
    }
  } catch (e) {
    console.warn("Could not clear native folder:", e);
  }

  saveLocalAutoBackupState({
    folderName: null,
    folderUri: null,
    lastBackupTime: null,
    lastBackupFileName: null,
    lastBackupSize: null,
    deletedOldCount: 0,
    isVerified: false
  });
};
