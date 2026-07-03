@echo off
title Trofeo Solution - Stop All Services
color 0C

echo ============================================
echo   TROFEO SOLUTION - STOPPING ALL SERVICES
echo ============================================
echo.

echo Stopping processes on Port 8000 and 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Stopping Email Listener (run_email_listener.py)...
taskkill /FI "WINDOWTITLE eq Trofeo - Email Listener" /F >nul 2>&1

echo Stopping Web Server (run_server.py)...
taskkill /FI "WINDOWTITLE eq Trofeo - Web Server" /F >nul 2>&1

echo.
echo ============================================
echo   ALL SERVICES STOPPED SUCCESSFULLY.
echo ============================================
echo.
pause
