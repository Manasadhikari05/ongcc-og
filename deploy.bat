@echo off
chcp 65001 >nul
echo 🚀 ONGC Internship ATS - Windows Deployment Script
echo ================================================

REM Check if .env file exists
if not exist "server\.env" (
    echo 📝 Creating .env file from template...
    copy "server\env.example" "server\.env"
    echo ✅ .env file created. Please update it with your configuration.
    echo ⚠️  IMPORTANT: Update server\.env with your database and email credentials before continuing.
    pause
)

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
call npm install

REM Setup database
echo 🗄️ Setting up database...
call npm run setup-db

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\Frontend
call npm install

REM Build frontend
echo 🔨 Building frontend...
call npm run build

REM Start services
echo 🚀 Starting services...
cd ..

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 🐳 Using Docker Compose for deployment...
    docker-compose up -d
    echo ✅ Services started with Docker Compose
    echo 🌐 Frontend: http://localhost:80
    echo 🔧 Backend: http://localhost:3001
) else (
    echo 📝 Docker not found. Starting services manually...
    echo 🚀 Starting backend server...
    cd server
    start "Backend Server" cmd /k "npm start"
    
    echo 🚀 Starting frontend server...
    cd ..\Frontend
    start "Frontend Server" cmd /k "npm run dev"
    
    echo ✅ Services started manually
    echo 🌐 Frontend: http://localhost:5173
    echo 🔧 Backend: http://localhost:3001
    echo 📝 Close the command windows to stop services
)

echo.
echo 🎉 Deployment complete!
echo 📊 Health check: http://localhost:3001/api/health
echo 🔐 Login: http://localhost:80 (or :5173 if running manually)
pause
