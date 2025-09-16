# 🚨 Login Issue Troubleshooting Guide

## 🔍 **Current Problem**

Your backend is returning "Not Found" for all API endpoints, which means:
- ❌ API routes are not being served correctly
- ❌ Login cannot work because `/api/auth/login` returns 404
- ❌ Health check fails because `/api/health` returns 404

## 🧪 **Current Status**

### ✅ **Working:**
- Frontend: https://ongcc-og-cto7.vercel.app (loads correctly)
- Backend service: https://ongcc-og.onrender.com (server is running)
- MongoDB connection: Working (from previous logs)

### ❌ **Not Working:**
- API routes: `/api/health` → "Not Found"
- Login endpoint: `/api/auth/login` → "Not Found"

## 🔧 **Possible Causes & Solutions**

### **1. Environment Variables Missing**
**Check**: Are all environment variables set in Render?

**Required Variables:**
```
NODE_ENV=production
PORT=3001
AUTH_BACKEND=mongo
MONGODB_URI=mongodb+srv://manasadhikari087_db_user:PyA70a3RFxeppYN2@cluster0.yonzitr.mongodb.net/ongc-internship?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=CKoAtln2PF4zUwT8zWyxiajBJQcKmzfFj1gOoMLN4T1KDgAuNCrfGSC+pqp0G9CPUgKz3tcOvzzNt1SELcmi1A==
CORS_ORIGIN=https://ongcc-og-cto7.vercel.app,http://localhost:5173,http://localhost:3000
```

### **2. Render Service Configuration**
**Check**: Render service settings
- Build Command: `npm install`
- Start Command: `npm start` or `node index.js`
- Root Directory: `server` (if deploying from server folder)

### **3. Application Build Issues**
**Check**: Render deployment logs for errors

## 🚀 **Immediate Action Steps**

### **Step 1: Check Render Logs**
1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for errors during startup

### **Step 2: Verify Environment Variables**
1. Go to "Environment" tab in Render
2. Ensure ALL required variables are set
3. Click "Deploy" to restart with new variables

### **Step 3: Check Service Configuration**
1. Go to "Settings" tab
2. Verify:
   - **Root Directory**: Should be `server` if deploying backend
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### **Step 4: Force Redeploy**
1. Go to "Manual Deploy"
2. Click "Deploy Latest Commit"
3. Monitor logs during deployment

## 🧪 **Test After Each Fix**

Run this command to test:
```bash
curl https://ongcc-og.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T19:10:00.000Z",
  "mongodb": "MongoDB Connected",
  "email": "Configured"
}
```

## 🔍 **Diagnostic Commands**

### **Test Backend Health:**
```bash
curl https://ongcc-og.onrender.com/api/health
```

### **Test Root Path:**
```bash
curl https://ongcc-og.onrender.com/
```

### **Test Login Endpoint:**
```bash
curl -X POST https://ongcc-og.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@ongc.co.in","password":"password123"}'
```

## 🆘 **If Still Not Working**

### **Check These Common Issues:**

1. **Wrong Root Directory**: If you deployed from root instead of `server` folder
2. **Missing Environment Variables**: Critical variables not set
3. **Build Failure**: Check logs for npm install errors
4. **Port Issues**: Server not binding to correct port
5. **Code Issues**: Recent changes broke the server

### **Quick Fix: Redeploy from Server Folder**

If deployed from wrong directory:
1. Create new Render service
2. Connect to same GitHub repo
3. Set **Root Directory** to `server`
4. Add all environment variables
5. Deploy

## 📞 **Next Steps**

1. **Check Render logs** for specific error messages
2. **Verify environment variables** are all set correctly
3. **Confirm service configuration** (root directory, build/start commands)
4. **Test endpoints** after each change

Once the API endpoints start responding correctly, login will work immediately!