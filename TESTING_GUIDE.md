# Testing Guide - Image Compression API

Test your API locally or remotely with these examples.

## Local Testing (Before Deployment)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

Output should show:
```
🚀 Image Compression API running on port 3000
📍 Health check: http://localhost:3000/health
📸 Compress endpoint: POST http://localhost:3000/api/compress
📋 JSON endpoint: POST http://localhost:3000/api/compress-json
```

### 3. Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "OK",
  "message": "Image Compression API is running"
}
```

## API Testing Examples

### Test 1: Compress with Default Settings (80% quality)

```bash
curl -X POST \
  -F "file=@image.jpg" \
  http://localhost:3000/api/compress \
  -o compressed.jpg
```

View compression stats in headers:
```bash
curl -X POST \
  -F "file=@image.jpg" \
  http://localhost:3000/api/compress \
  -i \
  -o compressed.jpg
```

### Test 2: Compress with Custom Quality

```bash
# 50% quality (strong compression)
curl -X POST \
  -F "file=@image.jpg" \
  "http://localhost:3000/api/compress?quality=50" \
  -o compressed-50.jpg

# 90% quality (high quality)
curl -X POST \
  -F "file=@image.jpg" \
  "http://localhost:3000/api/compress?quality=90" \
  -o compressed-90.jpg
```

### Test 3: Convert Format During Compression

```bash
# JPEG → PNG
curl -X POST \
  -F "file=@image.jpg" \
  "http://localhost:3000/api/compress?quality=80&format=png" \
  -o compressed.png

# PNG → WebP (better compression)
curl -X POST \
  -F "file=@image.png" \
  "http://localhost:3000/api/compress?quality=80&format=webp" \
  -o compressed.webp

# Any format → JPEG
curl -X POST \
  -F "file=@image.png" \
  "http://localhost:3000/api/compress?quality=70&format=jpeg" \
  -o compressed.jpg
```

### Test 4: Get JSON Response with Base64

```bash
curl -X POST \
  -F "file=@image.jpg" \
  "http://localhost:3000/api/compress-json?quality=70" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "filename": "image-compressed.jpg",
  "image": "base64encodedstring...",
  "metadata": {
    "originalSize": 2048576,
    "compressedSize": 614400,
    "sizeReductionPercent": 70.02,
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "format": "jpeg",
    "quality": 70
  }
}
```

### Test 5: Save JSON Response to File

```bash
curl -X POST \
  -F "file=@image.jpg" \
  "http://localhost:3000/api/compress-json?quality=60" \
  > response.json

# View the response
cat response.json | jq .metadata
```

### Test 6: Extract and Decode Base64

```bash
# Save image from JSON response
curl -X POST \
  -F "file=@image.jpg" \
  "http://localhost:3000/api/compress-json?quality=70" | \
  jq -r '.image' | base64 -d > decoded-image.jpg
```

### Test 7: Test All Image Formats

```bash
# Test with different file types
curl -X POST \
  -F "file=@image.png" \
  "http://localhost:3000/api/compress?quality=75" \
  -o compressed.png

curl -X POST \
  -F "file=@image.gif" \
  "http://localhost:3000/api/compress?quality=50" \
  -o compressed.gif

curl -X POST \
  -F "file=@image.webp" \
  "http://localhost:3000/api/compress?quality=80" \
  -o compressed.webp
```

## Using Postman

### Import Collection

Create a new Postman Collection with these requests:

#### Request 1: Compress with Default Quality
```
POST http://localhost:3000/api/compress
Headers:
  Content-Type: multipart/form-data

Body:
  file: [select your image file]

Params:
  quality: 80
```

#### Request 2: Compress with Custom Quality
```
POST http://localhost:3000/api/compress
Headers:
  Content-Type: multipart/form-data

Body:
  file: [select your image file]

Params:
  quality: 50
  format: jpeg
```

#### Request 3: Get JSON Response
```
POST http://localhost:3000/api/compress-json
Headers:
  Content-Type: multipart/form-data

Body:
  file: [select your image file]

Params:
  quality: 70
```

#### Request 4: Health Check
```
GET http://localhost:3000/health
```

## Batch Testing Script

Create `test.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000"
TEST_IMAGE="image.jpg"

echo "🧪 Testing Image Compression API\n"

# Test 1: Health Check
echo "1️⃣  Health Check..."
curl -s "$API_URL/health" | jq .
echo ""

# Test 2: Default Compression
echo "2️⃣  Default Compression (quality=80)..."
curl -s -X POST \
  -F "file=@$TEST_IMAGE" \
  "$API_URL/api/compress" \
  -w "\nStatus: %{http_code}\n"
echo ""

# Test 3: Strong Compression
echo "3️⃣  Strong Compression (quality=30)..."
curl -s -X POST \
  -F "file=@$TEST_IMAGE" \
  "$API_URL/api/compress?quality=30" \
  -w "\nStatus: %{http_code}\n"
echo ""

# Test 4: JSON Response
echo "4️⃣  JSON Response..."
curl -s -X POST \
  -F "file=@$TEST_IMAGE" \
  "$API_URL/api/compress-json?quality=70" | jq .metadata
echo ""

echo "✅ Testing complete!"
```

Run it:
```bash
chmod +x test.sh
./test.sh
```

## Testing Remote API (After Deployment)

Replace `http://localhost:3000` with your deployed URL:

```bash
# Replit example
API_URL="https://your-project.replit.dev"

# Railway example
API_URL="https://your-app-name-prod.railway.app"

# Then use any of the commands above with the new URL
curl -X POST \
  -F "file=@image.jpg" \
  "$API_URL/api/compress?quality=50" \
  -o compressed.jpg
```

## Performance Testing

### Test Large File
```bash
# Create a test image (5MB)
dd if=/dev/urandom of=large-image.jpg bs=1M count=5

# Compress it
time curl -X POST \
  -F "file=@large-image.jpg" \
  "http://localhost:3000/api/compress?quality=60" \
  -o compressed-large.jpg
```

### Test Concurrent Requests
```bash
# Send 10 requests simultaneously
for i in {1..10}; do
  curl -X POST \
    -F "file=@image.jpg" \
    "http://localhost:3000/api/compress?quality=70" \
    -o "compressed-$i.jpg" &
done
wait
```

## Expected Results

### Before/After File Sizes

With **quality=80** (default):
- JPEG 2MB → ~600KB (70% reduction)
- PNG 2MB → ~1.2MB (40% reduction)
- WebP 2MB → ~500KB (75% reduction)

With **quality=50** (strong compression):
- JPEG 2MB → ~300KB (85% reduction)
- PNG 2MB → ~600KB (70% reduction)
- WebP 2MB → ~250KB (88% reduction)

## Troubleshooting

### Error: "No file uploaded"
- Make sure you're using `-F "file=@filename"` (not -d or -d @)
- Check file path is correct

### Error: "Invalid file type"
- Only JPEG, PNG, WebP, GIF are supported
- Check file extension and MIME type

### Error: "File size exceeds limit"
- Max file size is 50MB
- Try compressing with lower quality first

### No response / timeout
- API might be down
- Check with health endpoint first
- Increase timeout for large files: `--max-time 60`

## Next Steps

✅ Test locally  
✅ Deploy to Railway/Replit  
✅ Test remote endpoints  
✅ Integrate with n8n  
✅ Scale to production
