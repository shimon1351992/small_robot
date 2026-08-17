@echo off
title SmartStart Robot Local Agent (Port 3001)
color 0A
cls
echo =====================================================================
echo           SmartStart Robot - Local Flashing Agent (Port 3001)
echo =====================================================================
echo.
echo  Local Flashing Server is RUNNING!
echo  Open your browser, connect your ESP32 via USB, and click FLASH!
echo.
echo =====================================================================
echo.

node server/server.js
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start server. Make sure Node.js is installed.
    echo.
)
pause
