#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 ONGC Internship ATS - Universal Deployment Script');
console.log('==================================================');
console.log(`🌍 Platform: ${os.platform()} (${os.arch()})`);
console.log('');

// Check if .env file exists
const envPath = path.join('server', '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    const envExamplePath = path.join('server', 'env.example');
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created. Please update it with your configuration.');
        console.log('⚠️  IMPORTANT: Update server/.env with your database and email credentials before continuing.');
        
        if (os.platform() === 'win32') {
            console.log('Press Enter after updating .env file...');
            require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            }).question('', () => {});
        } else {
            console.log('Press Enter after updating .env file...');
            require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            }).question('', () => {});
        }
    } else {
        console.log('❌ env.example file not found. Please create server/.env manually.');
        process.exit(1);
    }
}

// Function to run command and handle output
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: os.platform() === 'win32',
            ...options
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        
        child.on('error', (err) => {
            reject(err);
        });
    });
}

// Function to check if Docker is available
function isDockerAvailable() {
    try {
        execSync('docker --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

async function main() {
    try {
        // Install server dependencies
        console.log('📦 Installing server dependencies...');
        await runCommand('npm', ['install'], { cwd: 'server' });
        
        // Setup database
        console.log('🗄️  Setting up database...');
        await runCommand('npm', ['run', 'setup-db'], { cwd: 'server' });
        
        // Install frontend dependencies
        console.log('📦 Installing frontend dependencies...');
        await runCommand('npm', ['install'], { cwd: 'Frontend' });
        
        // Build frontend
        console.log('🔨 Building frontend...');
        await runCommand('npm', ['run', 'build'], { cwd: 'Frontend' });
        
        // Start services
        console.log('🚀 Starting services...');
        
        // Check if Docker is available
        if (isDockerAvailable()) {
            console.log('🐳 Using Docker Compose for deployment...');
            await runCommand('docker-compose', ['up', '-d']);
            console.log('✅ Services started with Docker Compose');
            console.log('🌐 Frontend: http://localhost:80');
            console.log('🔧 Backend: http://localhost:3001');
        } else {
            console.log('📝 Docker not found. Starting services manually...');
            
            // Start backend server
            console.log('🚀 Starting backend server...');
            const backendProcess = spawn('npm', ['start'], {
                cwd: 'server',
                stdio: 'inherit',
                shell: os.platform() === 'win32'
            });
            
            // Start frontend server
            console.log('🚀 Starting frontend server...');
            const frontendProcess = spawn('npm', ['run', 'dev'], {
                cwd: 'Frontend',
                stdio: 'inherit',
                shell: os.platform() === 'win32'
            });
            
            console.log('✅ Services started manually');
            console.log('🌐 Frontend: http://localhost:5173');
            console.log('🔧 Backend: http://localhost:3001');
            console.log('📝 To stop services: Close the terminal or press Ctrl+C');
            
            // Handle process termination
            process.on('SIGINT', () => {
                console.log('\n🛑 Stopping services...');
                backendProcess.kill();
                frontendProcess.kill();
                process.exit(0);
            });
            
            // Keep the process running
            await new Promise(() => {});
        }
        
        console.log('');
        console.log('🎉 Deployment complete!');
        console.log('📊 Health check: http://localhost:3001/api/health');
        console.log('🔐 Login: http://localhost:80 (or :5173 if running manually)');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

main();
