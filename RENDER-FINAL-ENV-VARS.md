# 🚀 Final Render Environment Variables - Ready to Copy

## 📋 Complete Environment Variables for Render Dashboard

Copy these **exact** key-value pairs into your Render service's Environment section:

---

### **Core Configuration**
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
AUTH_BACKEND=mongo
```

---

### **MongoDB Configuration (FIXED)**
```
MONGODB_URI=mongodb+srv://manasadhikari087_db_user:PyA70a3RFxeppYN2@cluster0.yonzitr.mongodb.net/ongc-internship?retryWrites=true&w=majority&appName=Cluster0
```

```
MONGODB_DATABASE=ongc-internship
```

---

### **Security**
```
JWT_SECRET=CKoAtln2PF4zUwT8zWyxiajBJQcKmzfFj1gOoMLN4T1KDgAuNCrfGSC+pqp0G9CPUgKz3tcOvzzNt1SELcmi1A==
```

```
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:5173,http://localhost:3000
```

---

### **Email Configuration**
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
EMAIL_PASS=your-16-character-gmail-app-password
```

---

### **Performance & Logging**
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

## 🔧 **Critical Variables to Update**

### 1. **CORS_ORIGIN** (Update with your Vercel URL)
```
CORS_ORIGIN=https://your-actual-vercel-app-name.vercel.app,http://localhost:5173,http://localhost:3000
```

### 2. **Email Credentials** (Update with your Gmail info)
```
EMAIL_USER=your-actual-gmail@gmail.com
EMAIL_PASS=your-actual-16-char-app-password
```

---

## ✅ **Step-by-Step Instructions**

### **Step 1: Copy Environment Variables**
1. Go to your Render service dashboard
2. Click the "Environment" tab
3. Copy each variable above as individual key-value pairs
4. Click "Add" for each one

### **Step 2: Update Critical Variables**
- Replace `your-vercel-app` in `CORS_ORIGIN` with your actual Vercel app URL
- Replace email credentials with your actual Gmail details

### **Step 3: Deploy**
1. Click "Save Changes" in Render
2. Wait for automatic redeployment
3. Monitor logs for "✅ Connected to MongoDB successfully"

### **Step 4: Test**
```bash
curl https://your-render-app.onrender.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "mongodb": "MongoDB Connected",
  "email": "Configured"
}
```

---

## 🎯 **Your Fixed MongoDB URI**

**Complete URI:**
```
mongodb+srv://manasadhikari087_db_user:PyA70a3RFxeppYN2@cluster0.yonzitr.mongodb.net/ongc-internship?retryWrites=true&w=majority&appName=Cluster0
```

**Breakdown:**
- **Username:** `manasadhikari087_db_user`
- **Password:** `PyA70a3RFxeppYN2` ✅
- **Cluster:** `cluster0.yonzitr.mongodb.net`
- **Database:** `ongc-internship`
- **Options:** `retryWrites=true&w=majority&appName=Cluster0`

This should completely fix your MongoDB authentication error!