@echo off
title Trofeo Solution - Service Launcher
color 0A

echo ============================================
echo   TROFEO SOLUTION - STARTING ALL SERVICES
echo ============================================
echo.

cd /d D:\sku-matcher-prototype

echo [1/2] Starting Web Server (Port 8085)...
start "Trofeo - Web Server" cmd /k "color 0B && echo WEB SERVER STARTED - http://127.0.0.1:8085 && echo Press Ctrl+C to stop. && echo. && C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe run_server.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Email Listener...
start "Trofeo - Email Listener" cmd /k "color 0E && echo EMAIL LISTENER STARTED && echo Press Ctrl+C to stop. && echo. && C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe run_email_listener.py"

echo.
echo ============================================
echo   BOTH SERVICES ARE NOW RUNNING!
echo   Web Dashboard: http://127.0.0.1:8085
echo ============================================
echo.
echo This window can be closed safely.
pause
