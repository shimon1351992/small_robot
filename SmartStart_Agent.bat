@echo off
title SmartStart Robot Local Agent
color 0A
cls
echo =====================================================================
echo           SmartStart Robot - Local Flashing Agent
echo =====================================================================
echo.
echo  Local Flashing Server is RUNNING!
echo  Open your browser at: http://localhost:3002
echo.
echo =====================================================================
echo.

if exist "%~dp0server\server.js" (
    node "%~dp0server\server.js"
) else if exist "server\server.js" (
    node server\server.js
) else if exist "server.js" (
    node server.js
) else (
    node "%~dp0server.js"
)

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start server. Make sure Node.js is installed.
    echo.
)
pause
