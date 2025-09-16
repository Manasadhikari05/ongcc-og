# 🔧 Complete Render Deployment Fix Guide

## 🚨 **Current Issue**
Your API endpoints are returning "Not Found" instead of proper responses. This prevents login from working.

---

## 🎯 **Step-by-Step Fix Process**

### **STEP 1: Check Current Render Service Configuration**

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Click on your service** (should be named something like "ongcc-og" or "ongc-backend")
3. **Go to Settings tab**
4. **Check these critical settings:**

#### **Service Configuration:**
```
Name: ongcc-og (or similar)
Region: Oregon (US-West) or similar
Branch: main
Root Directory: server  ← THIS IS CRITICAL!
Language: Node
Build Command: npm install
Start Command: npm start
```

#### **❌ If Root Directory is NOT "server":**
- Click "Edit" next to Root Directory
- Change it to: `server`
- Click "Save Changes"
- This will trigger automatic redeploy

---

### **STEP 2: Set Environment Variables**

1. **Go to Environment tab** in your Render service
2. **Delete all existing variables** (if any are incorrect)
3. **Add these variables ONE BY ONE:**

#### **Copy-Paste Each Variable:**

**Variable 1:**
- Key: `NODE_ENV`
- Value: `production`

**Variable 2:**
- Key: `PORT`  
- Value: `3001`

**Variable 3:**
- Key: `TRUST_PROXY`
- Value: `true`

**Variable 4:**
- Key: `AUTH_BACKEND`
- Value: `mongo`

**Variable 5:**
- Key: `MONGODB_URI`
- Value: `mongodb+srv://manasadhikari087_db_user:PyA70a3RFxeppYN2@cluster0.yonzitr.mongodb.net/ongc-internship?retryWrites=true&w=majority&appName=Cluster0`

**Variable 6:**
- Key: `MONGODB_DATABASE`
- Value: `ongc-internship`

**Variable 7:**
- Key: `JWT_SECRET`
- Value: `CKoAtln2PF4zUwT8zWyxiajBJQcKmzfFj1gOoMLN4T1KDgAuNCrfGSC+pqp0G9CPUgKz3tcOvzzNt1SELcmi1A==`

**Variable 8:**
- Key: `CORS_ORIGIN`
- Value: `https://ongcc-og-cto7.vercel.app,http://localhost:5173,http://localhost:3000`

**Variable 9:**
- Key: `EMAIL_HOST`
- Value: `smtp.gmail.com`

**Variable 10:**
- Key: `EMAIL_PORT`
- Value: `587`

**Variable 11:**
- Key: `EMAIL_USER`
- Value: `your-gmail@gmail.com` (replace with actual email)

**Variable 12:**
- Key: `EMAIL_PASS`
- Value: `your-app-password` (replace with actual Gmail app password)

**Variable 13:**
- Key: `RATE_LIMIT_WINDOW_MS`
- Value: `900000`

**Variable 14:**
- Key: `RATE_LIMIT_MAX_REQUESTS`
- Value: `500`

**Variable 15:**
- Key: `MAX_FILE_SIZE`
- Value: `10485760`

**Variable 16:**
- Key: `LOG_LEVEL`
- Value: `info`

**Variable 17:**
- Key: `LOG_FILE`
- Value: `/app/logs/ongc-server.log`

**Variable 18:**
- Key: `UPLOAD_PATH`
- Value: `/app/uploads`

4. **Click "Save Changes"** after adding all variables

---

### **STEP 3: Force Manual Deploy**

1. **Go to Manual Deploy tab**
2. **Click "Deploy Latest Commit"**
3. **Wait for deployment to complete** (watch the logs)

---

### **STEP 4: Monitor Deployment Logs**

1. **Go to Logs tab**
2. **Watch for these SUCCESS messages:**
```
✅ Connected to MongoDB successfully
📊 MongoDB Collections: users, applicants
🚀 Server running on port 3001
📊 Health check: http://localhost:3001/api/health
```

3. **Watch for ERROR messages:**
- MongoDB connection errors
- Missing environment variables
- Port binding issues

---

### **STEP 5: Test Your Deployment**

#### **Test 1: Health Check**
```bash
curl https://ongcc-og.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-15T19:15:00.000Z",
  "mongodb": "MongoDB Connected",
  "email": "Configured"
}
```

#### **Test 2: Login Endpoint**
```bash
curl -X POST https://ongcc-og.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@ongc.co.in","password":"password123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

---

### **STEP 6: Set Vercel Environment Variable**

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select project**: `ongcc-og-cto7`
3. **Go to Settings** → **Environment Variables**
4. **Add Variable:**
   - **Name**: `VITE_API_URL`
   - **Value**: `https://ongcc-og.onrender.com/api`
   - **Environments**: Check all (Production, Preview, Development)
5. **Click Save**
6. **Go to Deployments** → **Redeploy latest**

---

### **STEP 7: Test Complete Application**

1. **Visit**: https://ongcc-og-cto7.vercel.app
2. **Open Browser Console** (F12)
3. **Look for**: `🔗 API Base URL: https://ongcc-og.onrender.com/api`
4. **Try Login**:
   - Email: `hr@ongc.co.in`
   - Password: `password123`
5. **Should successfully log in!**

---

## 🚨 **If Still Not Working**

### **Common Issues:**

#### **Issue 1: Still Getting "Not Found"**
**Solution**: Root Directory is wrong
- Go to Settings → Root Directory → Change to `server`
- Redeploy

#### **Issue 2: MongoDB Connection Failed**
**Solution**: Check MongoDB URI
- Ensure password is correct: `PyA70a3RFxeppYN2`
- Check MongoDB Atlas network access

#### **Issue 3: CORS Errors**
**Solution**: Check CORS_ORIGIN
- Must include: `https://ongcc-og-cto7.vercel.app`

#### **Issue 4: Build Fails**
**Solution**: Check package.json
- Ensure `server/package.json` exists
- Ensure all dependencies are listed

---

## 🎯 **Quick Verification Checklist**

- [ ] Root Directory set to `server`
- [ ] All 18 environment variables added
- [ ] Deployment completed successfully
- [ ] Health check returns JSON (not "Not Found")
- [ ] Login endpoint returns JSON
- [ ] Vercel environment variable set
- [ ] Frontend shows correct API URL in console

---

## 🚀 **Final Test Commands**

Run these after completing all steps:

```bash
# Test 1: Health Check
curl https://ongcc-og.onrender.com/api/health

# Test 2: Login
curl -X POST https://ongcc-og.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@ongc.co.in","password":"password123"}'

# Test 3: Root path (should return 404, that's normal)
curl https://ongcc-og.onrender.com/
```

**If all tests pass, your login will work perfectly!** 🎉

---

## 📞 **Need Help?**

If you encounter specific errors:
1. Copy the exact error message from Render logs
2. Note which step failed
3. Check the troubleshooting section for that specific error

**Your application will be fully functional once these steps are completed!**