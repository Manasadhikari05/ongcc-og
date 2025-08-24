# ONGC Internship ATS - Windows PowerShell Startup Script
# Run this script in PowerShell with execution policy: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

param(
    [switch]$SkipSetup,
    [switch]$DockerOnly,
    [switch]$ManualOnly
)

# Set console encoding for proper emoji display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🚀 ONGC Internship ATS - Windows PowerShell Startup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command($CommandName) {
    try {
        Get-Command $CommandName -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to check Node.js version
function Test-NodeVersion {
    if (-not (Test-Command "node")) {
        Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
        Write-Host "💡 Please install Node.js 18.x or later from https://nodejs.org/" -ForegroundColor Yellow
        return $false
    }
    
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    
    # Check version compatibility
    $majorVersion = $nodeVersion.Split('.')[0].Replace('v', '')
    if ([int]$majorVersion -lt 18) {
        Write-Host "⚠️ Node.js version $nodeVersion might be too old" -ForegroundColor Yellow
        Write-Host "💡 Recommended: Node.js 18.x or later" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Node.js version is compatible" -ForegroundColor Green
    }
    
    return $true
}

# Function to check required services
function Test-RequiredServices {
    Write-Host "🔍 Checking required services..." -ForegroundColor Blue
    
    # Check MySQL
    Write-Host "📊 Checking MySQL..." -ForegroundColor Blue
    if (Test-Command "mysql") {
        $mysqlVersion = mysql --version
        Write-Host "✅ MySQL client found: $mysqlVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️ MySQL client not found in PATH" -ForegroundColor Yellow
        Write-Host "💡 Make sure MySQL is installed and added to PATH" -ForegroundColor Yellow
    }
    
    # Check MongoDB (optional)
    Write-Host "📊 Checking MongoDB..." -ForegroundColor Blue
    if (Test-Command "mongosh") {
        $mongoVersion = mongosh --version
        Write-Host "✅ MongoDB client found: $mongoVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️ MongoDB client not found in PATH (optional)" -ForegroundColor Yellow
    }
    
    # Check Docker
    Write-Host "🐳 Checking Docker..." -ForegroundColor Blue
    if (Test-Command "docker") {
        $dockerVersion = docker --version
        Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
        
        if (Test-Command "docker-compose") {
            $composeVersion = docker-compose --version
            Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Docker Compose not found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Docker not found (optional)" -ForegroundColor Yellow
    }
}

# Function to install dependencies
function Install-Dependencies {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    
    # Install server dependencies
    Write-Host "🔧 Installing server dependencies..." -ForegroundColor Blue
    Set-Location "server"
    if (-not (Test-Path "node_modules")) {
        Write-Host "📥 Installing server packages..." -ForegroundColor Blue
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install server dependencies" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "✅ Server dependencies already installed" -ForegroundColor Green
    }
    
    # Install frontend dependencies
    Write-Host "🎨 Installing frontend dependencies..." -ForegroundColor Blue
    Set-Location "..\Frontend"
    if (-not (Test-Path "node_modules")) {
        Write-Host "📥 Installing frontend packages..." -ForegroundColor Blue
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
    }
    
    Set-Location ".."
    return $true
}

# Function to setup configuration
function Setup-Configuration {
    Write-Host "📝 Checking configuration..." -ForegroundColor Blue
    
    if (-not (Test-Path "server\.env")) {
        Write-Host "📝 Creating .env file from template..." -ForegroundColor Blue
        Copy-Item "server\env.example" "server\.env"
        Write-Host "✅ .env file created" -ForegroundColor Green
        Write-Host "⚠️ IMPORTANT: Please update server\.env with your database credentials" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 Required updates in server\.env:" -ForegroundColor Yellow
        Write-Host "   - SQL_PASSWORD: Your MySQL password" -ForegroundColor Yellow
        Write-Host "   - EMAIL_USER: Your email address" -ForegroundColor Yellow
        Write-Host "   - EMAIL_PASS: Your email app password" -ForegroundColor Yellow
        Write-Host ""
        
        $response = Read-Host "Press Enter after updating .env file, or 'skip' to continue without setup"
        if ($response -eq "skip") {
            return $true
        }
    } else {
        Write-Host "✅ .env file already exists" -ForegroundColor Green
    }
    
    return $true
}

# Function to setup database
function Setup-Database {
    Write-Host "🗄️ Setting up database..." -ForegroundColor Blue
    
    Set-Location "server"
    Write-Host "🚀 Running database setup..." -ForegroundColor Blue
    npm run setup-db
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Database setup failed" -ForegroundColor Red
        Write-Host "💡 Please check your MySQL connection and .env file" -ForegroundColor Yellow
        return $false
    }
    Set-Location ".."
    return $true
}

# Function to build frontend
function Build-Frontend {
    Write-Host "🔨 Building frontend..." -ForegroundColor Blue
    
    Set-Location "Frontend"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
        return $false
    }
    Set-Location ".."
    return $true
}

