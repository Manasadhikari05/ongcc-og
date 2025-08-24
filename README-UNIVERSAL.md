# ONGC Internship ATS - Cross Platform

A modern Application Tracking System for ONGC Internships that works seamlessly on **Windows**, **macOS**, and **Linux**.

## 🌍 Platform Support

- ✅ **Windows 10/11** (PowerShell, Command Prompt)
- ✅ **macOS** (Intel & Apple Silicon)
- ✅ **Linux** (Ubuntu, CentOS, RHEL, etc.)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16.0.0 or higher
- **npm** 8.0.0 or higher
- **MySQL** 8.0 or higher (optional, Docker alternative available)
- **MongoDB** 6.0 or higher (optional, Docker alternative available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ongcRepo
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Setup environment**
   ```bash
   # Copy environment template
   cp server/env.example server/.env
   
   # Edit server/.env with your configuration
   # Update database credentials, email settings, etc.
   ```

4. **Setup databases**
   ```bash
   npm run setup-db
   ```

5. **Start the application**
   ```bash
   npm start
   ```

## 🐳 Docker Deployment (Recommended)

If you have Docker installed, the application will automatically use it:

```bash
# Start all services
npm run docker-up

# View logs
npm run docker-logs

# Stop services
npm run docker-down
```

## 🔧 Manual Deployment

### Windows

```cmd
# Using batch files
deploy.bat

# Or using Node.js
node deploy-universal.js
```

### macOS

```bash
# Using shell scripts
chmod +x deploy.sh
./deploy.sh

# Or using Node.js
node deploy-universal.js
```

### Linux

```bash
# Using shell scripts
chmod +x deploy.sh
./deploy.sh

# Or using Node.js
node deploy-universal.js
```

## 📁 Project Structure

```
ongcRepo/
├── Frontend/                 # React + TypeScript frontend
├── server/                   # Node.js backend
├── deploy-universal.js      # Cross-platform deployment script
├── start-universal.js       # Cross-platform start script
├── docker-compose.yml       # Docker services configuration
├── package.json             # Root package.json with cross-platform scripts
└── README-UNIVERSAL.md      # This file
```

## 🗄️ Database Setup

### MySQL Setup

The application automatically detects your platform and uses the appropriate setup method:

- **Windows**: `setup-mysql.bat`
- **macOS**: `setup-mysql-macos.sh`
- **Linux**: `setup-mysql.sh`
- **Universal**: `setup-db-universal.js` (Node.js-based)

### MongoDB Setup

MongoDB setup is handled automatically through the universal setup script.

## 🌐 Access Points

- **Frontend**: http://localhost:3000 (Docker) or http://localhost:5173 (manual)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🛠️ Development

```bash
# Start development mode
npm run dev

# Build frontend
npm run build

# Setup database only
npm run setup-db
```

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**
   - Change ports in `docker-compose.yml` or `.env` files
   - Kill processes using the ports: `lsof -ti:3001 | xargs kill -9`

2. **Database connection issues**
   - Verify MySQL/MongoDB is running
   - Check credentials in `server/.env`
   - Use Docker for consistent database setup

3. **Permission issues (Linux/macOS)**
   ```bash
   chmod +x *.sh
   chmod +x server/scripts/*.sh
   ```

4. **Node.js version issues**
   - Use Node.js 16+ and npm 8+
   - Consider using `nvm` for version management

### Platform-Specific Notes

#### Windows
- PowerShell or Command Prompt supported
- MySQL must be in PATH or use Docker
- Use `deploy.bat` for traditional batch deployment

#### macOS
- Homebrew recommended for MySQL installation
- `brew install mysql` and `brew services start mysql`
- Use `setup-mysql-macos.sh` for MySQL setup

#### Linux
- System package manager for MySQL installation
- `sudo systemctl start mysql` to start MySQL service
- Use `setup-mysql.sh` for MySQL setup

## 📚 Scripts Reference

### Root Package.json Scripts

- `npm run install-all` - Install all dependencies
- `npm run setup` - Full deployment setup
- `npm run start` - Start all services
- `npm run dev` - Development mode
- `npm run build` - Build frontend
- `npm run docker-up` - Start Docker services
- `npm run docker-down` - Stop Docker services
- `npm run setup-db` - Setup databases only

### Server Package.json Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup-db` - Setup databases using universal script
- `npm run setup-mysql` - Windows MySQL setup
- `npm run setup-mysql-unix` - Unix/Linux MySQL setup

## 🔐 Environment Variables

Create `server/.env` with:

```env
# Database Configuration
SQL_HOST=localhost
SQL_PORT=3306
SQL_DATABASE=ongc_auth
SQL_USER=ongc_user
SQL_PASSWORD=your_password

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ongc-internship
MONGODB_DATABASE=ongc-internship

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple platforms
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review platform-specific notes
3. Check Docker logs if using Docker
4. Create an issue with platform information

---

**Happy coding across all platforms! 🎉**
