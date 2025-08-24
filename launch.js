#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

console.log('🚀 ONGC Internship ATS - Launcher');
console.log('==================================');
console.log(`🌍 Platform: ${os.platform()} (${os.arch()})`);
console.log('');

console.log('📋 Available commands:');
console.log('   1. setup    - Initial setup and deployment');
console.log('   2. start    - Start all services');
console.log('   3. stop     - Stop all services');
console.log('   4. health   - Check system health');
console.log('   5. dev      - Development mode');
console.log('   6. docker   - Docker management');
console.log('   7. exit     - Exit launcher');
console.log('');

// Function to run command
function runCommand(command, args = []) {
    const child = spawn('node', [command, ...args], {
        stdio: 'inherit',
        shell: os.platform() === 'win32'
    });
    
    child.on('close', (code) => {
        if (code !== 0) {
            console.log(`\n❌ Command failed with exit code ${code}`);
        }
        console.log('\n' + '='.repeat(50));
        console.log('🚀 Launcher ready for next command');
        console.log('📋 Type a command or "exit" to quit');
        console.log('');
    });
}

// Function to show Docker submenu
function showDockerMenu() {
    console.log('\n🐳 Docker Management:');
    console.log('   1. up      - Start Docker services');
    console.log('   2. down    - Stop Docker services');
    console.log('   3. logs    - View Docker logs');
    console.log('   4. back    - Back to main menu');
    console.log('');
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('🐳 Docker command: ', (answer) => {
        rl.close();
        
        switch (answer.toLowerCase()) {
            case 'up':
                runCommand('start-universal.js');
                break;
            case 'down':
                runCommand('stop-universal.js');
                break;
            case 'logs':
                runCommand('docker-compose', ['logs', '-f']);
                break;
            case 'back':
                showMainMenu();
                break;
            default:
                console.log('❌ Invalid command');
                showDockerMenu();
        }
    });
}

// Function to show main menu
function showMainMenu() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('🚀 Command: ', (answer) => {
        rl.close();
        
        switch (answer.toLowerCase()) {
            case 'setup':
                runCommand('deploy-universal.js');
                break;
            case 'start':
                runCommand('start-universal.js');
                break;
            case 'stop':
                runCommand('stop-universal.js');
                break;
            case 'health':
                runCommand('health-check.js');
                break;
            case 'dev':
                runCommand('concurrently', ['"cd server && npm run dev"', '"cd Frontend && npm run dev"']);
                break;
            case 'docker':
                showDockerMenu();
                break;
            case 'exit':
                console.log('👋 Goodbye!');
                process.exit(0);
                break;
            default:
                console.log('❌ Invalid command. Please try again.');
                showMainMenu();
        }
    });
}

// Start the launcher
showMainMenu();
