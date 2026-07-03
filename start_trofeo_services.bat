@echo off
REM ============================================================
REM  TROFEO HARDWARE - Auto-Start Services
REM  Starts the Web Server and Email Listener on login.
REM  Both services stop automatically when the computer shuts down.
REM ============================================================

SET PYTHON=C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe
SET PROJECT=%~dp0
if "%PROJECT:~-1%"=="\" SET PROJECT=%PROJECT:~0,-1%

echo [Trofeo] Starting Web Server...
start "Trofeo Web Server" /D "%PROJECT%" /MIN "%PYTHON%" run_server.py

REM Wait 3 seconds for the server to initialize before starting the listener
timeout /t 3 /nobreak >nul

echo [Trofeo] Starting Email Listener...
start "Trofeo Email Listener" /D "%PROJECT%" /MIN "%PYTHON%" run_email_listener.py

echo [Trofeo] Both services started successfully.
exit
