# ONGC ATS - Vercel + Render Deployment Guide

## 🚨 Current Issue & Solution

You're experiencing login issues because the frontend and backend are deployed on different platforms and need proper configuration for cross-origin communication.

## 🔧 Step-by-Step Fix

### 1. Backend (Render) Configuration

#### Update your Render environment variables:
```env
# Add your Vercel frontend URL to CORS_ORIGIN
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:5173,http://localhost:3000

# Ensure these are set correctly
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production
TRUST_PROXY=true

# Database URLs
MONGODB_URI=mongodb+srv://...
SQL_HOST=...
SQL_DATABASE=...
SQL_USER=...
SQL_PASSWORD=...

# Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 2. Frontend (Vercel) Configuration

#### Create `.env.production` file:
```env
VITE_API_URL=https://your-render-backend-url.onrender.com/api
VITE_APP_NAME=ONGC Internship ATS
VITE_NODE_ENV=production
```

#### Update `vite.config.ts` for production builds:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

### 3. Deployment Steps

#### Backend (Render):
1. **Set Environment Variables** in Render dashboard
2. **Add CORS Origin**: Include your exact Vercel URL
3. **Redeploy** the service

#### Frontend (Vercel):
1. **Set Environment Variables** in Vercel dashboard:
   - `VITE_API_URL` = `https://your-render-backend.onrender.com/api`
2. **Redeploy** the application

## 🧪 Testing the Fix

### 1. Check Backend Health
```bash
curl https://your-render-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "mongodb": "MongoDB Connected",
  "email": "Configured"
}
```

### 2. Test Authentication
```bash
curl -X POST https://your-render-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@ongc.co.in","password":"password123"}'
```

### 3. Check Browser Console
Open browser dev tools and look for:
- ✅ `🔗 API Base URL: https://your-render-backend.onrender.com/api`
- ❌ Any CORS errors
- ❌ Network errors

## 🔍 Debugging Common Issues

### Issue 1: CORS Error
**Symptom**: `Access to fetch at '...' has been blocked by CORS policy`
**Solution**: Add your Vercel URL to `CORS_ORIGIN` environment variable in Render

### Issue 2: 404 Not Found
**Symptom**: API calls return 404
**Solution**: Ensure `VITE_API_URL` includes `/api` path

### Issue 3: Network Error
**Symptom**: "Network error. Please try again."
**Solution**: Check if Render backend is running and accessible

### Issue 4: Authentication Failed
**Symptom**: Login returns "Invalid credentials"
**Solution**: Check database connection and user records

## 🎯 Quick Checklist

- [ ] Render environment variables set (especially `CORS_ORIGIN`)
- [ ] Vercel environment variables set (`VITE_API_URL`)
- [ ] Backend health endpoint returns 200
- [ ] Frontend console shows correct API URL
- [ ] No CORS errors in browser console
- [ ] Database connections working
- [ ] Both services redeployed after config changes

## 🚀 Environment Variable Templates

### Render Environment Variables
```env
NODE_ENV=production
PORT=3001
TRUST_PROXY=true
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
SQL_HOST=your-mysql-host
SQL_PORT=3306
SQL_DATABASE=ongc_auth
SQL_USER=your-user
SQL_PASSWORD=your-password

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
MAX_FILE_SIZE=10485760
```

### Vercel Environment Variables
```env
VITE_API_URL=https://your-render-service.onrender.com/api
VITE_APP_NAME=ONGC Internship ATS
VITE_NODE_ENV=production
```

## 🆘 Still Having Issues?

### Check Browser Network Tab:
1. Look for the login request to `/api/auth/login`
2. Check if it's going to the correct Render URL
3. Look for response status and error messages

### Check Render Logs:
1. Go to Render dashboard
2. Click on your service
3. Check the logs for any errors during login attempts

### Verify URLs:
- Frontend URL: `https://your-app.vercel.app`
- Backend URL: `https://your-service.onrender.com`
- API URL: `https://your-service.onrender.com/api`

Contact me with specific error messages if you're still having issues!