# 🚀 Vercel Environment Variables Setup

## 📋 Environment Variables for Vercel Dashboard

Go to your Vercel project settings and add these environment variables:

---

### **Required Environment Variable**

**Key:** `VITE_API_URL`  
**Value:** `https://your-render-backend-url.onrender.com/api`

*(Replace `your-render-backend-url` with your actual Render service URL)*

---

### **Optional Environment Variables**

**Key:** `VITE_APP_NAME`  
**Value:** `ONGC Internship ATS`

**Key:** `VITE_NODE_ENV`  
**Value:** `production`

---

## ✅ **Step-by-Step Instructions**

### **Step 1: Get Your Render Backend URL**
1. Go to your Render service dashboard
2. Copy the URL (looks like `https://your-service-name.onrender.com`)
3. Add `/api` to the end

### **Step 2: Add to Vercel**
1. Go to https://vercel.com/dashboard
2. Select your project: `ongcc-og-cto7`
3. Go to **Settings** → **Environment Variables**
4. Add the variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-render-service.onrender.com/api`
   - **Environments:** Check all (Production, Preview, Development)

### **Step 3: Redeploy Vercel**
1. Go to **Deployments** tab
2. Click the three dots on latest deployment
3. Click **Redeploy**
4. Or push a small change to trigger redeploy

---

## 🧪 **Testing the Setup**

After both services are deployed with correct environment variables:

1. **Visit your Vercel app:** https://ongcc-og-cto7.vercel.app
2. **Open browser console** (F12)
3. **Look for:** `🔗 API Base URL: https://your-render-service.onrender.com/api`
4. **Try logging in** with: `hr@ongc.co.in` / `password123`

---

## 🎯 **Complete Flow Summary**

1. **Frontend (Vercel):** https://ongcc-og-cto7.vercel.app
2. **Backend (Render):** https://your-render-service.onrender.com
3. **API Endpoint:** https://your-render-service.onrender.com/api
4. **CORS Allowed:** ✅ `https://ongcc-og-cto7.vercel.app`

Your login should work perfectly once both environment variables are set!