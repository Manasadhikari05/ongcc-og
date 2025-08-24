#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const os = require('os');

console.log('🛑 ONGC Internship ATS - Universal Stop Script');
console.log('==============================================');
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

// Function to stop Docker services
async function stopDockerServices() {
    console.log('🐳 Stopping Docker services...');
    
    try {
        if (isDockerComposeAvailable()) {
            // Try docker-compose first (older versions)
            try {
                await runCommand('docker-compose', ['down']);
                console.log('✅ Docker services stopped with docker-compose');
            } catch {
                // Try docker compose (newer versions)
                await runCommand('docker', ['compose', 'down']);
                console.log('✅ Docker services stopped with docker compose');
            }
        } else {
            await runCommand('docker', ['compose', 'down']);
            console.log('✅ Docker services stopped with docker compose');
        }
        
        console.log('🐳 All Docker containers stopped');
        
    } catch (error) {
        console.error('❌ Docker stop failed:', error.message);
        throw error;
    }
}

// Function to stop manual services
async function stopManualServices() {
    console.log('📝 Stopping manual services...');
    
    try {
        // Find and kill Node.js processes
        if (os.platform() === 'win32') {
            // Windows
            try {
                execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
                console.log('✅ Node.js processes stopped');
            } catch {
                console.log('ℹ️  No Node.js processes found');
            }
        } else {
            // Unix-like systems (macOS, Linux)
            try {
                execSync('pkill -f "node.*ongc"', { stdio: 'ignore' });
                console.log('✅ Node.js processes stopped');
            } catch {
                console.log('ℹ️  No Node.js processes found');
            }
        }
        
        // Kill processes on specific ports
        const ports = [3001, 5173, 3000];
        
        for (const port of ports) {
            try {
                if (os.platform() === 'win32') {
                    // Windows - find PID using netstat
                    const output = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' }).toString();
                    const lines = output.split('\n');
                    for (const line of lines) {
                        if (line.includes(`:${port}`)) {
                            const parts = line.trim().split(/\s+/);
                            if (parts.length > 4) {
                                const pid = parts[parts.length - 1];
                                try {
                                    execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' });
                                    console.log(`✅ Process on port ${port} stopped (PID: ${pid})`);
                                } catch {
                                    // Process might already be dead
                                }
                            }
                        }
                    }
                } else {
                    // Unix-like systems
                    try {
                        const pid = execSync(`lsof -ti:${port}`, { stdio: 'pipe' }).toString().trim();
                        if (pid) {
                            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
                            console.log(`✅ Process on port ${port} stopped (PID: ${pid})`);
                        }
                    } catch {
                        // Port not in use
                    }
                }
            } catch (error) {
                // Port not in use or no process found
            }
        }
        
        console.log('✅ Manual services stopped');
        
    } catch (error) {
        console.error('❌ Manual stop failed:', error.message);
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
        console.log('🔍 Checking for running services...');
        
        // Check if Docker services are running
        if (isDockerAvailable()) {
            try {
                const dockerPs = execSync('docker ps --format "{{.Names}}"', { stdio: 'pipe' }).toString();
                if (dockerPs.includes('ongc-')) {
                    console.log('🐳 Docker services detected. Stopping...');
                    await stopDockerServices();
                } else {
                    console.log('ℹ️  No Docker services running');
                }
            } catch {
                console.log('ℹ️  No Docker services running');
            }
        }
        
        // Stop manual services
        await stopManualServices();
        
        console.log('');
        console.log('🎉 All services stopped successfully!');
        console.log('');
        console.log('💡 To start services again:');
        console.log('   - With Docker: npm run docker-up');
        console.log('   - Manually: npm start');
        console.log('   - Development: npm run dev');
        
    } catch (error) {
        console.error('❌ Stop failed:', error.message);
        console.log('');
        console.log('💡 You may need to manually stop processes:');
        if (os.platform() === 'win32') {
            console.log('   - Open Task Manager and end Node.js processes');
            console.log('   - Use: taskkill /f /im node.exe');
        } else {
            console.log('   - Use: pkill -f node');
            console.log('   - Check ports: lsof -i :3001, lsof -i :5173');
        }
        process.exit(1);
    }
}

main();
