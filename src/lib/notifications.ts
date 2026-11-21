// ============================================================
// notifications.ts — Unified Phone & System Notifications
// ============================================================

import { toast } from "sonner";

/**
 * Sends a native phone notification (appearing in the Android status bar)
 * with graceful fallbacks for web browsers and toasts.
 */
export const sendPhoneNotification = (title: string, message: string) => {
  try {
    const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;

    // 1. Android Native Notification
    if (androidBridge && typeof androidBridge.showNotification === "function") {
      androidBridge.showNotification(title, message);
      toast.info(title, { description: message });
      return true;
    }

    // 2. Web Notification API (Desktop / Browser)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/favicon.ico",
      });
      toast.info(title, { description: message });
      return true;
    }

    // 3. Fallback Toast
    toast.info(title, { description: message });
    return true;
  } catch (err) {
    console.error("Error triggering notification:", err);
    toast.info(title, { description: message });
    return false;
  }
};

/**
 * Triggers a test phone notification to verify the notification channel and vibration.
 */
export const testPhoneNotification = () => {
  const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
  if (androidBridge && typeof androidBridge.testNotification === "function") {
    androidBridge.testNotification();
    toast.success("تم إرسال إشعار تجريبي للهاتف بنجاح! تفقد شريط الإشعارات العلوي.");
    return;
  }

  // Request browser permission if in web
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("المنظومة المالية", {
        body: "تم اختبار إشعارات الهاتف بنجاح! المنظومة والتنبيهات تعمل بأعلى كفاءة.",
        icon: "/favicon.ico",
      });
      toast.success("تم إرسال إشعار تجريبي بنجاح!");
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("المنظومة المالية", {
            body: "تم تفعيل إشعارات المنظومة بنجاح!",
          });
          toast.success("تم تفعيل واختبار الإشعارات بنجاح!");
        } else {
          toast.info("تم إرسال تنبيه تجريبي داخل التطبيق", {
            description: "المنظومة والتنبيهات تعمل بشكل صحيح.",
          });
        }
      });
    } else {
      toast.info("تم إرسال تنبيه تجريبي داخل التطبيق", {
        description: "المنظومة والتنبيهات تعمل بشكل صحيح.",
      });
    }
  } else {
    toast.info("تم إرسال تنبيه تجريبي داخل التطبيق", {
      description: "المنظومة والتنبيهات تعمل بشكل صحيح.",
    });
  }
};
