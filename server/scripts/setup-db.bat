@echo off
chcp 65001 >nul
echo 🗄️ ONGC Database Setup - Windows Version
echo =======================================

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not available. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found in server directory.
    echo 💡 Please create .env file from env.example first.
    pause
    exit /b 1
)

echo ✅ .env file found

REM Run the database setup script
echo 🚀 Running database setup...
node scripts/setup.js

if %errorlevel% equ 0 (
    echo ✅ Database setup completed successfully!
) else (
    echo ❌ Database setup failed. Check the error messages above.
)

echo.
echo 📝 Next steps:
echo    1. Ensure MySQL service is running
echo    2. Ensure MongoDB service is running (if using MongoDB)
echo    3. Run 'npm start' to start the server
echo.
pause