# Function to start services with Docker
function Start-DockerServices {
    Write-Host "🐳 Starting services with Docker..." -ForegroundColor Blue
    
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Services started with Docker Compose" -ForegroundColor Green
        Write-Host "🌐 Frontend: http://localhost:80" -ForegroundColor Cyan
        Write-Host "🔧 Backend: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "📊 Health: http://localhost:3001/api/health" -ForegroundColor Cyan
        return $true
    } else {
        Write-Host "❌ Docker Compose failed" -ForegroundColor Red
        return $false
    }
}

# Function to start services manually
function Start-ManualServices {
    Write-Host "🚀 Starting services manually..." -ForegroundColor Blue
    
    # Start backend server
    Write-Host "🔧 Starting backend server..." -ForegroundColor Blue
    Set-Location "server"
    Start-Process "cmd" -ArgumentList "/k", "npm start" -WindowStyle Normal -Title "ONGC Backend Server"
    Set-Location ".."
    
    # Start frontend server
    Write-Host "🎨 Starting frontend server..." -ForegroundColor Blue
    Set-Location "Frontend"
    Start-Process "cmd" -ArgumentList "/k", "npm run dev" -WindowStyle Normal -Title "ONGC Frontend Server"
    Set-Location ".."
    
    Write-Host "✅ Services started manually" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "🔧 Backend: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "📊 Health: http://localhost:3001/api/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 To stop services, close the command windows" -ForegroundColor Yellow
}

# Main execution
try {
    # Check Node.js
    if (-not (Test-NodeVersion)) {
        exit 1
    }
    
    # Check services
    Test-RequiredServices
    
    # Skip setup if requested
    if (-not $SkipSetup) {
        # Install dependencies
        if (-not (Install-Dependencies)) {
            exit 1
        }
        
        # Setup configuration
        if (-not (Setup-Configuration)) {
            exit 1
        }
        
        # Setup database
        if (-not (Setup-Database)) {
            exit 1
        }
        
        # Build frontend
        if (-not (Build-Frontend)) {
            exit 1
        }
    }
    
    # Start services
    Write-Host "🚀 Starting services..." -ForegroundColor Blue
    
    if ($ManualOnly) {
        Start-ManualServices
    } elseif ($DockerOnly) {
        if (Test-Command "docker") {
            Start-DockerServices
        } else {
            Write-Host "❌ Docker not available, starting manually..." -ForegroundColor Yellow
            Start-ManualServices
        }
    } else {
        # Try Docker first, fallback to manual
        if (Test-Command "docker") {
            if (Start-DockerServices) {
                # Docker started successfully
            } else {
                Write-Host "❌ Docker Compose failed, falling back to manual startup" -ForegroundColor Yellow
                Start-ManualServices
            }
        } else {
            Write-Host "📝 Docker not found, starting services manually..." -ForegroundColor Yellow
            Start-ManualServices
        }
    }
    
    Write-Host ""
    Write-Host "🎉 ONGC Internship ATS is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Quick Reference:" -ForegroundColor Cyan
    Write-Host "   🌐 Frontend: http://localhost:80 (Docker) or :5173 (Manual)" -ForegroundColor White
    Write-Host "   🔧 Backend: http://localhost:3001" -ForegroundColor White
    Write-Host "   📊 Health Check: http://localhost:3001/api/health" -ForegroundColor White
    Write-Host "   📝 Admin Login: Use credentials from your .env file" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Tips:" -ForegroundColor Cyan
    Write-Host "   - Keep this window open to see service status" -ForegroundColor White
    Write-Host "   - Use Ctrl+C to stop Docker services" -ForegroundColor White
    Write-Host "   - Close command windows to stop manual services" -ForegroundColor White
    
} catch {
    Write-Host "❌ An error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Read-Host "Press Enter to exit"
