@echo off
chcp 65001 >nul
title 🚀 SmartStart Robot Local Agent (Port 3001)
color 0b
cls
echo =====================================================================
echo           🤖 SmartStart Robot - Local Flashing Agent
echo =====================================================================
echo.
echo  ⚡ מאיץ הצריבה המקומי פועל כעת במחשב שלך!
echo  🌐 פתח את האתר בדפדפן ולחץ על "צרוב"
echo  🔌 השרת יזהה אוטומטית את חיבור ה-USB ויצרוב תוך 2 שניות ב-100%% הצלחה!
echo.
echo =====================================================================
echo.

node server/server.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ שגיאה בהפעלת השרת. ודא ש-Node.js מותקן במחשב.
    pause
)
