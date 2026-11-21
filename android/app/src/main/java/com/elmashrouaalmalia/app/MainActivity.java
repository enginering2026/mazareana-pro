package com.elmashrouaalmalia.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.WindowInsetsController;
import android.view.WindowInsets;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.provider.MediaStore;
import android.provider.Settings;
import android.speech.ModelDownloadListener;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.content.SharedPreferences;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.documentfile.provider.DocumentFile;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import java.util.concurrent.Executor;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivityVoice";
    private static final int PERMISSION_REQUEST_AUDIO = 1001;
    private static final int SPEECH_INTENT_REQUEST_CODE = 1002;
    private static final int PERMISSION_REQUEST_NOTIFICATIONS = 1003;
    private static final int REQUEST_CODE_PICK_BACKUP_FOLDER = 1004;

    public static final String NOTIFICATION_CHANNEL_ID = "elmashroua_financial_alerts";
    public static final String NOTIFICATION_CHANNEL_NAME = "تنبيهات المنظومة المالية";

    private SpeechRecognizer speechRecognizer;
    private boolean isInterfaceAttached = false;
    private long lastBackPressedTime = 0;
    private Toast exitToast;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── Apply Immersive Sticky Fullscreen (Hides Status & Navigation Bars) ──
        hideSystemUI();
        // ────────────────────────────────────────────────────────────────────────

        // Pre-emptively request recording audio & notifications permissions
        ArrayList<String> permissionsNeeded = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.RECORD_AUDIO);
            permissionsNeeded.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }
        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsNeeded.toArray(new String[0]), PERMISSION_REQUEST_AUDIO);
        }

        createNotificationChannel();
        attachSpeechInterface();
        if (isNetworkAvailable()) {
            triggerOfflineModelDownload();
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        attachSpeechInterface();
        if (isNetworkAvailable()) {
            triggerOfflineModelDownload();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemUI();
        attachSpeechInterface();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    /**
     * Enforces true immersive sticky fullscreen mode:
     * - Hides top status bar (WiFi, signal, battery, clock).
     * - Hides bottom navigation bar (back/home/recent buttons).
     * - Extends content into display cutout (notch / camera punch hole).
     * - Automatically restores fullscreen on swipe / touch / focus change.
     */
    private void hideSystemUI() {
        try {
            Window window = getWindow();
            if (window == null) return;

            // Cutout edge-to-edge support (Android P / API 28+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams lp = window.getAttributes();
                lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                window.setAttributes(lp);
            }

            // Window fullscreen flag
            window.setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            );

            // True Immersive Sticky Fullscreen (Hides both Status Bar & Navigation Bar)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.setDecorFitsSystemWindows(false);
                WindowInsetsController insetsController = window.getInsetsController();
                if (insetsController != null) {
                    insetsController.hide(WindowInsets.Type.systemBars());
                    insetsController.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    );
                }
            } else {
                View decorView = window.getDecorView();
                if (decorView != null) {
                    int uiOptions = View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN;
                    decorView.setSystemUiVisibility(uiOptions);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error applying immersive fullscreen: " + e.getMessage());
        }
    }

    public boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
                    return nc != null && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
                } else {
                    android.net.NetworkInfo ni = cm.getActiveNetworkInfo();
                    return ni != null && ni.isConnected();
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    private void triggerOfflineModelDownload() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            try {
                if (SpeechRecognizer.isRecognitionAvailable(this)) {
                    SpeechRecognizer tempRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
                    Intent dlIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    dlIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-EG");
                    dlIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ar-EG");
                    tempRecognizer.triggerModelDownload(
                        dlIntent,
                        ContextCompat.getMainExecutor(this),
                        new ModelDownloadListener() {
                            @Override public void onProgress(int progress) {
                                Log.d(TAG, "Offline Arabic model download: " + progress + "%");
                                sendJs("window.onOfflineVoiceProgress && window.onOfflineVoiceProgress(" + progress + ")");
                            }
                            @Override public void onSuccess() {
                                Log.i(TAG, "Offline Arabic speech recognition model ready!");
                                sendJs("window.onOfflineVoiceSuccess && window.onOfflineVoiceSuccess()");
                            }
                            @Override public void onScheduled() {
                                Log.d(TAG, "Offline Arabic speech recognition model download scheduled");
                                sendJs("window.onOfflineVoiceScheduled && window.onOfflineVoiceScheduled()");
                            }
                            @Override public void onError(int error) {
                                Log.w(TAG, "Offline Arabic speech recognition model download notice: " + error);
                                sendJs("window.onOfflineVoiceError && window.onOfflineVoiceError(" + error + ")");
                            }
                        }
                    );
                }
            } catch (Throwable t) {
                Log.w(TAG, "triggerOfflineModelDownload notice: " + t.getMessage());
            }
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("إشعارات وتنبيهات المصروفات والإيرادات والنسخ الاحتياطي للمشروع المالي");
            channel.enableVibration(true);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    public void showSystemNotification(String title, String message) {
        runOnUiThread(() -> {
            try {
                createNotificationChannel();
                Intent intent = new Intent(this, MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
                );

                NotificationCompat.Builder builder = new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(message)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

                NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                    ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                    notificationManager.notify((int) (System.currentTimeMillis() % 100000), builder.build());
                } else {
                    ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_NOTIFICATIONS);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error displaying notification: " + e.getMessage(), e);
            }
        });
    }

    private boolean saveToPublicDownloads(String fileName, String jsonContent) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/المشروع_المالي");
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri != null) {
                    try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                        if (os != null) {
                            os.write(jsonContent.getBytes(StandardCharsets.UTF_8));
                            os.flush();
                            return true;
                        }
                    }
                }
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File targetDir = new File(downloadsDir, "المشروع_المالي");
                if (!targetDir.exists()) targetDir.mkdirs();
                File targetFile = new File(targetDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    fos.write(jsonContent.getBytes(StandardCharsets.UTF_8));
                    fos.flush();
                    return true;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "saveToPublicDownloads error: " + e.getMessage());
        }
        return false;
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            webView.evaluateJavascript(
                "(function() { if (typeof window.onAndroidBackPressed === 'function') { return window.onAndroidBackPressed(); } return false; })()",
                result -> {
                    boolean isHandled = "true".equalsIgnoreCase(result);
                    if (isHandled) {
                        return;
                    }

                    runOnUiThread(() -> {
                        if (System.currentTimeMillis() - lastBackPressedTime < 2200) {
                            if (exitToast != null) exitToast.cancel();
                            MainActivity.super.onBackPressed();
                        } else {
                            lastBackPressedTime = System.currentTimeMillis();
                            if (exitToast != null) exitToast.cancel();
                            exitToast = Toast.makeText(
                                MainActivity.this,
                                "اضغط مرة أخرى للخروج من البرنامج",
                                Toast.LENGTH_SHORT
                            );
                            exitToast.show();
                        }
                    });
                }
            );
            return;
        }
        super.onBackPressed();
    }

    private void attachSpeechInterface() {
        if (isInterfaceAttached) return;
        try {
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null) {
                AndroidSpeechBridge bridge = new AndroidSpeechBridge();
                webView.addJavascriptInterface(bridge, "AndroidSpeech");
                webView.addJavascriptInterface(bridge, "AndroidBridge");
                isInterfaceAttached = true;
                Log.d(TAG, "AndroidSpeech & AndroidBridge successfully registered");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error attaching AndroidBridge: " + e.getMessage(), e);
        }
    }

    public class AndroidSpeechBridge {
        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }

        @JavascriptInterface
        public boolean isOffline() {
            return !isNetworkAvailable();
        }

        @JavascriptInterface
        public void vibrate(int milliseconds) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(milliseconds);
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Vibrate error: " + e.getMessage());
            }
        }

        @JavascriptInterface
        public void vibratePattern(String patternCsv) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) {
                    String[] parts = patternCsv.split(",");
                    long[] pattern = new long[parts.length];
                    for (int i = 0; i < parts.length; i++) {
                        pattern[i] = Long.parseLong(parts[i].trim());
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(VibrationEffect.createWaveform(pattern, -1));
                    } else {
                        v.vibrate(pattern, -1);
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "VibratePattern error: " + e.getMessage());
            }
        }

        @JavascriptInterface
        public String getDeviceId() {
            try {
                String androidId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
                if (androidId != null && !androidId.isEmpty()) {
                    int hash = Math.abs(androidId.hashCode());
                    int sixDigit = 100000 + (hash % 900000);
                    return String.valueOf(sixDigit);
                }
            } catch (Exception e) {
                Log.w(TAG, "getDeviceId error: " + e.getMessage());
            }
            return "";
        }

        @JavascriptInterface
        public void savePersistentLicense(String key) {
            try {
                SharedPreferences prefs = getSharedPreferences("app_license_prefs", Context.MODE_PRIVATE);
                prefs.edit().putString("persistent_key", key).apply();
            } catch (Exception e) {
                Log.w(TAG, "savePersistentLicense error: " + e.getMessage());
            }
        }

        @JavascriptInterface
        public String getPersistentLicense() {
            try {
                SharedPreferences prefs = getSharedPreferences("app_license_prefs", Context.MODE_PRIVATE);
                return prefs.getString("persistent_key", "");
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean isBiometricSupported() {
            try {
                BiometricManager biometricManager = BiometricManager.from(MainActivity.this);
                int canAuth = biometricManager.canAuthenticate(
                    BiometricManager.Authenticators.BIOMETRIC_WEAK | 
                    BiometricManager.Authenticators.BIOMETRIC_STRONG
                );
                return canAuth == BiometricManager.BIOMETRIC_SUCCESS;
            } catch (Exception e) {
                Log.w(TAG, "isBiometricSupported error: " + e.getMessage());
                return false;
            }
        }

        @JavascriptInterface
        public void startBiometricAuth() {
            runOnUiThread(() -> {
                try {
                    Executor executor = ContextCompat.getMainExecutor(MainActivity.this);
                    BiometricPrompt biometricPrompt = new BiometricPrompt(MainActivity.this, executor, new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                            super.onAuthenticationSucceeded(result);
                            sendJs("if (typeof window.onNativeBiometricResult === 'function') { window.onNativeBiometricResult(true, null); }");
                        }

                        @Override
                        public void onAuthenticationError(int errorCode, CharSequence errString) {
                            super.onAuthenticationError(errorCode, errString);
                            sendJs("if (typeof window.onNativeBiometricResult === 'function') { window.onNativeBiometricResult(false, '" + errString + "'); }");
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            super.onAuthenticationFailed();
                            sendJs("if (typeof window.onNativeBiometricFailed === 'function') { window.onNativeBiometricFailed(); }");
                        }
                    });

                    BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle("تأكيد الهوية - مزارعنا برو")
                        .setSubtitle("استخدم بصمة الإصبع أو بصمة الوجه لفتح الحسابات")
                        .setNegativeButtonText("إلغاء / استخدام الرمز")
                        .build();

                    biometricPrompt.authenticate(promptInfo);
                } catch (Exception e) {
                    Log.e(TAG, "startBiometricAuth error: " + e.getMessage(), e);
                    sendJs("if (typeof window.onNativeBiometricResult === 'function') { window.onNativeBiometricResult(false, '" + e.getMessage() + "'); }");
                }
            });
        }

        @JavascriptInterface
        public void downloadVoicePackNow() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    triggerOfflineModelDownload();
                    sendJs("window.onOfflineVoiceScheduled && window.onOfflineVoiceScheduled()");
                } else {
                    openVoiceSettings();
                }
            });
        }

        @JavascriptInterface
        public void openVoiceSettings() {
            runOnUiThread(() -> {
                Intent[] intents = new Intent[] {
                    new Intent("android.settings.VOICE_INPUT_SETTINGS"),
                    new Intent("com.google.android.voicesearch.SETTINGS"),
                    new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS),
                    new Intent(Settings.ACTION_LOCALE_SETTINGS),
                    new Intent(Settings.ACTION_SETTINGS)
                };
                for (Intent it : intents) {
                    try {
                        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        if (it.resolveActivity(getPackageManager()) != null) {
                            startActivity(it);
                            return;
                        }
                    } catch (Exception ignored) {}
                }
            });
        }

        @JavascriptInterface
        public void openGoogleSpeechStore() {
            runOnUiThread(() -> {
                String[] packages = new String[] {
                    "com.google.android.googlequicksearchbox",
                    "com.google.android.tts"
                };
                for (String pkg : packages) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("market://details?id=" + pkg));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        if (intent.resolveActivity(getPackageManager()) != null) {
                            startActivity(intent);
                            return;
                        }
                    } catch (Exception ignored) {}
                }
                try {
                    Intent webIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox"));
                    webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(webIntent);
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void startListening() {
            runOnUiThread(() -> {
                // Ensure audio permission
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{
                        Manifest.permission.RECORD_AUDIO
                    }, PERMISSION_REQUEST_AUDIO);
                    sendJs("window.onNativeSpeechError && window.onNativeSpeechError(9)");
                    return;
                }

                // Primary Method: System/Google Speech Recognition Dialog
                try {
                    boolean isOffline = !isNetworkAvailable();
                    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-EG");
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ar-EG");
                    intent.putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false);

                    ArrayList<String> extraLanguages = new ArrayList<>();
                    extraLanguages.add("ar-EG");
                    extraLanguages.add("ar-SA");
                    extraLanguages.add("ar");
                    intent.putStringArrayListExtra("android.speech.extra.EXTRA_ADDITIONAL_LANGUAGES", extraLanguages);

                    // ONLY prefer offline if there is genuinely NO internet connection
                    if (isOffline) {
                        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
                        intent.putExtra("android.speech.extra.PREFER_OFFLINE", true);
                        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "تحدث الآن باللغة العربية (بدون إنترنت)");
                    } else {
                        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "تحدث الآن باللغة العربية (مثال: سجل إيراد بيض)");
                    }
                    intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);

                    // Try Google App first if installed for best Arabic recognition
                    try {
                        getPackageManager().getPackageInfo("com.google.android.googlequicksearchbox", 0);
                        intent.setPackage("com.google.android.googlequicksearchbox");
                        if (intent.resolveActivity(getPackageManager()) == null) {
                            intent.setPackage(null);
                        }
                    } catch (Exception ignored) {
                        intent.setPackage(null);
                    }

                    if (intent.resolveActivity(getPackageManager()) != null) {
                        sendJs("window.onNativeSpeechEvent && window.onNativeSpeechEvent('listening')");
                        MainActivity.this.startActivityForResult(intent, SPEECH_INTENT_REQUEST_CODE);
                        return;
                    }
                } catch (Exception e) {
                    Log.w(TAG, "ACTION_RECOGNIZE_SPEECH launch failed: " + e.getMessage());
                }

                // Fallback Method: In-app SpeechRecognizer
                startInAppSpeechRecognizer();
            });
        }

        @JavascriptInterface
        public void startListeningWithDialog() {
            startListening();
        }

        @JavascriptInterface
        public void stopListening() {
            runOnUiThread(() -> {
                try {
                    if (speechRecognizer != null) {
                        speechRecognizer.stopListening();
                    }
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void cancelListening() {
            runOnUiThread(() -> {
                try {
                    if (speechRecognizer != null) {
                        speechRecognizer.cancel();
                    }
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void showNotification(String title, String message) {
            showSystemNotification(title, message);
        }

        @JavascriptInterface
        public void testNotification() {
            showSystemNotification("المنظومة المالية", "تم اختبار إشعارات الهاتف بنجاح! التنبيهات تعمل بأعلى كفاءة.");
        }

        @JavascriptInterface
        public boolean saveBackupFile(String fileName, String jsonString) {
            try {
                // 1. Write file to internal/external cache directory for FileProvider
                File backupDir = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "backups");
                if (!backupDir.exists()) {
                    backupDir.mkdirs();
                }
                File backupFile = new File(backupDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(backupFile)) {
                    fos.write(jsonString.getBytes(StandardCharsets.UTF_8));
                    fos.flush();
                }

                // 2. Also save to public Downloads
                saveToPublicDownloads(fileName, jsonString);

                // 3. Post system notification
                showSystemNotification("تم إنشاء نسخة احتياطية بنجاح", "تم حفظ الملف " + fileName + " في مجلد التنزيلات");

                // 4. Open native share sheet so user can send to WhatsApp, Drive, etc.
                runOnUiThread(() -> {
                    try {
                        Uri contentUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".fileprovider",
                            backupFile
                        );
                        Intent shareIntent = new Intent(Intent.ACTION_SEND);
                        shareIntent.setType("application/json");
                        shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                        shareIntent.putExtra(Intent.EXTRA_SUBJECT, fileName);
                        shareIntent.putExtra(Intent.EXTRA_TEXT, "نسخة احتياطية من المنظومة المالية: " + fileName);
                        shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        startActivity(Intent.createChooser(shareIntent, "مشاركة أو حفظ النسخة الاحتياطية"));
                    } catch (Exception e) {
                        Log.w(TAG, "Share sheet intent failed: " + e.getMessage());
                    }
                    Toast.makeText(MainActivity.this, "تم تصدير النسخة الاحتياطية بنجاح إلى التنزيلات", Toast.LENGTH_LONG).show();
                });

                return true;
            } catch (Exception e) {
                Log.e(TAG, "saveBackupFile error: " + e.getMessage(), e);
                return false;
            }
        }

        @JavascriptInterface
        public boolean saveDirectlyToGoogleDrive(String fileName, String jsonContent) {
            runOnUiThread(() -> {
                try {
                    File backupDir = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "gdrive_sync");
                    if (!backupDir.exists()) backupDir.mkdirs();
                    File backupFile = new File(backupDir, fileName);
                    try (FileOutputStream fos = new FileOutputStream(backupFile)) {
                        fos.write(jsonContent.getBytes(StandardCharsets.UTF_8));
                        fos.flush();
                    }

                    Uri contentUri = FileProvider.getUriForFile(
                        MainActivity.this,
                        getPackageName() + ".fileprovider",
                        backupFile
                    );

                    Intent driveIntent = new Intent(Intent.ACTION_SEND);
                    driveIntent.setType("application/json");
                    driveIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                    driveIntent.putExtra(Intent.EXTRA_TITLE, fileName);
                    driveIntent.putExtra(Intent.EXTRA_SUBJECT, fileName);
                    driveIntent.setClipData(android.content.ClipData.newRawUri("backup", contentUri));
                    driveIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

                    // Check if Google Drive package is installed
                    boolean hasGoogleDrive = false;
                    try {
                        getPackageManager().getPackageInfo("com.google.android.apps.docs", 0);
                        hasGoogleDrive = true;
                    } catch (Exception ignored) {}

                    if (hasGoogleDrive) {
                        driveIntent.setPackage("com.google.android.apps.docs");
                        try {
                            startActivity(driveIntent);
                            Toast.makeText(MainActivity.this, "جاري فتح Google Drive لحفظ النسخة الاحتياطية...", Toast.LENGTH_SHORT).show();
                            return;
                        } catch (Exception e) {
                            Log.w(TAG, "Direct Google Drive package launch failed, using chooser: " + e.getMessage());
                            driveIntent.setPackage(null);
                        }
                    }

                    // Fallback to chooser where Google Drive is listed
                    Intent chooser = Intent.createChooser(driveIntent, "حفظ النسخة في Google Drive");
                    chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(chooser);
                } catch (Exception e) {
                    Log.e(TAG, "saveDirectlyToGoogleDrive error: " + e.getMessage(), e);
                    Toast.makeText(MainActivity.this, "تعذر فتح تطبيق Google Drive: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
            return true;
        }

        @JavascriptInterface
        public void openExternalBrowser(String url) {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    Log.e(TAG, "openExternalBrowser error: " + e.getMessage(), e);
                }
            });
        }

        @JavascriptInterface
        public void chooseBackupFolder() {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
                    intent.addFlags(
                        Intent.FLAG_GRANT_READ_URI_PERMISSION |
                        Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                        Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
                        Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
                    );
                    startActivityForResult(intent, REQUEST_CODE_PICK_BACKUP_FOLDER);
                } catch (Exception e) {
                    Log.e(TAG, "chooseBackupFolder error: " + e.getMessage(), e);
                    Toast.makeText(MainActivity.this, "تعذر فتح نافذة اختيار المجلد: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public String getAutoBackupFolderInfo() {
            try {
                SharedPreferences prefs = getSharedPreferences("auto_backup_prefs", MODE_PRIVATE);
                String treeUriStr = prefs.getString("tree_uri", null);
                String folderName = prefs.getString("folder_name", null);
                long lastTime = prefs.getLong("last_backup_timestamp", 0);
                String lastFile = prefs.getString("last_backup_file", "");
                long lastSize = prefs.getLong("last_backup_size", 0);

                if (treeUriStr == null) {
                    return "{\"hasFolder\": false}";
                }

                Uri uri = Uri.parse(treeUriStr);
                DocumentFile dir = DocumentFile.fromTreeUri(MainActivity.this, uri);
                boolean exists = dir != null && dir.exists() && dir.canWrite();

                return "{" +
                    "\"hasFolder\": " + (exists ? "true" : "false") + "," +
                    "\"folderName\": \"" + (folderName != null ? folderName.replace("\"", "\\\"") : "مجلد النسخ الاحتياطي") + "\"," +
                    "\"folderUri\": \"" + treeUriStr.replace("\"", "\\\"") + "\"," +
                    "\"canWrite\": " + (exists ? "true" : "false") + "," +
                    "\"lastBackupTimestamp\": " + lastTime + "," +
                    "\"lastBackupFile\": \"" + lastFile.replace("\"", "\\\"") + "\"," +
                    "\"lastBackupSize\": " + lastSize +
                "}";
            } catch (Exception e) {
                return "{\"hasFolder\": false, \"error\": \"" + (e.getMessage() != null ? e.getMessage().replace("\"", "\\\"") : "") + "\"}";
            }
        }

        @JavascriptInterface
        public String performAutoBackup(String jsonContent, String fileName) {
            try {
                SharedPreferences prefs = getSharedPreferences("auto_backup_prefs", MODE_PRIVATE);
                String treeUriStr = prefs.getString("tree_uri", null);
                String folderName = prefs.getString("folder_name", "المجلد المختار");
                if (treeUriStr == null) {
                    return "{\"success\": false, \"message\": \"لم يتم اختيار مجلد لحفظ النسخ الاحتياطية بعد\"}";
                }

                Uri treeUri = Uri.parse(treeUriStr);
                DocumentFile pickedDir = DocumentFile.fromTreeUri(MainActivity.this, treeUri);
                if (pickedDir == null || !pickedDir.exists() || !pickedDir.canWrite()) {
                    return "{\"success\": false, \"message\": \"المجلد المختار لم يعد متاحاً أو تم سحب الصلاحيات. يرجى إعادة اختيار المجلد.\"}";
                }

                // 1. Delete all previous auto-backup files in the chosen folder
                int deletedOldCount = 0;
                DocumentFile[] existingFiles = pickedDir.listFiles();
                if (existingFiles != null) {
                    for (DocumentFile f : existingFiles) {
                        if (f.isFile()) {
                            String name = f.getName();
                            if (name != null && (
                                name.startsWith("MazareanaPro_AutoBackup_") ||
                                name.startsWith("المشروع_المالي_نسخة_تلقائية_") ||
                                name.startsWith("MazareanaPro_LocalBackup_") ||
                                (name.contains("AutoBackup") && name.endsWith(".json"))
                            )) {
                                try {
                                    if (f.delete()) {
                                        deletedOldCount++;
                                    }
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                }

                // 2. Format new backup file name
                if (fileName == null || fileName.trim().isEmpty()) {
                    String datePart = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(new Date());
                    fileName = "MazareanaPro_AutoBackup_" + datePart + ".json";
                }

                // 3. Create the new backup file in the chosen directory
                DocumentFile newBackupFile = pickedDir.createFile("application/json", fileName);
                if (newBackupFile == null) {
                    return "{\"success\": false, \"message\": \"تعذر إنشاء ملف النسخة داخل المجلد المختار\"}";
                }

                try (OutputStream os = getContentResolver().openOutputStream(newBackupFile.getUri(), "wt")) {
                    if (os == null) {
                        return "{\"success\": false, \"message\": \"فشل فتح مجرى الكتابة للملف المختار\"}";
                    }
                    os.write(jsonContent.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }

                // 4. Verify file exists and has size > 0
                long finalSize = newBackupFile.length();
                if (!newBackupFile.exists() || finalSize == 0) {
                    return "{\"success\": false, \"message\": \"فشل التحقق: الملف غير موجود أو تم إنشاؤه فارغاً\"}";
                }

                long now = System.currentTimeMillis();
                prefs.edit()
                    .putLong("last_backup_timestamp", now)
                    .putString("last_backup_file", fileName)
                    .putLong("last_backup_size", finalSize)
                    .apply();

                // 5. System notification and Toast
                showSystemNotification(
                    "تم تحديث النسخة الاحتياطية بنجاح",
                    "تم حفظ النسخة الجديدة (" + (finalSize / 1024) + " ك.ب) وحذف النسخة السابقة من: " + folderName
                );

                runOnUiThread(() -> {
                    Toast.makeText(
                        MainActivity.this,
                        "✅ تم حفظ النسخة الجديدة في (" + folderName + ") وحذف القديمة بنجاح",
                        Toast.LENGTH_LONG
                    ).show();
                });

                return "{" +
                    "\"success\": true," +
                    "\"fileName\": \"" + fileName + "\"," +
                    "\"folderName\": \"" + folderName.replace("\"", "\\\"") + "\"," +
                    "\"deletedOldCount\": " + deletedOldCount + "," +
                    "\"size\": " + finalSize + "," +
                    "\"timestamp\": " + now +
                "}";
            } catch (Exception e) {
                Log.e(TAG, "performAutoBackup error: " + e.getMessage(), e);
                return "{\"success\": false, \"message\": \"" + (e.getMessage() != null ? e.getMessage().replace("\"", "\\\"") : "حدث خطأ غير متوقع") + "\"}";
            }
        }

        @JavascriptInterface
        public boolean clearAutoBackupFolder() {
            try {
                getSharedPreferences("auto_backup_prefs", MODE_PRIVATE)
                    .edit()
                    .clear()
                    .apply();
                return true;
            } catch (Exception e) {
                return false;
            }
        }
    }

    private void startInAppSpeechRecognizer() {
        try {
            if (speechRecognizer != null) {
                try { speechRecognizer.cancel(); speechRecognizer.destroy(); } catch (Exception ignored) {}
                speechRecognizer = null;
            }

            if (!SpeechRecognizer.isRecognitionAvailable(this)) {
                sendJs("window.onNativeSpeechError && window.onNativeSpeechError(-2)");
                return;
            }

            boolean isOffline = !isNetworkAvailable();

            if (isOffline && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(this)) {
                speechRecognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(this);
            } else {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            }

            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override
                public void onReadyForSpeech(Bundle params) {
                    sendJs("window.onNativeSpeechEvent && window.onNativeSpeechEvent('ready')");
                }

                @Override
                public void onBeginningOfSpeech() {
                    sendJs("window.onNativeSpeechEvent && window.onNativeSpeechEvent('listening')");
                }

                @Override
                public void onRmsChanged(float rmsdB) {}

                @Override
                public void onBufferReceived(byte[] buffer) {}

                @Override
                public void onEndOfSpeech() {
                    sendJs("window.onNativeSpeechEvent && window.onNativeSpeechEvent('processing')");
                }

                @Override
                public void onError(int error) {
                    Log.w(TAG, "In-app SpeechRecognizer onError: " + error);
                    sendJs("window.onNativeSpeechError && window.onNativeSpeechError(" + error + ")");
                }

                @Override
                public void onResults(Bundle results) {
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches != null && !matches.isEmpty()) {
                        String text = matches.get(0).replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
                        sendJs("window.onNativeSpeechResult && window.onNativeSpeechResult('" + text + "')");
                    } else {
                        sendJs("window.onNativeSpeechError && window.onNativeSpeechError(7)");
                    }
                }

                @Override
                public void onPartialResults(Bundle partialResults) {
                    ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches != null && !matches.isEmpty()) {
                        String text = matches.get(0).replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
                        sendJs("window.onNativeSpeechPartial && window.onNativeSpeechPartial('" + text + "')");
                    }
                }

                @Override
                public void onEvent(int eventType, Bundle params) {}
            });

            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-EG");
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ar-EG");
            
            ArrayList<String> extraLanguages = new ArrayList<>();
            extraLanguages.add("ar-EG");
            extraLanguages.add("ar-SA");
            extraLanguages.add("ar");
            intent.putStringArrayListExtra("android.speech.extra.EXTRA_ADDITIONAL_LANGUAGES", extraLanguages);

            if (isOffline) {
                intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
                intent.putExtra("android.speech.extra.PREFER_OFFLINE", true);
            }
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);

            speechRecognizer.startListening(intent);
            sendJs("window.onNativeSpeechEvent && window.onNativeSpeechEvent('listening')");
        } catch (Exception e) {
            Log.e(TAG, "In-app SpeechRecognizer failed: " + e.getMessage());
            sendJs("window.onNativeSpeechError && window.onNativeSpeechError(-2)");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CODE_PICK_BACKUP_FOLDER) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                Uri treeUri = data.getData();
                final int takeFlags = (data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION))
                    | Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
                try {
                    getContentResolver().takePersistableUriPermission(treeUri, takeFlags);
                } catch (Exception e) {
                    Log.w(TAG, "takePersistableUriPermission notice: " + e.getMessage());
                }

                DocumentFile pickedDir = DocumentFile.fromTreeUri(this, treeUri);
                String folderName = (pickedDir != null && pickedDir.getName() != null) ? pickedDir.getName() : "المجلد المختار";

                getSharedPreferences("auto_backup_prefs", MODE_PRIVATE)
                    .edit()
                    .putString("tree_uri", treeUri.toString())
                    .putString("folder_name", folderName)
                    .putLong("folder_set_time", System.currentTimeMillis())
                    .apply();

                String escapedName = folderName.replace("'", "\\'").replace("\"", "\\\"");
                String escapedUri = treeUri.toString().replace("'", "\\'").replace("\"", "\\\"");
                sendJs("window.onAutoBackupFolderSelected && window.onAutoBackupFolderSelected('" + escapedName + "', '" + escapedUri + "')");
                showSystemNotification("تم اختيار مجلد النسخ الاحتياطي", "تم بنجاح تعيين مجلد: " + folderName + " للنسخ التلقائي المحلي");
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "تم اختيار المجلد: " + folderName, Toast.LENGTH_SHORT).show());
            } else {
                sendJs("window.onAutoBackupFolderSelected && window.onAutoBackupFolderSelected(null, null)");
            }
            return;
        }
        if (requestCode == SPEECH_INTENT_REQUEST_CODE) {
            if (resultCode == RESULT_OK && data != null) {
                ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (matches != null && !matches.isEmpty()) {
                    String text = matches.get(0)
                        .replace("\\", "\\\\")
                        .replace("'", "\\'")
                        .replace("\"", "\\\"")
                        .replace("\r", " ")
                        .replace("\n", " ");
                    Log.d(TAG, "Google Speech Result: " + text);
                    sendJs("window.onNativeSpeechResult && window.onNativeSpeechResult('" + text + "')");
                } else {
                    sendJs("window.onNativeSpeechError && window.onNativeSpeechError(7)");
                }
            } else {
                Log.d(TAG, "Speech dialog finished with resultCode: " + resultCode);
                if (!isNetworkAvailable()) {
                    Log.w(TAG, "Speech recognition failed while offline - offline Arabic pack likely not downloaded");
                    sendJs("window.onNativeSpeechError && window.onNativeSpeechError(2)");
                } else {
                    sendJs("window.onNativeSpeechEvent && window.onNativeSpeechEvent('cancelled')");
                }
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_AUDIO) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            sendJs("window.onNativePermissionResult && window.onNativePermissionResult(" + granted + ")");
        }
    }

    private void sendJs(String script) {
        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    webView.evaluateJavascript(script, null);
                }
            } catch (Exception ignored) {}
        });
    }

    @Override
    public void onDestroy() {
        if (speechRecognizer != null) {
            try { speechRecognizer.destroy(); } catch (Exception ignored) {}
            speechRecognizer = null;
        }
        super.onDestroy();
    }
}
