@echo off
chcp 65001 > nul
title مولد كود تفعيل Mazareana Pro
color 0A
cls

echo ======================================================
echo           مولد كود التفعيل المطور - Mazareana Pro
echo ======================================================
echo.

:LOOP
set "DEVID="
set /p DEVID="أدخل رمز أو معرّف الجهاز (مثال MZ-8979-A5FD-2B1A أو 684251): "

if "%DEVID%"=="" (
    echo [خطأ] يرجى إدخال رمز الجهاز.
    echo.
    goto LOOP
)

node -e "const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; const SECRET_SALT = 0x5A3C9E71; const REF_EPOCH = new Date('2026-01-01T00:00:00Z').getTime(); function hashPayload(devId, days, tier) { let h = ((devId * 1664525) + (days * 1013904223) + (tier * 374761393) + SECRET_SALT) >>> 0; h = (h ^ (h >>> 13)) >>> 0; h = (Math.imul(h, 0x5bd1e995)) >>> 0; return (h ^ (h >>> 15)) & 0x7FFFFF; } function scramble40(val, devId) { let L = Number(val >> 20n) & 0xFFFFF, R = Number(val & 0xFFFFFn); const key = ((devId ^ SECRET_SALT) >>> 0); for (let r = 0; r < 4; r++) { const f = ((R * 65539 + key + r * 31) ^ (R >>> 7)) & 0xFFFFF; const nextR = (L ^ f) & 0xFFFFF; L = R; R = nextR; } return (BigInt(L) << 20n) | BigInt(R); } function encodeKey(devStr, tier) { const num = parseInt(String(devStr).replace(/\D/g, ''), 10) || 0; let days = 0x7FFF; const tierNum = tier === 'monthly' ? 0 : tier === 'yearly' ? 1 : 2; const pfx = tier === 'monthly' ? 'M' : tier === 'yearly' ? 'Y' : 'L'; if (tier === 'monthly') days = Math.max(0, Math.floor((Date.now() + 30*86400000 - REF_EPOCH)/86400000)) & 0x7FFF; if (tier === 'yearly') days = Math.max(0, Math.floor((Date.now() + 365*86400000 - REF_EPOCH)/86400000)) & 0x7FFF; const raw = (BigInt(hashPayload(num, days, tierNum)) << 17n) | (BigInt(days) << 2n) | BigInt(tierNum); const sc = scramble40(raw, num); let chars = '', t = sc; for (let i = 0; i < 8; i++) { chars = ALPHABET[Number(t & 0x1Fn)] + chars; t = t >> 5n; } return pfx + '-' + chars.slice(0, 4) + '-' + chars.slice(4, 8); } const dev = '%DEVID%'.trim(); const key = encodeKey(dev, 'lifetime'); const num = parseInt(dev.replace(/\D/g, ''), 10); const legacy = isNaN(num) ? '---' : (((num * 3) + 123456) % 1000000).toString().padStart(6, '0'); console.log('\n====================================='); console.log('  كود مدى الحياة: ' + key); console.log('  الكود الرقمي البديل: ' + legacy); console.log('=====================================\n'); try { require('child_process').execSync('powershell -Command Set-Clipboard -Value ' + key); console.log(' [✓] تم نسخ كود مدى الحياة تلقائياً للحافظة!\n'); } catch(e){}"

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
