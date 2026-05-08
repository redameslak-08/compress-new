# n8n Integration Guide

This guide shows you how to use the Image Compression API in your n8n workflows.

## Quick Start - n8n Workflow Setup

### Basic Flow (Using Binary Response)

1. **Add HTTP Request node**
   - Node type: "HTTP Request"
   - Method: POST
   - URL: `https://your-api-url.replit.dev/api/compress?quality=50`

2. **Configure file upload**
   - In the node settings, go to "Body"
   - Change Body Type to: "Form Data (Multipart)"
   - Add parameter:
     - **Key:** `file`
     - **Value Type:** `Binary Data`
     - **Value:** Select the binary file from previous node

3. **Send request**
   - The response will be the compressed image as binary
   - Save it or use it in next node

### Alternative - JSON Response (Better for n8n)

Use the `/api/compress-json` endpoint instead - it returns Base64:

1. **Add HTTP Request node**
   - URL: `https://your-api-url.replit.dev/api/compress-json?quality=60`
   - Method: POST
   - Body Type: Form Data (Multipart)
   - Parameter:
     - **Key:** `file`
     - **Value Type:** `Binary Data`

2. **Response structure:**
   ```json
   {
     "success": true,
     "filename": "image-compressed.jpg",
     "image": "base64-encoded-string",
     "metadata": {
       "originalSize": 2048576,
       "compressedSize": 614400,
       "sizeReductionPercent": 70,
       "dimensions": {
         "width": 1920,
         "height": 1080
       },
       "format": "jpeg",
       "quality": 60
     }
   }
   ```

3. **Use the response**
   - Get filename: `{{ $node["HTTP Request"].json.filename }}`
   - Get image: `{{ $node["HTTP Request"].json.image }}`
   - Get compression stats: `{{ $node["HTTP Request"].json.metadata }}`

## Complete n8n Workflow Examples

### Example 1: Simple Compression with Download

```
[Trigger] 
  ↓
[Google Drive - Get File]
  ↓
[HTTP Request - Compress Image]
  - URL: {YOUR_API_URL}/api/compress?quality=70
  - File parameter: Binary from Drive
  ↓
[Google Drive - Upload File]
  - Upload compressed image back to Drive
```

### Example 2: Batch Compress Multiple Images

```
[Trigger - Watch Folder]
  ↓
[HTTP Request - Compress]
  - URL: {YOUR_API_URL}/api/compress-json?quality=60
  ↓
[Set Variable - Parse metadata]
  - Extract sizeReductionPercent
  ↓
[Database - Save compression stats]
```

### Example 3: Compress with Custom Quality

```
[Trigger - Form submission]
  - Input: image file + quality slider (1-100)
  ↓
[HTTP Request]
  - URL: {YOUR_API_URL}/api/compress?quality={{$json.quality}}
  - File: from form
  ↓
[Response - Return compressed image]
```

## API Endpoint Reference

### Endpoint 1: Binary Response (Download Ready)

```
POST /api/compress

Query Parameters:
  - quality: 1-100 (default: 80)
  - format: jpeg|png|webp|gif (default: same as input)

Response:
  - Content-Type: image/{format}
  - Content-Disposition: attachment
  - Headers with metadata:
    - X-Original-Size
    - X-Compressed-Size
    - X-Size-Reduction-Percent
    - X-Dimensions
    - X-Quality-Used
```

### Endpoint 2: JSON Response (Base64)

```
POST /api/compress-json

Query Parameters:
  - quality: 1-100 (default: 80)
  - format: jpeg|png|webp|gif (default: same as input)

Response:
  {
    "success": true,
    "filename": "string",
    "image": "base64-string",
    "metadata": {
      "originalSize": number,
      "compressedSize": number,
      "sizeReductionPercent": number,
      "dimensions": {
        "width": number,
        "height": number
      },
      "format": "string",
      "quality": number
    }
  }
```

## n8n Node Configuration Examples

### HTTP Request Node - Binary Mode

```json
{
  "name": "Compress Image",
  "type": "n8n-nodes-base.httpRequest",
  "method": "POST",
  "url": "https://your-api.replit.dev/api/compress",
  "bodyParametersUi": {
    "parameter": [
      {
        "name": "quality",
        "value": "70"
      }
    ]
  },
  "authentication": "none",
  "body": {
    "mimeType": "multipart/form-data",
    "multipartBody": [
      {
        "name": "file",
        "type": "binaryData",
        "binaryData": {
          "property": "data"
        }
      }
    ]
  }
}
```

## Troubleshooting

### Issue: "No file uploaded" error
**Solution:** Make sure your HTTP Request node has:
- Body Type: "Form Data (Multipart)" ✅
- Parameter name: `file` ✅
- Parameter type: Binary Data ✅

### Issue: Quality parameter not working
**Solution:** Add to URL as query parameter:
- `?quality=50` ✅
- NOT in body parameters ❌

### Issue: Image dimensions changed
**Solution:** This shouldn't happen! The API maintains dimensions.
- Check if another node is resizing
- Verify the compressed image format
- Try the `/health` endpoint to ensure API is working

### Issue: API timeout
**Solution:** 
- Set HTTP Request timeout to 30+ seconds (large images)
- Check your API server logs
- If images >50MB, they'll be rejected

## Performance Tips

1. **Quality levels:**
   - 90-100: Best quality, larger file
   - 70-89: Good balance (recommended)
   - 50-69: Small files, visible loss
   - 30-49: Very small, noticeable loss
   - 1-29: Extreme compression

2. **Format selection:**
   - JPEG: Best for photos (lossy)
   - PNG: Best for graphics (lossless)
   - WebP: Modern, smaller files
   - GIF: Animated images

3. **Batch processing:**
   - Add error handling between retries
   - Use "Loop" node for multiple images
   - Add delays if processing many files

## Testing Before n8n

Test your API first with cURL:

```bash
# Test compression
curl -X POST \
  -F "file=@test-image.jpg" \
  "https://your-api-url/api/compress?quality=70" \
  > compressed.jpg

# Test JSON response
curl -X POST \
  -F "file=@test-image.jpg" \
  "https://your-api-url/api/compress-json?quality=70" \
  | json_pp
```

If this works, your n8n integration will too!

## Next Steps

1. ✅ Deploy API (Railway or Replit)
2. ✅ Test with cURL
3. ✅ Create first n8n workflow
4. ✅ Scale to production
