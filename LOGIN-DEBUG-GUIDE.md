# 🔍 Login Debug Guide - Step by Step

## 🚨 **Current Status**
- ✅ Backend: Working perfectly (https://ongcc-og-1.onrender.com)
- ✅ Frontend: Loading correctly (https://ongcc-og-cto7.vercel.app)
- ❌ Login: Not working

---

## 🧪 **Step-by-Step Debug Process**

### **STEP 1: Check Vercel Environment Variable**

**Critical**: Did you update Vercel with the new backend URL?

1. **Go to**: https://vercel.com/dashboard
2. **Select**: `ongcc-og-cto7`
3. **Settings** → **Environment Variables**
4. **Check if you have**:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://ongcc-og-1.onrender.com/api` ⚠️ **Must have `-1`**

**If missing or wrong**: Add/update it and redeploy Vercel.

---

### **STEP 2: Browser Console Debug**

1. **Visit**: https://ongcc-og-cto7.vercel.app
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Look for these messages**:

#### **✅ Expected (Good)**:
```
🔗 API Base URL: https://ongcc-og-1.onrender.com/api
🔗 Auth API Base URL: https://ongcc-og-1.onrender.com/api
```

#### **❌ Problem Signs**:
```
🔗 API Base URL: /api
🔗 Auth API Base URL: /api
```
*This means Vercel environment variable not set*

```
🔗 API Base URL: https://ongcc-og.onrender.com/api
```
*This means using old URL (missing `-1`)*

---

### **STEP 3: Network Tab Debug**

1. **Stay in Developer Tools**
2. **Go to Network tab**
3. **Clear network log** (🚫 button)
4. **Try to login** with `hr@ongc.co.in` / `password123`
5. **Look for the login request**

#### **Find the request to `/auth/login`**:

**✅ Good Request URL**:
```
https://ongcc-og-1.onrender.com/api/auth/login
```

**❌ Problem URLs**:
```
https://ongcc-og-cto7.vercel.app/api/auth/login  (frontend URL)
https://ongcc-og.onrender.com/api/auth/login     (old backend URL)
/api/auth/login                                   (relative URL)
```

#### **Check Response**:
- **Status 200**: ✅ Login successful
- **Status 404**: ❌ Wrong URL or backend down
- **Status 401**: ❌ Wrong credentials
- **Status 0 or CORS error**: ❌ CORS issue

---

### **STEP 4: Test Backend Directly**

Run this command to test backend:

```bash
curl -X POST https://ongcc-og-1.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://ongcc-og-cto7.vercel.app" \
  -d '{"email":"hr@ongc.co.in","password":"password123"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

---

## 🔧 **Common Issues & Fixes**

### **Issue 1: Environment Variable Not Set**
**Symptom**: Console shows `/api` instead of full URL
**Fix**: 
1. Add `VITE_API_URL=https://ongcc-og-1.onrender.com/api` in Vercel
2. Redeploy Vercel

### **Issue 2: Wrong Backend URL**
**Symptom**: Console shows old URL without `-1`
**Fix**: Update Vercel environment variable to include `-1`

### **Issue 3: CORS Error**
**Symptom**: Network tab shows CORS error
**Fix**: Check CORS_ORIGIN in Render includes your Vercel URL

### **Issue 4: 404 Error**
**Symptom**: Login request returns 404
**Fix**: Backend might be down or URL wrong

### **Issue 5: 401 Unauthorized**
**Symptom**: Login request returns 401
**Fix**: Wrong credentials or JWT secret issue

---

## 🚀 **Quick Fix Checklist**

### **Fix 1: Vercel Environment Variable**
```bash
# In Vercel Dashboard:
VITE_API_URL=https://ongcc-og-1.onrender.com/api

# Then redeploy Vercel
```

### **Fix 2: Clear Browser Cache**
```bash
# In browser:
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Or clear site data (F12 → Application → Clear Storage)
```

### **Fix 3: Test Different Browser**
Try logging in with a different browser or incognito mode.

---

## 🆘 **If Still Not Working**

### **Debug Information Needed**:

1. **Console Output**: What do you see in browser console?
2. **Network Request**: What URL is the login request going to?
3. **Response**: What's the response status and body?
4. **Vercel Env**: Is `VITE_API_URL` set correctly?

### **Manual Test**:

Try this direct API call in browser console:

```javascript
fetch('https://ongcc-og-1.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'hr@ongc.co.in',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => console.log('Login Response:', data))
.catch(err => console.log('Login Error:', err));
```

---

## 📞 **Next Steps**

1. **Check browser console** - what API URL is shown?
2. **Check network tab** - where is login request going?
3. **Verify Vercel environment variable** - is it set correctly?
4. **Try manual fetch** - does direct API call work?

**Once we identify which step is failing, we can fix it immediately!**