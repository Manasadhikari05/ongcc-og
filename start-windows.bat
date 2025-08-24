@echo off
chcp 65001 >nul
title ONGC Internship ATS - Windows Startup
echo 🚀 ONGC Internship ATS - Windows Startup Script
echo ===============================================
echo.

REM Check Node.js version
echo 🔍 Checking Node.js version...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo 💡 Please install Node.js 22.18.0 or later
    echo 💡 Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%

REM Check if required services are running
echo.
echo 🔍 Checking required services...

REM Check MySQL
echo 📊 Checking MySQL...
mysql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MySQL client found
) else (
    echo ⚠️ MySQL client not found in PATH
    echo 💡 Make sure MySQL is installed and added to PATH
)

REM Check MongoDB (optional)
echo 📊 Checking MongoDB...
mongosh --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB client found
) else (
    echo ⚠️ MongoDB client not found in PATH
    echo 💡 MongoDB is optional for this setup
)

echo.
echo 📦 Installing dependencies...

REM Install server dependencies
echo 🔧 Installing server dependencies...
cd server
if not exist "node_modules" (
    echo 📥 Installing server packages...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install server dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Server dependencies already installed
)

REM Install frontend dependencies
echo 🎨 Installing frontend dependencies...
cd ..\Frontend
if not exist "node_modules" (
    echo 📥 Installing frontend packages...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies already installed
)

cd ..

REM Check if .env file exists
echo.
echo 📝 Checking configuration...
if not exist "server\.env" (
    echo 📝 Creating .env file from template...
    copy "server\env.example" "server\.env"
    echo ✅ .env file created
    echo ⚠️ IMPORTANT: Please update server\.env with your database credentials
    echo.
    echo 💡 Required updates in server\.env:
    echo    - SQL_PASSWORD: Your MySQL password
    echo    - EMAIL_USER: Your email address
    echo    - EMAIL_PASS: Your email app password
    echo.
    pause
)

REM Setup database
echo.
echo 🗄️ Setting up database...
cd server
call npm run setup-db
if %errorlevel% neq 0 (
    echo ❌ Database setup failed
    echo 💡 Please check your MySQL connection and .env file
    pause
    exit /b 1
)
cd ..

REM Build frontend
echo.
echo 🔨 Building frontend...
cd Frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)
cd ..

REM Start services
echo.
echo 🚀 Starting services...

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 🐳 Docker found, using Docker Compose...
    echo 📝 Starting services with Docker...
    docker-compose up -d
    if %errorlevel% equ 0 (
        echo ✅ Services started with Docker Compose
        echo 🌐 Frontend: http://localhost:80
        echo 🔧 Backend: http://localhost:3001
        echo 📊 Health: http://localhost:3001/api/health
    ) else (
        echo ❌ Docker Compose failed, falling back to manual startup
        goto :manual_start
    )
) else (
    echo 📝 Docker not found, starting services manually...
    goto :manual_start
)

goto :end

:manual_start
echo 🚀 Starting services manually...

REM Start backend server
echo 🔧 Starting backend server...
cd server
start "ONGC Backend Server" cmd /k "npm start"
cd ..

REM Start frontend server
echo 🎨 Starting frontend server...
cd Frontend
start "ONGC Frontend Server" cmd /k "npm run dev"
cd ..

echo ✅ Services started manually
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3001
echo 📊 Health: http://localhost:3001/api/health
echo.
echo 📝 To stop services, close the command windows

:end
echo.
echo 🎉 ONGC Internship ATS is ready!
echo.
echo 📋 Quick Reference:
echo    🌐 Frontend: http://localhost:80 (Docker) or :5173 (Manual)
echo    🔧 Backend: http://localhost:3001
echo    📊 Health Check: http://localhost:3001/api/health
echo    📝 Admin Login: Use credentials from your .env file
echo.
echo 💡 Tips:
echo    - Keep this window open to see service status
echo    - Use Ctrl+C to stop Docker services
echo    - Close command windows to stop manual services
echo.
pause
