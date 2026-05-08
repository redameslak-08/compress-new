# 🚀 Image Compression API - START HERE

Your complete image compression API is ready! Here's what you have and how to get started.

## 📦 What You Got

✅ **server.js** - Express API server with 2 endpoints  
✅ **package.json** - Dependencies & scripts  
✅ **.gitignore** - Git configuration  
✅ **README.md** - Complete project documentation  
✅ **DEPLOY_REPLIT.md** - Deploy to Replit (easiest)  
✅ **DEPLOY_RAILWAY.md** - Deploy to Railway (best for scale)  
✅ **N8N_INTEGRATION.md** - n8n workflow examples  
✅ **TESTING_GUIDE.md** - cURL & Postman examples  

## ⚡ Quick Start (Choose One)

### Option A: Test Locally (5 minutes)

```bash
# Install dependencies
npm install

# Start server
npm start

# Test it
curl -X POST -F "file=@image.jpg" "http://localhost:3000/api/compress?quality=50"
```

Done! API runs on `http://localhost:3000`

---

### Option B: Deploy to Replit (Free, 2 minutes)

Perfect for quick testing!

1. Go to https://replit.com
2. Create new Node.js Repl
3. Copy-paste `server.js` and `package.json` into files
4. Click "Run"
5. Your API is live with a public URL ✅

[Full Replit Guide →](./DEPLOY_REPLIT.md)

---

### Option C: Deploy to Railway (Free $5/month, Recommended)

Best for scaling later!

1. Push code to GitHub
2. Go to https://railway.app
3. Connect your repo
4. Auto-deploys in 2 minutes ✅

[Full Railway Guide →](./DEPLOY_RAILWAY.md)

## 🎯 API Endpoints

Once deployed, you have 2 endpoints:

### 1️⃣ Download Binary (Direct Image)

```bash
POST /api/compress?quality=50

# Response: Image file (JPG, PNG, WebP, GIF)
# Best for: Downloads, direct use

curl -X POST -F "file=@image.jpg" "http://api.example.com/api/compress?quality=50" -o result.jpg
```

### 2️⃣ JSON with Base64 (Best for n8n)

```bash
POST /api/compress-json?quality=70

# Response: JSON with Base64-encoded image + metadata
# Best for: n8n, automations, APIs

curl -X POST -F "file=@image.jpg" "http://api.example.com/api/compress-json?quality=70" | jq .
```

## 🎛️ Quality Parameter (1-100)

- **80** = Default, good balance
- **90-100** = High quality, bigger files
- **70** = Recommended for web
- **50** = Strong compression, visible loss
- **30** = Extreme compression

## 🔗 Use with n8n

In your n8n workflow:

1. Add HTTP Request node
2. Method: POST
3. URL: `https://your-api-url/api/compress-json?quality=70`
4. Body Type: Form Data (Multipart)
5. Parameter: name=`file`, type=`Binary Data`

[Full n8n Guide →](./N8N_INTEGRATION.md)

## 🧪 Test Your API

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

### Test 2: Compress Image
```bash
curl -X POST -F "file=@image.jpg" "http://localhost:3000/api/compress?quality=50"
```

### Test 3: Get JSON Response
```bash
curl -X POST -F "file=@image.jpg" "http://localhost:3000/api/compress-json?quality=70" | jq .
```

[More tests →](./TESTING_GUIDE.md)

## 📊 Example Results

**Original:** 2 MB JPEG  
**Quality 70:** 600 KB (70% smaller) ✅  
**Quality 50:** 300 KB (85% smaller) ✅  

Original dimensions always preserved!

## 🎨 Supported Formats

Input: JPEG, PNG, WebP, GIF  
Output: JPEG, PNG, WebP, GIF (configurable)

Convert during compression:
```bash
# PNG → JPEG
curl -X POST -F "file=@image.png" "http://api/api/compress?format=jpeg&quality=75"
```

## 🛣️ Next Steps

1. **Test Locally** (start here)
   ```bash
   npm install
   npm start
   ```

2. **Deploy for Free** (pick one)
   - [Replit (easiest)](./DEPLOY_REPLIT.md)
   - [Railway (best)](./DEPLOY_RAILWAY.md)

3. **Test Remote API**
   ```bash
   curl -X POST -F "file=@image.jpg" "https://your-deployed-url/api/compress?quality=70"
   ```

4. **Integrate with n8n**
   - [n8n Setup Guide](./N8N_INTEGRATION.md)
   - Create HTTP request node
   - Point to your API URL

5. **Scale (When Needed)**
   - Railway auto-scales
   - Docker deployment available
   - Add authentication/rate limits

## 🆘 Troubleshooting

### "No file uploaded" error
Make sure you're using:
```bash
curl -X POST -F "file=@image.jpg" "..."  ✅
```
NOT:
```bash
curl -d "@image.jpg" "..."  ❌
```

### Quality parameter not working
Add to URL, not body:
```bash
"http://api/compress?quality=50"  ✅
NOT in form body  ❌
```

### Can't upload large files
Max is 50MB. Use lower quality:
```bash
quality=30  # Smaller file
```

[More troubleshooting →](./TESTING_GUIDE.md#troubleshooting)

## 📚 Documentation

- **README.md** - Full API documentation
- **TESTING_GUIDE.md** - cURL, Postman, automation
- **N8N_INTEGRATION.md** - n8n workflows
- **DEPLOY_REPLIT.md** - Replit setup
- **DEPLOY_RAILWAY.md** - Railway setup

## 🎯 Architecture

```
Client/n8n
    ↓
HTTP Request (POST /api/compress)
    ↓
Express Server
    ↓
Sharp (Image Processing)
    ↓
Compressed Image Binary or JSON/Base64
    ↓
Response
```

## 💾 Stack

- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **Sharp** - Ultra-fast image processing
- **Multer** - File uploads
- **CORS** - Cross-origin requests

## 🚀 Ready?

**Start with:**

```bash
npm install
npm start
```

Visit: http://localhost:3000/health

Or deploy to Replit/Railway using the guides above!

---

Need help? Check the relevant guide:
- Testing? → [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- Deploy? → [DEPLOY_REPLIT.md](./DEPLOY_REPLIT.md) or [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md)
- n8n? → [N8N_INTEGRATION.md](./N8N_INTEGRATION.md)

**Let's go! 🚀**
