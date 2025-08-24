#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🗄️  Universal Database Setup Script');
console.log('===================================');
console.log(`🌍 Platform: ${os.platform()} (${os.arch()})`);
console.log('');

// Load environment variables
function loadEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env file not found. Please create it first.');
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                envVars[key] = valueParts.join('=');
            }
        }
    });
    
    return envVars;
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

// Function to check if MySQL is available
function isMySQLAvailable() {
    try {
        execSync('mysql --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Function to check if MongoDB is available
function isMongoDBAvailable() {
    try {
        execSync('mongosh --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Function to setup MySQL
async function setupMySQL(envVars) {
    console.log('🗄️  Setting up MySQL...');
    
    if (!isMySQLAvailable()) {
        console.log('⚠️  MySQL client not found. Skipping MySQL setup.');
        console.log('💡 Please install MySQL client or use Docker.');
        return false;
    }
    
    const dbName = envVars.SQL_DATABASE || 'ongc_auth';
    const dbUser = envVars.SQL_USER || 'ongc_user';
    const dbPassword = envVars.SQL_PASSWORD || 'ongc123';
    
    try {
        // Test root connection
        console.log('🔍 Testing MySQL root connection...');
        await runCommand('mysql', ['-u', 'root', '-e', 'SELECT 1;']);
        
        // Drop existing user if exists
        console.log('🗑️  Dropping existing user if exists...');
        try {
            await runCommand('mysql', ['-u', 'root', '-e', `DROP USER IF EXISTS '${dbUser}'@'localhost';`]);
        } catch (e) {
            // Ignore errors for dropping non-existent user
        }
        
        // Create database
        console.log('📊 Creating database...');
        await runCommand('mysql', ['-u', 'root', '-e', `CREATE DATABASE IF NOT EXISTS ${dbName};`]);
        
        // Create user
        console.log('👤 Creating user...');
        await runCommand('mysql', ['-u', 'root', '-e', `CREATE USER '${dbUser}'@'localhost' IDENTIFIED BY '${dbPassword}';`]);
        
        // Grant privileges
        console.log('🔐 Granting privileges...');
        await runCommand('mysql', ['-u', 'root', '-e', `GRANT ALL PRIVILEGES ON ${dbName}.* TO '${dbUser}'@'localhost';`]);
        
        // Flush privileges
        console.log('🔄 Flushing privileges...');
        await runCommand('mysql', ['-u', 'root', '-e', 'FLUSH PRIVILEGES;']);
        
        // Test connection
        console.log('🧪 Testing connection...');
        await runCommand('mysql', ['-u', dbUser, `-p${dbPassword}`, '-e', `USE ${dbName}; SELECT 1;`]);
        
        // Setup schema
        console.log('📋 Setting up schema...');
        const schemaPath = path.join(__dirname, 'setup-database.sql');
        if (fs.existsSync(schemaPath)) {
            await runCommand('mysql', ['-u', dbUser, `-p${dbPassword}`, dbName], {
                stdio: ['pipe', 'inherit', 'inherit'],
                input: fs.readFileSync(schemaPath)
            });
        }
        
        console.log('✅ MySQL setup completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ MySQL setup failed:', error.message);
        return false;
    }
}

// Function to setup MongoDB
async function setupMongoDB(envVars) {
    console.log('🗄️  Setting up MongoDB...');
    
    if (!isMongoDBAvailable()) {
        console.log('⚠️  MongoDB client not found. Skipping MongoDB setup.');
        console.log('💡 Please install MongoDB client or use Docker.');
        return false;
    }
    
    try {
        // Test connection
        console.log('🔍 Testing MongoDB connection...');
        await runCommand('mongosh', ['--eval', 'db.adminCommand("ping")']);
        
        console.log('✅ MongoDB setup completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ MongoDB setup failed:', error.message);
        return false;
    }
}

// Main function
async function main() {
    try {
        const envVars = loadEnvFile();
        console.log('✅ Environment variables loaded');
        
        let mysqlSuccess = false;
        let mongoSuccess = false;
        
        // Setup MySQL
        if (envVars.SQL_HOST || envVars.SQL_DATABASE) {
            mysqlSuccess = await setupMySQL(envVars);
        }
        
        // Setup MongoDB
        if (envVars.MONGODB_URI || envVars.MONGODB_DATABASE) {
            mongoSuccess = await setupMongoDB(envVars);
        }
        
        console.log('');
        console.log('🎉 Database setup summary:');
        console.log(`   MySQL: ${mysqlSuccess ? '✅ Success' : '❌ Failed/Skipped'}`);
        console.log(`   MongoDB: ${mongoSuccess ? '✅ Success' : '❌ Failed/Skipped'}`);
        
        if (!mysqlSuccess && !mongoSuccess) {
            console.log('');
            console.log('💡 No databases were set up successfully.');
            console.log('   Consider using Docker: docker-compose up -d');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

main();
