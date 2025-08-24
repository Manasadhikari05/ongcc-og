#!/usr/bin/env node

const { spawn } = require('child_process');
const { execSync } = require('child_process');
const os = require('os');

console.log('🚀 ONGC Internship ATS - Universal Start Script');
console.log('===============================================');
console.log(`🌍 Platform: ${os.platform()} (${os.arch()})`);
console.log('');

// Function to check if Docker is available
function isDockerAvailable() {
    try {
        execSync('docker --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Function to check if Docker Compose is available
function isDockerComposeAvailable() {
    try {
        execSync('docker-compose --version', { stdio: 'ignore' });
        return true;
    } catch {
        try {
            execSync('docker compose version', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }
}

// Function to start services with Docker
async function startWithDocker() {
    console.log('🐳 Starting services with Docker...');
    
    try {
        if (isDockerComposeAvailable()) {
            // Try docker-compose first (older versions)
            try {
                await runCommand('docker-compose', ['up', '-d']);
                console.log('✅ Services started with docker-compose');
            } catch {
                // Try docker compose (newer versions)
                await runCommand('docker', ['compose', 'up', '-d']);
                console.log('✅ Services started with docker compose');
            }
        } else {
            await runCommand('docker', ['compose', 'up', '-d']);
            console.log('✅ Services started with docker compose');
        }
        
        console.log('🌐 Frontend: http://localhost:80');
        console.log('🔧 Backend: http://localhost:3001');
        console.log('📊 Health check: http://localhost:3001/api/health');
        
    } catch (error) {
        console.error('❌ Docker startup failed:', error.message);
        throw error;
    }
}

// Function to start services manually
async function startManually() {
    console.log('📝 Starting services manually...');
    
    try {
        // Start backend server
        console.log('🚀 Starting backend server...');
        const backendProcess = spawn('npm', ['start'], {
            cwd: 'server',
            stdio: 'inherit',
            shell: os.platform() === 'win32'
        });
        
        // Wait a bit for backend to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
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
        
    } catch (error) {
        console.error('❌ Manual startup failed:', error.message);
        throw error;
    }
}

// Function to run command
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

// Main function
async function main() {
    try {
        // Check if Docker is available
        if (isDockerAvailable()) {
            console.log('🐳 Docker detected. Starting with Docker...');
            await startWithDocker();
        } else {
            console.log('📝 Docker not found. Starting manually...');
            await startManually();
        }
        
        console.log('');
        console.log('🎉 All services are running!');
        
    } catch (error) {
        console.error('❌ Startup failed:', error.message);
        console.log('');
        console.log('💡 Troubleshooting tips:');
        console.log('   1. Ensure all dependencies are installed: npm install');
        console.log('   2. Check if databases are running');
        console.log('   3. Verify .env file configuration');
        console.log('   4. Try running setup first: node deploy-universal.js');
        process.exit(1);
    }
}

main();
