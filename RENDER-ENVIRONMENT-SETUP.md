# Render Environment Variables Setup Guide

## 🚀 How to Configure Environment Variables in Render

### Method 1: Using Render Dashboard (Recommended)

1. **Go to your Render service dashboard**
2. **Click "Environment" tab**
3. **Add each variable individually** (copy from the list below)
4. **Click "Deploy" to apply changes**

### Method 2: Using Environment File (Alternative)

1. **Create a `.env` file** with the variables below
2. **Upload it during service creation** or update via dashboard

---

## 📝 Environment Variables to Set in Render

### ✅ **Copy these Key-Value pairs into Render Dashboard:**

```
NODE_ENV=production
```

```
PORT=3001
```

```
TRUST_PROXY=true
```

```
JWT_SECRET=ONGC2024SuperSecureJWTSecretKeyForProductionUseOnlyChangeThis123456
```

```
AUTH_BACKEND=mongo
```

```
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:5173,http://localhost:3000
```

```
MONGODB_URI=mongodb+srv://manasadhikari087_db_user:YOUR_ACTUAL_PASSWORD@cluster0.yonzitr.mongodb.net/ongc-internship?retryWrites=true&w=majority&appName=Cluster0
```

```
MONGODB_DATABASE=ongc-internship
```

```
EMAIL_HOST=smtp.gmail.com
```

```
EMAIL_PORT=587
```

```
EMAIL_USER=your-gmail-email@gmail.com
```

```
EMAIL_PASS=your-gmail-app-password
```

```
RATE_LIMIT_WINDOW_MS=900000
```

```
RATE_LIMIT_MAX_REQUESTS=500
```

```
MAX_FILE_SIZE=10485760
```

```
LOG_LEVEL=info
```

```
LOG_FILE=/app/logs/ongc-server.log
```

```
UPLOAD_PATH=/app/uploads
```

---

## 🔑 **Critical Variables to Update**

### 1. **CORS_ORIGIN** (Most Important!)
```
CORS_ORIGIN=https://your-actual-vercel-app.vercel.app,http://localhost:5173
```
**Replace `your-actual-vercel-app` with your real Vercel app name**

### 2. **JWT_SECRET**
```
JWT_SECRET=ONGC2024SuperSecureJWTSecretKeyForProductionUseOnlyChangeThis123456
```
**Or generate a new one:** https://generate-random.org/api-key-generator

### 3. **MONGODB_URI**
```
MONGODB_URI=mongodb+srv://manasadhikari087_db_user:YOUR_ACTUAL_PASSWORD@cluster0.yonzitr.mongodb.net/ongc-internship?retryWrites=true&w=majority&appName=Cluster0
```
**Replace `YOUR_ACTUAL_PASSWORD` with your MongoDB password**

### 4. **Email Configuration**
```
EMAIL_USER=your-gmail-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**To get Gmail App Password:**
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate password for "Mail"
4. Use the 16-character password (no spaces)

---

## 🎯 **Quick Setup Checklist**

- [ ] Create Render web service from GitHub repo
- [ ] Add all environment variables listed above
- [ ] Update `CORS_ORIGIN` with your Vercel URL
- [ ] Update `MONGODB_URI` with correct password
- [ ] Update `JWT_SECRET` with secure key
- [ ] Update email credentials (`EMAIL_USER` and `EMAIL_PASS`)
- [ ] Click "Deploy" in Render
- [ ] Wait for deployment to complete
- [ ] Test health endpoint: `https://your-render-app.onrender.com/api/health`

---

## 🧪 **Testing Your Deployment**

### 1. **Health Check**
```bash
curl https://your-render-app.onrender.com/api/health
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

### 2. **Login Test**
```bash
curl -X POST https://your-render-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@ongc.co.in","password":"password123"}'
```

Should return success with token.

---

## 🚨 **Common Issues & Solutions**

### Issue 1: "MongoDB connection failed"
- **Solution**: Check `MONGODB_URI` password is correct
- **Solution**: Whitelist Render IP in MongoDB Atlas

### Issue 2: "CORS error"
- **Solution**: Update `CORS_ORIGIN` with exact Vercel URL
- **Solution**: Redeploy after updating CORS settings

### Issue 3: "Email not configured"
- **Solution**: Set up Gmail App Password
- **Solution**: Check `EMAIL_USER` and `EMAIL_PASS` are correct

### Issue 4: "Service won't start"
- **Solution**: Check Render logs for specific error
- **Solution**: Verify all required environment variables are set

---

## 🔐 **Security Best Practices**

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (32+ characters)
3. **Use Gmail App Passwords** instead of regular passwords
4. **Whitelist specific origins** in CORS (don't use `*`)
5. **Monitor Render logs** for suspicious activity

---

## 📞 **Need Help?**

If you encounter issues:
1. Check Render service logs
2. Test individual endpoints
3. Verify environment variables are set correctly
4. Use the test script provided earlier

Your backend should be fully functional once these environment variables are properly configured!