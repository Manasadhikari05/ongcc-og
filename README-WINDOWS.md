# ONGC Internship ATS - Windows Setup Guide

This guide will help you set up and run the ONGC Internship ATS project on Windows with Node.js 22.18.0.

## 🚀 Quick Start

1. **Run the setup script**: Double-click `setup-windows.bat`
2. **Update configuration**: Edit `server\.env` with your credentials
3. **Start the application**: Double-click `start-windows.bat`

## 📋 Prerequisites

### Required Software
- **Node.js 18.x or later** (you have 22.18.0 ✅)
- **npm** (comes with Node.js)
- **MySQL Server** (for authentication database)

### Optional Software
- **MongoDB** (for applicant data storage)
- **Docker Desktop** (for containerized deployment)
- **Git** (for version control)

## 🛠️ Installation Steps

### 1. Install Node.js
- Download from [nodejs.org](https://nodejs.org/)
- Choose LTS version (18.x or later)
- Your version 22.18.0 is perfect ✅

### 2. Install MySQL Server
**Option A: MySQL Installer**
- Download from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
- Choose "MySQL Installer for Windows"
- Install MySQL Server and MySQL Workbench

**Option B: XAMPP (Easier)**
- Download from [Apache Friends](https://www.apachefriends.org/)
- Install XAMPP with MySQL
- Start MySQL service from XAMPP Control Panel

### 3. Install MongoDB (Optional)
- Download from [MongoDB Community](https://www.mongodb.com/try/download/community)
- Install MongoDB Server
- Add MongoDB bin directory to PATH

### 4. Install Docker Desktop (Optional)
- Download from [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Install Docker Desktop for Windows
- Enable WSL 2 if prompted

## 🔧 Configuration

### 1. Environment Setup
Run `setup-windows.bat` to check your environment and create configuration files.

### 2. Update .env File
Edit `server\.env` with your credentials:

```env
# Database Configuration
SQL_PASSWORD=your_mysql_password
SQL_HOST=localhost
SQL_PORT=3306

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Optional: MongoDB
MONGODB_URI=mongodb://localhost:27017/ongc-internship
```

### 3. Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password"
3. Use the app password in `EMAIL_PASS`

## 🚀 Running the Application

### Method 1: Automated Startup (Recommended)
1. Double-click `start-windows.bat`
2. The script will:
   - Install dependencies
   - Setup databases
   - Build frontend
   - Start services

### Method 2: Manual Startup
1. **Start Backend**:
   ```cmd
   cd server
   npm install
   npm run setup-db
   npm start
   ```

2. **Start Frontend** (in new terminal):
   ```cmd
   cd Frontend
   npm install
   npm run dev
   ```

### Method 3: Docker (if installed)
```cmd
docker-compose up -d
```

## 🌐 Access URLs

- **Frontend**: http://localhost:5173 (manual) or http://localhost:80 (Docker)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🗄️ Database Setup

### MySQL Setup
The application will automatically:
1. Create database `ongc_auth`
2. Create user with privileges
3. Setup authentication tables

### MongoDB Setup (Optional)
If MongoDB is installed, the application will:
1. Connect to local MongoDB instance
2. Create collections for applicant data

## 🔍 Troubleshooting

### Common Issues

**1. MySQL Connection Failed**
- Ensure MySQL service is running
- Check credentials in `.env` file
- Verify MySQL is accessible from command line: `mysql -u root -p`

**2. Port Already in Use**
- Check if ports 3001 or 5173 are available
- Stop other services using these ports
- Use `netstat -ano | findstr :3001` to check

**3. Node Modules Issues**
- Delete `node_modules` folders
- Run `npm install` in both `server` and `Frontend` directories

**4. Permission Denied**
- Run Command Prompt as Administrator
- Check Windows Defender/Firewall settings

### Error Messages

**"MySQL is not running"**
```cmd
# Start MySQL service
net start mysql
# Or use XAMPP Control Panel
```

**"Port 3001 is already in use"**
```cmd
# Find process using port 3001
netstat -ano | findstr :3001
# Kill the process
taskkill /PID <process_id> /F
```

**"Module not found"**
```cmd
# Reinstall dependencies
cd server && npm install
cd ../Frontend && npm install
```

## 📁 Project Structure

```
ongcRepo/
├── Frontend/                 # React frontend application
├── server/                   # Node.js backend server
├── setup-windows.bat        # Environment setup script
├── start-windows.bat        # Application startup script
├── deploy.bat               # Deployment script
└── docker-compose.yml       # Docker configuration
```

## 🎯 Development Workflow

1. **Setup**: Run `setup-windows.bat` once
2. **Development**: Use `start-windows.bat` for daily development
3. **Testing**: Access http://localhost:3001/api/health
4. **Frontend**: Edit files in `Frontend/src/`
5. **Backend**: Edit files in `server/`

## 🔧 Scripts Reference

| Script | Purpose |
|--------|---------|
| `setup-windows.bat` | Check environment and create config files |
| `start-windows.bat` | Install dependencies and start application |
| `deploy.bat` | Deploy with Docker or manual startup |
| `server/scripts/setup-mysql.bat` | Setup MySQL database and user |

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check Windows Event Viewer for service errors
4. Ensure ports are not blocked by firewall

## 🎉 Success Indicators

Your setup is successful when:
- ✅ `setup-windows.bat` runs without errors
- ✅ MySQL connection test passes
- ✅ Frontend builds successfully
- ✅ Backend starts on port 3001
- ✅ Frontend accessible on port 5173
- ✅ Health check returns 200 OK

---

**Happy Coding! 🚀**
