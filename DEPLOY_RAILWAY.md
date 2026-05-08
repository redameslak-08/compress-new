# Deploy to Railway (FREE HOSTING)

Railway gives you **$5 free credit per month** - plenty for testing!

## Step-by-Step Setup:

### 1. Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit: Image compression API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/image-compression-api.git
git push -u origin main
```

### 2. Sign Up on Railway
- Go to https://railway.app
- Click "Login" → "Sign up with GitHub"
- Connect your GitHub account

### 3. Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your `image-compression-api` repository
4. Railway will auto-detect it's a Node.js project

### 4. Configure Environment
- Railway auto-detects the port from `PORT` environment variable
- Your server.js already handles `process.env.PORT || 3000`
- No additional config needed!

### 5. Deploy
- Railway automatically deploys when you push to GitHub
- Watch the build logs
- Once deployed, you'll get a public URL like: `https://your-app.railway.app`

### 6. Test Your API
```bash
# Health check
curl https://your-app.railway.app/health

# Compress an image
curl -X POST \
  -F "file=@image.jpg" \
  "https://your-app.railway.app/api/compress?quality=50"

# Compress and get JSON response
curl -X POST \
  -F "file=@image.jpg" \
  "https://your-app.railway.app/api/compress-json?quality=75"
```

## Free Tier Benefits
- ✅ Automatic deployments from GitHub
- ✅ $5/month free credit (covers testing)
- ✅ Automatic restarts
- ✅ Easy scaling when needed
- ✅ No credit card required for first deployment

## Monitoring
- Go to your Railway dashboard
- View real-time logs
- Monitor CPU/Memory usage
- Easy to scale when traffic increases
