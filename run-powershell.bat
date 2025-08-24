@echo off
chcp 65001 >nul
echo 🚀 ONGC Internship ATS - PowerShell Launcher
echo ===========================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell is not available
    echo 💡 Please ensure PowerShell is installed and accessible
    pause
    exit /b 1
)

echo ✅ PowerShell found
echo.

REM Set execution policy and run the script
echo 🔧 Setting execution policy and running startup script...
echo 💡 You may be prompted to allow script execution
echo.

powershell -ExecutionPolicy Bypass -File "start-windows.ps1" %*

if %errorlevel% neq 0 (
    echo.
    echo ❌ PowerShell script failed with error code %errorlevel%
    echo 💡 Check the error messages above
    pause
) else (
    echo.
    echo ✅ PowerShell script completed successfully
)

pause
