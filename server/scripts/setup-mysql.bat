@echo off
chcp 65001 >nul
echo 🗄️ Setting up MySQL database and user...
echo =========================================

REM Load environment variables from .env file
if exist ".env" (
    echo ✅ .env file found, loading configuration...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
    echo ✅ Loaded configuration from .env file
) else (
    echo ❌ .env file not found. Please create it first.
    pause
    exit /b 1
)

REM MySQL configuration from .env file
set "DB_NAME=%SQL_DATABASE%"
if "%DB_NAME%"=="" set "DB_NAME=ongc_auth"
set "DB_USER=%SQL_USER%"
if "%DB_USER%"=="" set "DB_USER=ongc_user"
set "DB_PASSWORD=%SQL_PASSWORD%"
if "%DB_PASSWORD%"=="" set "DB_PASSWORD=ongc123"

echo 📝 Using configuration:
echo    Database: %DB_NAME%
echo    User: %DB_USER%
echo    Password: %DB_PASSWORD%

REM Check if MySQL is running
echo 🔍 Checking if MySQL is running...
mysql -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MySQL is not running or not accessible.
    echo 💡 Please ensure MySQL is running and accessible as root user.
    echo 💡 You may need to start MySQL service or check your PATH.
    pause
    exit /b 1
)

echo ✅ MySQL is accessible

REM Drop existing user if exists
echo 🗑️ Dropping existing user '%DB_USER%' if exists...
mysql -u root -e "DROP USER IF EXISTS '%DB_USER%'@'localhost';" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Existing user dropped
) else (
    echo ⚠️ Could not drop existing user (may not exist)
)

REM Create database
echo 📊 Creating database '%DB_NAME%'...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS %DB_NAME%;"
if %errorlevel% equ 0 (
    echo ✅ Database '%DB_NAME%' created/verified
) else (
    echo ❌ Failed to create database
    pause
    exit /b 1
)

REM Create new user with password from .env
echo 👤 Creating new user '%DB_USER%'...
mysql -u root -e "CREATE USER '%DB_USER%'@'localhost' IDENTIFIED BY '%DB_PASSWORD%';"
if %errorlevel% equ 0 (
    echo ✅ User '%DB_USER%' created successfully
) else (
    echo ❌ Failed to create user
    echo 💡 Password may not meet MySQL policy requirements
    echo    Try updating SQL_PASSWORD in .env file
    pause
    exit /b 1
)

REM Grant privileges
echo 🔐 Granting privileges to '%DB_USER%' on '%DB_NAME%'...
mysql -u root -e "GRANT ALL PRIVILEGES ON %DB_NAME%.* TO '%DB_USER%'@'localhost';"
if %errorlevel% equ 0 (
    echo ✅ Privileges granted
) else (
    echo ❌ Failed to grant privileges
    pause
    exit /b 1
)

REM Flush privileges
echo 🔄 Flushing privileges...
mysql -u root -e "FLUSH PRIVILEGES;"
if %errorlevel% equ 0 (
    echo ✅ Privileges flushed
) else (
    echo ❌ Failed to flush privileges
    pause
    exit /b 1
)

REM Test connection
echo 🧪 Testing database connection...
mysql -u "%DB_USER%" -p"%DB_PASSWORD%" -e "USE %DB_NAME%; SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database connection test successful
) else (
    echo ❌ Database connection test failed
    echo 💡 Check your .env file credentials
    pause
    exit /b 1
)

REM Setup database schema
echo 📋 Setting up database schema...
mysql -u "%DB_USER%" -p"%DB_PASSWORD%" "%DB_NAME%" < "%~dp0setup-database.sql"
if %errorlevel% equ 0 (
    echo ✅ Database schema setup completed
) else (
    echo ❌ Failed to setup database schema
    pause
    exit /b 1
)

echo.
echo 🎉 MySQL setup completed successfully!
echo 📝 Database: %DB_NAME%
echo 👤 User: %DB_USER%
echo 🔐 Password: %DB_PASSWORD%
echo.
echo ✅ Server is ready to start with these credentials
pause
