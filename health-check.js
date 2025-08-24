#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const os = require('os');

console.log('🏥 ONGC Internship ATS - Health Check');
console.log('=====================================');
console.log(`🌍 Platform: ${os.platform()} (${os.arch()})`);
console.log('');

// Configuration
const services = [
    { name: 'Frontend (Docker)', url: 'http://localhost:80', port: 80 },
    { name: 'Frontend (Manual)', url: 'http://localhost:5173', port: 5173 },
    { name: 'Backend API', url: 'http://localhost:3001', port: 3001 },
    { name: 'MySQL Database', port: 3307, type: 'port' },
    { name: 'MongoDB Database', port: 27018, type: 'port' }
];

// Function to check if port is open
function checkPort(port) {
    return new Promise((resolve) => {
        const net = require('net');
        const socket = new net.Socket();
        
        socket.setTimeout(2000);
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, 'localhost');
    });
}

// Function to check HTTP endpoint
function checkHttp(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, { timeout: 5000 }, (res) => {
            resolve({ status: res.statusCode, healthy: res.statusCode < 400 });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({ status: 'timeout', healthy: false });
        });
        
        req.on('error', () => {
            resolve({ status: 'error', healthy: false });
        });
        
        req.setTimeout(5000);
    });
}

// Function to check Docker services
function checkDockerServices() {
    try {
        const output = execSync('docker ps --format "{{.Names}} {{.Status}}"', { stdio: 'pipe' }).toString();
        const lines = output.trim().split('\n');
        
        const ongcServices = lines.filter(line => line.includes('ongc-'));
        
        if (ongcServices.length > 0) {
            console.log('🐳 Docker Services:');
            ongcServices.forEach(service => {
                const [name, ...statusParts] = service.split(' ');
                const status = statusParts.join(' ');
                const isHealthy = status.includes('Up') && !status.includes('unhealthy');
                console.log(`   ${name}: ${isHealthy ? '✅' : '❌'} ${status}`);
            });
            return true;
        } else {
            console.log('🐳 Docker Services: ❌ No ONGC services running');
            return false;
        }
    } catch (error) {
        console.log('🐳 Docker Services: ❌ Docker not available or no services running');
        return false;
    }
}

// Function to check system resources
function checkSystemResources() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = ((usedMem / totalMem) * 100).toFixed(1);
    
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    console.log('💻 System Resources:');
    console.log(`   Memory: ${(usedMem / 1024 / 1024 / 1024).toFixed(1)}GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(1)}GB (${memUsage}%)`);
    console.log(`   CPU Cores: ${cpus.length}`);
    console.log(`   Load Average: ${loadAvg[0].toFixed(2)} (1m), ${loadAvg[1].toFixed(2)} (5m), ${loadAvg[2].toFixed(2)} (15m)`);
    
    return memUsage < 90; // Consider healthy if memory usage < 90%
}

// Function to check Node.js processes
function checkNodeProcesses() {
    try {
        if (os.platform() === 'win32') {
            // Windows
            const output = execSync('tasklist /fi "imagename eq node.exe" /fo csv', { stdio: 'pipe' }).toString();
            const lines = output.trim().split('\n').slice(1); // Skip header
            const nodeCount = lines.length;
            console.log(`📝 Node.js Processes: ${nodeCount > 0 ? '✅' : '❌'} ${nodeCount} processes running`);
            return nodeCount > 0;
        } else {
            // Unix-like systems
            const output = execSync('pgrep -c node', { stdio: 'pipe' }).toString();
            const nodeCount = parseInt(output.trim()) || 0;
            console.log(`📝 Node.js Processes: ${nodeCount > 0 ? '✅' : '❌'} ${nodeCount} processes running`);
            return nodeCount > 0;
        }
    } catch (error) {
        console.log('📝 Node.js Processes: ❌ No Node.js processes running');
        return false;
    }
}

// Main health check function
async function performHealthCheck() {
    console.log('🔍 Performing health checks...\n');
    
    let healthyServices = 0;
    let totalServices = services.length;
    
    // Check Docker services
    const dockerHealthy = checkDockerServices();
    console.log('');
    
    // Check system resources
    const systemHealthy = checkSystemResources();
    console.log('');
    
    // Check Node.js processes
    const nodeHealthy = checkNodeProcesses();
    console.log('');
    
    // Check individual services
    console.log('🌐 Service Health:');
    
    for (const service of services) {
        if (service.type === 'port') {
            const isHealthy = await checkPort(service.port);
            console.log(`   ${service.name}: ${isHealthy ? '✅' : '❌'} Port ${service.port} ${isHealthy ? 'open' : 'closed'}`);
            if (isHealthy) healthyServices++;
        } else {
            try {
                const result = await checkHttp(service.url);
                const isHealthy = result.healthy;
                console.log(`   ${service.name}: ${isHealthy ? '✅' : '❌'} ${result.status}`);
                if (isHealthy) healthyServices++;
            } catch (error) {
                console.log(`   ${service.name}: ❌ Error checking service`);
            }
        }
    }
    
    // Summary
    console.log('');
    console.log('📊 Health Check Summary:');
    console.log(`   Services: ${healthyServices}/${totalServices} healthy`);
    console.log(`   Docker: ${dockerHealthy ? '✅' : '❌'}`);
    console.log(`   System: ${systemHealthy ? '✅' : '❌'}`);
    console.log(`   Node.js: ${nodeHealthy ? '✅' : '❌'}`);
    
    const overallHealth = (healthyServices / totalServices) >= 0.5 && dockerHealthy && systemHealthy && nodeHealthy;
    
    console.log('');
    if (overallHealth) {
        console.log('🎉 Overall Status: ✅ HEALTHY');
        console.log('💡 Your ONGC ATS is running properly!');
    } else {
        console.log('⚠️  Overall Status: ❌ UNHEALTHY');
        console.log('💡 Some services may need attention.');
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Check if services are running: npm start');
        console.log('   2. Restart with Docker: npm run docker-up');
        console.log('   3. Check logs: npm run docker-logs');
        console.log('   4. Setup databases: npm run setup-db');
    }
    
    return overallHealth;
}

// Run health check
performHealthCheck().catch(error => {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
});
