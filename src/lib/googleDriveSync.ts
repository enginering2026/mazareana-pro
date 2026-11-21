// Google Drive Direct Phone Integration (Method 2 - Direct Native App)
// Mazareana Pro - المنظومة المالية
// Zero OAuth Errors, Zero 401 Unauthorized, Instant Native Android Drive Saving

export interface GoogleDriveState {
  lastBackupTime: string | null;
  lastBackupFileName: string | null;
  dailyReminderEnabled: boolean;
  totalBackupsCount: number;
}

const GDRIVE_STATE_KEY = 'gdrive_native_state_v1';
export const DEFAULT_GDRIVE_FOLDER_NAME = "مزارعنا برو - Google Drive";

export const getGoogleDriveState = (): GoogleDriveState => {
  try {
    const saved = localStorage.getItem(GDRIVE_STATE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error reading Google Drive state:", e);
  }
  return {
    lastBackupTime: localStorage.getItem('gdrive_last_sync_date') || null,
    lastBackupFileName: null,
    dailyReminderEnabled: true,
    totalBackupsCount: 0
  };
};

export const saveGoogleDriveState = (partial: Partial<GoogleDriveState>): GoogleDriveState => {
  const current = getGoogleDriveState();
  const updated = { ...current, ...partial };
  localStorage.setItem(GDRIVE_STATE_KEY, JSON.stringify(updated));
  return updated;
};

// Generates the comprehensive snapshot of all system financial data
export const generateSystemBackupData = (): { jsonString: string; fileName: string; meta: any } => {
  const keys = [
    'local_farms',
    'local_revenues',
    'local_expenses',
    'local_clients',
    'local_invoices',
    'local_partners',
    'local_payments',
    'local_expense_payments',
    'current_farm_id',
    'app_settings',
    'financial_settings'
  ];

  const backupData: Record<string, any> = {};
  keys.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        backupData[key] = JSON.parse(val);
      } catch {
        backupData[key] = val;
      }
    } else {
      backupData[key] = [];
    }
  });

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const fileName = `MazareanaPro_GoogleDrive_Backup_${dateStr}_${timeStr}.json`;

  const meta = {
    version: '2.5.0',
    appName: 'Mazareana Pro - مزارعنا برو',
    storageProvider: 'Google Drive App (الهاتف مباشرة)',
    syncTimestamp: now.toISOString(),
    recordsSummary: {
      farms: Array.isArray(backupData['local_farms']) ? backupData['local_farms'].length : 0,
      revenues: Array.isArray(backupData['local_revenues']) ? backupData['local_revenues'].length : 0,
      expenses: Array.isArray(backupData['local_expenses']) ? backupData['local_expenses'].length : 0,
      clients: Array.isArray(backupData['local_clients']) ? backupData['local_clients'].length : 0,
      invoices: Array.isArray(backupData['local_invoices']) ? backupData['local_invoices'].length : 0,
      partners: Array.isArray(backupData['local_partners']) ? backupData['local_partners'].length : 0,
    }
  };

  backupData['backup_meta'] = meta;
  const jsonString = JSON.stringify(backupData, null, 2);

  return { jsonString, fileName, meta };
};

// Method 2: Native Direct Google Drive Android App Intent
// Opens Google Drive's "Save to Drive" screen directly without any login / OAuth errors!
export const saveDirectlyToGoogleDriveNative = (onFallback?: () => void): boolean => {
  const { jsonString, fileName } = generateSystemBackupData();
  const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;

  const nowIso = new Date().toISOString();

  if (androidBridge && typeof androidBridge.saveDirectlyToGoogleDrive === "function") {
    androidBridge.saveDirectlyToGoogleDrive(fileName, jsonString);
    const state = getGoogleDriveState();
    saveGoogleDriveState({
      lastBackupTime: nowIso,
      lastBackupFileName: fileName,
      totalBackupsCount: state.totalBackupsCount + 1
    });
    localStorage.setItem('gdrive_last_sync_date', nowIso);
    return true;
  }

  // Fallback to sharing / download handler
  if (onFallback) {
    onFallback();
    saveGoogleDriveState({
      lastBackupTime: nowIso,
      lastBackupFileName: fileName
    });
    localStorage.setItem('gdrive_last_sync_date', nowIso);
    return true;
  }

  return false;
};

// Restores backup directly from chosen JSON file
export const restoreBackupFromFile = (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || !text.trim()) {
          resolve({ success: false, message: "ملف النسخة الاحتياطية فارغ!" });
          return;
        }

        const parsedData = JSON.parse(text);
        const source = (parsedData && typeof parsedData.data === 'object' && !Array.isArray(parsedData.data))
          ? parsedData.data
          : parsedData;

        const keys = [
          'local_farms',
          'local_revenues',
          'local_expenses',
          'local_clients',
          'local_invoices',
          'local_partners',
          'local_payments',
          'local_expense_payments',
          'current_farm_id',
          'app_settings',
          'financial_settings'
        ];

        const hasValidKey = keys.some(key => source[key] !== undefined);
        if (!hasValidKey) {
          resolve({ success: false, message: "ملف النسخة غير صالح أو لا يحتوي على بيانات للمشروع المالي" });
          return;
        }

        let restoredCount = 0;
        keys.forEach(key => {
          if (source[key] !== undefined && source[key] !== null) {
            const val = source[key];
            localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            restoredCount++;
          }
        });

        resolve({
          success: true,
          message: `تم استعادة النسخة بنجاح (${restoredCount} أقسام)!`,
          count: restoredCount
        });
      } catch (err: any) {
        resolve({ success: false, message: "فشل قراءة الملف. يرجى اختيار ملف JSON صالح." });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: "تعذر قراءة الملف المختار من جهازك" });
    };

    reader.readAsText(file);
  });
};

// Daily Backup Reminder Trigger (App Launch)
export const checkAndRunDailyGoogleDriveSync = async (): Promise<boolean> => {
  const state = getGoogleDriveState();
  if (!state.dailyReminderEnabled) return false;

  const lastSyncDate = state.lastBackupTime ? state.lastBackupTime.split('T')[0] : null;
  const today = new Date().toISOString().split('T')[0];

  if (lastSyncDate === today) {
    return true; // Already saved today
  }

  // Gentle reminder notification on mobile
  try {
    const { sendPhoneNotification } = await import("@/lib/notifications");
    sendPhoneNotification("تذكير Google Drive", "تذكير: لم تقم بحفظ نسخة احتياطية في Google Drive اليوم لحماية بياناتك.");
  } catch (e) {
    // Ignore notification errors
  }

  return true;
};
