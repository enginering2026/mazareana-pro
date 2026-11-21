@echo off
chcp 65001 > nul
echo ===================================================
echo     جاري تشغيل تطبيق إدارة المشروع المالي...
echo ===================================================
start http://localhost:5173
npx vite --host localhost --port 5173
pause
