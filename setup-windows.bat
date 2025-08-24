@echo off
chcp 65001 >nul
title ONGC Internship ATS - Windows Environment Setup
echo 🚀 ONGC Internship ATS - Windows Environment Setup
echo ================================================
echo.

echo 📋 This script will help you set up your Windows environment for ONGC Internship ATS
echo.

REM Check Node.js
echo 🔍 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js found: %NODE_VERSION%
    
    REM Check if version is compatible
    for /f "tokens=2 delims=." %%i in ('node --version') do set NODE_MAJOR=%%i
    if %NODE_MAJOR% geq 18 (
        echo ✅ Node.js version is compatible
    ) else (
        echo ⚠️ Node.js version %NODE_VERSION% might be too old
        echo 💡 Recommended: Node.js 18.x or later
    )
) else (
    echo ❌ Node.js not found
    echo 💡 Please install Node.js from https://nodejs.org/
    echo 💡 Choose LTS version (18.x or later)
    pause
    exit /b 1
)

echo.

REM Check npm
echo 🔍 Checking npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm found: %NPM_VERSION%
) else (
    echo ❌ npm not found
    echo 💡 npm should come with Node.js installation
    pause
    exit /b 1
)

echo.

REM Check MySQL
echo 🔍 Checking MySQL...
mysql --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('mysql --version') do set MYSQL_VERSION=%%i
    echo ✅ MySQL client found: %MYSQL_VERSION%
) else (
    echo ⚠️ MySQL client not found in PATH
    echo 💡 You need to install MySQL Server and add it to PATH
    echo 💡 Download from: https://dev.mysql.com/downloads/mysql/
    echo 💡 Or use XAMPP: https://www.apachefriends.org/
)

echo.

REM Check MongoDB (optional)
echo 🔍 Checking MongoDB...
mongosh --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('mongosh --version') do set MONGO_VERSION=%%i
    echo ✅ MongoDB client found: %MONGO_VERSION%
) else (
    echo ⚠️ MongoDB client not found in PATH
    echo 💡 MongoDB is optional for this setup
    echo 💡 Download from: https://www.mongodb.com/try/download/community
)

echo.

REM Check Docker (optional)
echo 🔍 Checking Docker...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo ✅ Docker found: %DOCKER_VERSION%
    
    REM Check Docker Compose
    docker-compose --version >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=*" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
        echo ✅ Docker Compose found: %COMPOSE_VERSION%
    ) else (
        echo ⚠️ Docker Compose not found
        echo 💡 Docker Compose should come with Docker Desktop
    )
) else (
    echo ⚠️ Docker not found
    echo 💡 Docker is optional but recommended for easy deployment
    echo 💡 Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
)

echo.

REM Check Git
echo 🔍 Checking Git...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo ✅ Git found: %GIT_VERSION%
) else (
    echo ⚠️ Git not found
    echo 💡 Git is recommended for version control
    echo 💡 Download from: https://git-scm.com/
)

echo.
echo 📝 Environment Summary:
echo ======================
echo ✅ Node.js: %NODE_VERSION%
echo ✅ npm: %NPM_VERSION%

if defined MYSQL_VERSION (
    echo ✅ MySQL: %MYSQL_VERSION%
) else (
    echo ❌ MySQL: Not found in PATH
)

if defined MONGO_VERSION (
    echo ✅ MongoDB: %MONGO_VERSION%
) else (
    echo ⚠️ MongoDB: Not found in PATH (optional)
)

if defined DOCKER_VERSION (
    echo ✅ Docker: %DOCKER_VERSION%
) else (
    echo ⚠️ Docker: Not found (optional)
)

if defined GIT_VERSION (
    echo ✅ Git: %GIT_VERSION%
) else (
    echo ⚠️ Git: Not found (recommended)
)

echo.

REM Create .env file if it doesn't exist
if not exist "server\.env" (
    echo 📝 Creating .env file from template...
    copy "server\env.example" "server\.env"
    echo ✅ .env file created at server\.env
    echo.
    echo ⚠️ IMPORTANT: You need to update server\.env with your credentials:
    echo.
    echo 💡 Required updates:
    echo    - SQL_PASSWORD: Your MySQL root password
    echo    - EMAIL_USER: Your email address
    echo    - EMAIL_PASS: Your email app password
    echo.
    echo 💡 Optional updates:
    echo    - SQL_HOST: MySQL host (default: localhost)
    echo    - SQL_PORT: MySQL port (default: 3306)
    echo    - MONGODB_URI: MongoDB connection string
    echo.
    echo 📝 Edit server\.env file now or later
) else (
    echo ✅ .env file already exists
)

echo.
echo 🎯 Next Steps:
echo ==============
echo 1. 📝 Update server\.env with your database and email credentials
echo 2. 🗄️ Ensure MySQL service is running
echo 3. 🚀 Run start-windows.bat to start the application
echo.
echo 💡 If you encounter issues:
echo    - Check that MySQL service is running
echo    - Verify your .env file credentials
echo    - Ensure ports 3001 and 5173 are available
echo.

pause
