@echo off
chcp 65001 >nul
title ONGC Internship ATS - Windows Launcher

:menu
cls
echo 🚀 ONGC Internship ATS - Windows Launcher
echo =========================================
echo.
echo 📋 Available commands:
echo    1. setup    - Initial setup and deployment
echo    2. start    - Start all services
echo    3. stop     - Stop all services
echo    4. health   - Check system health
echo    5. dev      - Development mode
echo    6. docker   - Docker management
echo    7. exit     - Exit launcher
echo.
set /p choice="🚀 Command: "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto health
if "%choice%"=="5" goto dev
if "%choice%"=="6" goto docker
if "%choice%"=="7" goto exit
echo ❌ Invalid command. Please try again.
pause
goto menu

:setup
echo.
echo 📝 Running setup...
node deploy-universal.js
echo.
echo ✅ Setup completed. Press any key to continue...
pause >nul
goto menu

:start
echo.
echo 🚀 Starting services...
node start-universal.js
echo.
echo ✅ Services started. Press any key to continue...
pause >nul
goto menu

:stop
echo.
echo 🛑 Stopping services...
node stop-universal.js
echo.
echo ✅ Services stopped. Press any key to continue...
pause >nul
goto menu

:health
echo.
echo 🏥 Checking system health...
node health-check.js
echo.
echo ✅ Health check completed. Press any key to continue...
pause >nul
goto menu

:dev
echo.
echo 🔧 Starting development mode...
start "Backend Server" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd Frontend && npm run dev"
echo.
echo ✅ Development mode started in new windows.
echo 💡 Close the command windows to stop services.
echo.
pause
goto menu

:docker
:docker_menu
cls
echo 🐳 Docker Management
echo ===================
echo.
echo 📋 Available commands:
echo    1. up      - Start Docker services
echo    2. down    - Stop Docker services
echo    3. logs    - View Docker logs
echo    4. back    - Back to main menu
echo.
set /p docker_choice="🐳 Docker command: "

if "%docker_choice%"=="1" goto docker_up
if "%docker_choice%"=="2" goto docker_down
if "%docker_choice%"=="3" goto docker_logs
if "%docker_choice%"=="4" goto menu
echo ❌ Invalid command. Please try again.
pause
goto docker_menu

:docker_up
echo.
echo 🐳 Starting Docker services...
docker-compose up -d
echo.
echo ✅ Docker services started. Press any key to continue...
pause >nul
goto docker_menu

:docker_down
echo.
echo 🐳 Stopping Docker services...
docker-compose down
echo.
echo ✅ Docker services stopped. Press any key to continue...
pause >nul
goto docker_menu

:docker_logs
echo.
echo 🐳 Viewing Docker logs...
docker-compose logs -f
echo.
echo ✅ Docker logs completed. Press any key to continue...
pause >nul
goto docker_menu

:exit
echo.
echo 👋 Goodbye!
timeout /t 2 /nobreak >nul
exit
