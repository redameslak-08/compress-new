# Deploy to Replit (QUICKEST SETUP - NO GIT NEEDED!)

Replit is the fastest way to get your API live in minutes.

## Step-by-Step Setup:

### 1. Create Replit Account
- Go to https://replit.com
- Sign up with GitHub or email

### 2. Create New Repl
1. Click "Create Repl"
2. Choose template: **"Node.js"**
3. Name it: `image-compression-api`
4. Click "Create Repl"

### 3. Add Files
- In the file explorer on the left, you'll see `index.js`
- Delete it (right-click → Delete)
- Create new files:

**Replit automatically uploads files. Copy-paste contents:**

#### File 1: server.js
- Right-click in file explorer → "New file"
- Name: `server.js`
- Copy the server code from our server.js file

#### File 2: package.json
- Right-click → "New file"
- Name: `package.json`
- Copy our package.json contents

### 4. Install Dependencies
- The shell on the right should auto-detect package.json
- Click the "Run" button (or it auto-installs)
- You should see packages installing

### 5. Run the Server
- Click "Run" button at top
- You'll see console output: `🚀 Image Compression API running on port 3000`
- Replit auto-generates a public URL at top (copy this)

### 6. Keep It Running (24/7)
- Replit free tier stops after 1 hour of inactivity
- **Solution:** Use an uptime monitor service (like UptimeRobot - FREE)
  - https://uptimerobot.com
  - Set it to ping `https://your-replit-url.replit.dev/health` every 5 minutes
  - This keeps your app active 24/7!

## Your Public URLs
Once running, Replit gives you:
- **Web URL:** https://your-project.replit.dev
- **API endpoints:**
  - POST https://your-project.replit.dev/api/compress?quality=50
  - POST https://your-project.replit.dev/api/compress-json?quality=75

## Test Your API

### Using cURL
```bash
curl -X POST \
  -F "file=@image.jpg" \
  "https://your-project.replit.dev/api/compress?quality=50"
```

### Using cURL to get JSON
```bash
curl -X POST \
  -F "file=@image.jpg" \
  "https://your-project.replit.dev/api/compress-json?quality=75"
```

## Advantages of Replit
✅ Instant deployment (no GitHub needed)
✅ Free forever tier
✅ Easy code editing
✅ Built-in console/logs
✅ Perfect for testing and prototyping

## Next Steps
- Once tested, scale to Railway or Render
- Add authentication if needed
- Set up n8n workflows to use your API
