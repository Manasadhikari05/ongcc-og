#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 JWT Secret Generator for ONGC ATS');
console.log('=====================================\n');

// Generate a cryptographically secure random string
function generateJWTSecret(length = 64) {
    return crypto.randomBytes(length).toString('base64');
}

// Generate multiple options
console.log('Choose one of these secure JWT secrets for your Render deployment:\n');

for (let i = 1; i <= 3; i++) {
    const secret = generateJWTSecret();
    console.log(`Option ${i}:`);
    console.log(secret);
    console.log('');
}

console.log('📝 Instructions:');
console.log('1. Copy one of the above secrets');
console.log('2. Use it as your JWT_SECRET environment variable in Render');
console.log('3. Keep it secure and never share it publicly');
console.log('');
console.log('💡 Why use a strong JWT secret?');
console.log('- Prevents token forgery attacks');
console.log('- Ensures authentication security');
console.log('- Required for production deployments');