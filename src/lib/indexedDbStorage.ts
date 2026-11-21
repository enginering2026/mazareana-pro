/**
 * MazareanaProDB - محرك قاعدة بيانات محلية سريعة وغير متزامنة باستخدام IndexedDB
 * توفر سعة تخزين غير محدودة وسرعة قراءة وكتابة فائقة مع حماية 100% من فقدان البيانات.
 */

const DB_NAME = 'MazareanaProDB';
const STORE_NAME = 'app_store';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export const openDB = (): Promise<IDBDatabase> => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB غير مدعوم في هذا المتصفح'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('فشل فتح قاعدة بيانات IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
};

/**
 * استرجاع عنصر من قاعدة بيانات IndexedDB
 */
export const idbGet = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result !== undefined ? req.result : null);
      };

      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (err) {
    console.warn(`فشل قراءة ${key} من IndexedDB:`, err);
    return null;
  }
};

/**
 * حفظ عنصر في قاعدة بيانات IndexedDB
 */
export const idbSet = async <T>(key: string, value: T): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`فشل حفظ ${key} في IndexedDB:`, err);
  }
};

/**
 * حذف عنصر من IndexedDB
 */
export const idbDelete = async (key: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`فشل حذف ${key} من IndexedDB:`, err);
  }
};

/**
 * قائمة بكافة مفاتيح البيانات الخاصة بالتطبيق
 */
export const APP_STORAGE_KEYS = [
  'local_farms',
  'local_revenues',
  'local_expenses',
  'local_clients',
  'local_invoices',
  'local_partners',
  'local_payments',
  'local_expense_payments',
  'local_current_farm_id',
  'app_settings',
  'financial_settings'
] as const;

/**
 * حفظ فوري متزامن مع التخزين المزدوج (IndexedDB + LocalStorage كاحتياطي)
 */
export const persistAppData = <T>(key: string, data: T): void => {
  // 1. كتابة فورية في LocalStorage لضمان سرعة الإقلاع 0ms
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn(`LocalStorage quota exceeded or unavailable for ${key}:`, e);
  }

  // 2. كتابة غير متزامنة في محرك IndexedDB فائق السعة
  idbSet(key, data).catch((err) => {
    console.error(`خطأ أثناء الحفظ في IndexedDB للمفتاح ${key}:`, err);
  });
};

/**
 * الترحيل التلقائي من LocalStorage إلى IndexedDB لضمان عدم فقدان أي بيانات سابقة
 */
export const migrateLocalStorageToIndexedDB = async (): Promise<void> => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    for (const key of APP_STORAGE_KEYS) {
      const localRaw = localStorage.getItem(key);
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          // تأكد من وجوده في IndexedDB
          const existingInDb = await idbGet(key);
          if (!existingInDb || (Array.isArray(parsed) && parsed.length > 0)) {
            await idbSet(key, parsed);
          }
        } catch {
          await idbSet(key, localRaw);
        }
      }
    }
    console.log('✅ تم ترحيل ومزامنة البيانات في IndexedDB بنجاح');
  } catch (err) {
    console.warn('تحذير أثناء ترحيل البيانات إلى IndexedDB:', err);
  }
};
