#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🧪 ONGC ATS - Deployment Test Script');
console.log('=====================================\n');

// Configuration - UPDATE THESE URLs
const BACKEND_URL = 'https://your-render-backend.onrender.com';
const FRONTEND_URL = 'https://your-vercel-app.vercel.app';

// Test functions
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testBackendHealth() {
    console.log('🏥 Testing Backend Health...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/health`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        return response.status === 200;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function testLogin() {
    console.log('🔐 Testing Login Endpoint...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': FRONTEND_URL
            },
            body: JSON.stringify({
                email: 'hr@ongc.co.in',
                password: 'password123'
            })
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        console.log(`   CORS Headers: ${response.headers['access-control-allow-origin']}`);
        
        return response.status === 200 && response.data.success;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function testCORS() {
    console.log('🌐 Testing CORS Configuration...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/health`, {
            method: 'OPTIONS',
            headers: {
                'Origin': FRONTEND_URL,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   CORS Origin: ${response.headers['access-control-allow-origin']}`);
        console.log(`   CORS Methods: ${response.headers['access-control-allow-methods']}`);
        console.log(`   CORS Headers: ${response.headers['access-control-allow-headers']}`);
        
        return response.headers['access-control-allow-origin'] === FRONTEND_URL || 
               response.headers['access-control-allow-origin'] === '*';
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log(`🎯 Testing deployment with:`);
    console.log(`   Backend:  ${BACKEND_URL}`);
    console.log(`   Frontend: ${FRONTEND_URL}\n`);
    
    const results = {
        health: await testBackendHealth(),
        cors: await testCORS(),
        login: await testLogin()
    };
    
    console.log('\n📊 Test Results:');
    console.log(`   Backend Health: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   CORS Setup: ${results.cors ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Login Test: ${results.login ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(result => result);
    
    console.log(`\n🎉 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (!allPassed) {
        console.log('\n🔧 Troubleshooting Tips:');
        if (!results.health) {
            console.log('   - Check if backend is deployed and running on Render');
            console.log('   - Verify the backend URL is correct');
        }
        if (!results.cors) {
            console.log('   - Add your Vercel URL to CORS_ORIGIN in Render environment variables');
            console.log('   - Redeploy the backend after updating environment variables');
        }
        if (!results.login) {
            console.log('   - Check database connection');
            console.log('   - Verify user credentials exist in database');
            console.log('   - Check Render logs for authentication errors');
        }
    } else {
        console.log('\n🚀 Your deployment should be working now!');
        console.log('   Try logging in with: hr@ongc.co.in / password123');
    }
}

// Update URLs and run tests
if (BACKEND_URL.includes('your-render-backend') || FRONTEND_URL.includes('your-vercel-app')) {
    console.log('❌ Please update the URLs at the top of this script with your actual deployment URLs');
    console.log('   BACKEND_URL: Your Render service URL');
    console.log('   FRONTEND_URL: Your Vercel app URL');
    process.exit(1);
}

runTests().catch(console.error);