@echo off
chcp 65001 > nul
title مولد كود تفعيل Mazareana Pro
color 0A
cls

echo ======================================================
echo           مولد كود التفعيل - Mazareana Pro
echo ======================================================
echo.

:LOOP
set "DEVID="
set /p DEVID="أدخل رمز الجهاز (Device ID): "

if "%DEVID%"=="" (
    echo [خطأ] يرجى إدخال رمز الجهاز.
    echo.
    goto LOOP
)

node -e "const d = '%DEVID%'.trim(); const id = parseInt(d, 10); if (isNaN(id)) { console.log('\n [X] خطأ: رمز الجهاز يجب أن يكون أرقاماً فقط.\n'); } else { const key = ((id * 3) + 123456) % 1000000; console.log('\n====================================='); console.log('  كود التفعيل هو: ' + key); console.log('=====================================\n'); require('child_process').execSync('powershell -Command Set-Clipboard -Value ' + key); console.log(' [✓] تم نسخ كود التفعيل تلقائياً إلى الحافظة!\n'); }"

echo ------------------------------------------------------
echo [1] توليد كود لجهاز آخر
echo [2] فتح واجهة المولد في المتصفح (HTML)
echo [3] خروج
echo ------------------------------------------------------
set /p CHOICE="اختر رقم (1/2/3): "

if "%CHOICE%"=="1" (
    echo.
    goto LOOP
)
if "%CHOICE%"=="2" (
    start "" "مولد_كود_التفعيل.html"
    goto LOOP
)

exit
