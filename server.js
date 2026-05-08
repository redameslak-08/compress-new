const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF'));
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function fetchImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Failed to fetch image: HTTP ${res.statusCode}`));
      const contentType = res.headers['content-type'] || '';
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.some(t => contentType.includes(t)))
        return reject(new Error(`URL does not point to a valid image (got: ${contentType})`));
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function getFormatFromMime(mime) {
  const map = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  return map[mime] || 'jpeg';
}

async function compressImage(buffer, quality, outputFormat) {
  let compressedBuffer;
  let actualFormat = outputFormat;
  if (outputFormat === 'png') {
    compressedBuffer = await sharp(buffer).png({ compressionLevel: Math.min(9, Math.floor((100 - quality) / 10) + 1) }).toBuffer();
  } else if (outputFormat === 'webp') {
    compressedBuffer = await sharp(buffer).webp({ quality }).toBuffer();
  } else {
    actualFormat = 'jpeg';
    compressedBuffer = await sharp(buffer).jpeg({ quality, progressive: true }).toBuffer();
  }
  return { compressedBuffer, actualFormat };
}

app.get('/health', (req, res) => res.json({ status: 'OK', message: 'ImgPress API is running' }));

// ── POST /api/compress — binary response (file upload OR url in body) ──
app.post('/api/compress', upload.single('file'), async (req, res) => {
  try {
    let buffer, originalSize, originalFilename, mimeType;
    let quality = parseInt(req.query.quality || req.body.quality) || 80;
    let outputFormat = (req.query.format || req.body.format || '').toLowerCase();

    if (req.file) {
      buffer = req.file.buffer;
      originalSize = req.file.size;
      originalFilename = req.file.originalname;
      mimeType = req.file.mimetype;
    } else if (req.body.url) {
      const { buffer: fetched, contentType } = await fetchImageFromUrl(req.body.url);
      buffer = fetched;
      originalSize = buffer.length;
      mimeType = contentType.split(';')[0].trim();
      originalFilename = path.basename(new URL(req.body.url).pathname) || 'image.jpg';
    } else {
      return res.status(400).json({ success: false, error: 'Provide a file upload or a "url" in the request body' });
    }

    if (!outputFormat) outputFormat = getFormatFromMime(mimeType);
    if (isNaN(quality) || quality < 1 || quality > 100)
      return res.status(400).json({ success: false, error: 'Quality must be 1–100' });

    const metadata = await sharp(buffer).metadata();
    const { compressedBuffer, actualFormat } = await compressImage(buffer, quality, outputFormat);
    const reduction = ((originalSize - compressedBuffer.length) / originalSize) * 100;
    const ext = actualFormat === 'jpeg' ? 'jpg' : actualFormat;
    const filename = `${path.parse(originalFilename).name}-compressed.${ext}`;

    res.setHeader('Content-Type', `image/${actualFormat}`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Original-Size', originalSize);
    res.setHeader('X-Compressed-Size', compressedBuffer.length);
    res.setHeader('X-Size-Reduction-Percent', reduction.toFixed(2));
    res.setHeader('X-Dimensions', `${metadata.width}x${metadata.height}`);
    res.setHeader('X-Quality-Used', quality);
    res.send(compressedBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/compress-json — JSON/Base64 response ──
app.post('/api/compress-json', upload.single('file'), async (req, res) => {
  try {
    let buffer, originalSize, originalFilename, mimeType;
    let quality = parseInt(req.query.quality || req.body.quality) || 80;
    let outputFormat = (req.query.format || req.body.format || '').toLowerCase();

    if (req.file) {
      buffer = req.file.buffer;
      originalSize = req.file.size;
      originalFilename = req.file.originalname;
      mimeType = req.file.mimetype;
    } else if (req.body.url) {
      const { buffer: fetched, contentType } = await fetchImageFromUrl(req.body.url);
      buffer = fetched;
      originalSize = buffer.length;
      mimeType = contentType.split(';')[0].trim();
      originalFilename = path.basename(new URL(req.body.url).pathname) || 'image.jpg';
    } else {
      return res.status(400).json({ success: false, error: 'Provide a file upload or a "url" in the request body' });
    }

    if (!outputFormat) outputFormat = getFormatFromMime(mimeType);
    if (isNaN(quality) || quality < 1 || quality > 100)
      return res.status(400).json({ success: false, error: 'Quality must be 1–100' });

    const metadata = await sharp(buffer).metadata();
    const { compressedBuffer, actualFormat } = await compressImage(buffer, quality, outputFormat);
    const reduction = ((originalSize - compressedBuffer.length) / originalSize) * 100;
    const ext = actualFormat === 'jpeg' ? 'jpg' : actualFormat;

    res.json({
      success: true,
      filename: `${path.parse(originalFilename).name}-compressed.${ext}`,
      image: compressedBuffer.toString('base64'),
      metadata: {
        originalSize,
        compressedSize: compressedBuffer.length,
        sizeReductionPercent: parseFloat(reduction.toFixed(2)),
        dimensions: { width: metadata.width, height: metadata.height },
        format: actualFormat,
        quality,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET / — Web UI ──
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ImgPress — Image Compressor</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0f; --surface: #111118; --surface2: #1a1a24; --border: #2a2a38;
      --accent: #7c3aed; --accent2: #06b6d4; --text: #f0f0f8; --muted: #6b6b88;
      --success: #10b981; --error: #ef4444; --radius: 16px;
    }
    body { font-family: 'Syne', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; overflow-x: hidden; }
    body::before {
      content: ''; position: fixed; inset: 0;
      background-image: linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
      background-size: 40px 40px; pointer-events: none; z-index: 0;
    }
    .blob { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.15; pointer-events: none; z-index: 0; }
    .blob-1 { width: 600px; height: 600px; background: var(--accent); top: -200px; left: -100px; }
    .blob-2 { width: 400px; height: 400px; background: var(--accent2); bottom: -100px; right: -100px; }
    .container { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; padding: 60px 24px 80px; }
    header { text-align: center; margin-bottom: 56px; }
    .logo { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent2); font-family: 'DM Mono', monospace; margin-bottom: 20px; }
    .logo-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent2); animation: pulse 2s ease infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
    h1 { font-size: clamp(42px, 8vw, 72px); font-weight: 800; line-height: 1; letter-spacing: -2px; margin-bottom: 16px; }
    h1 span { background: linear-gradient(135deg, #7c3aed, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .subtitle { font-size: 16px; color: var(--muted); font-family: 'DM Mono', monospace; font-weight: 300; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 36px; margin-bottom: 20px; position: relative; overflow: hidden; }
    .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: 0.5; }
    .tabs { display: flex; gap: 4px; background: var(--surface2); border-radius: 12px; padding: 4px; margin-bottom: 28px; }
    .tab { flex: 1; padding: 10px; border: none; border-radius: 8px; background: transparent; color: var(--muted); font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .tab.active { background: var(--accent); color: white; }
    .panel { display: none; }
    .panel.active { display: block; }
    .dropzone { border: 2px dashed var(--border); border-radius: 12px; padding: 48px 24px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
    .dropzone:hover, .dropzone.dragover { border-color: var(--accent); background: rgba(124,58,237,0.05); }
    .dropzone input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .dropzone-icon { font-size: 48px; margin-bottom: 12px; }
    .dropzone-text { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
    .dropzone-hint { font-size: 13px; color: var(--muted); font-family: 'DM Mono', monospace; }
    .url-input-wrap { display: flex; gap: 12px; }
    input[type="text"] { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 14px; outline: none; transition: border-color 0.2s; }
    input[type="text"]:focus { border-color: var(--accent); }
    input[type="text"]::placeholder { color: var(--muted); }
    .quality-section { margin-top: 28px; }
    .quality-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .quality-label { font-size: 14px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
    .quality-value { font-family: 'DM Mono', monospace; font-size: 28px; font-weight: 500; color: var(--accent2); }
    input[type="range"] { width: 100%; height: 6px; border-radius: 3px; background: var(--surface2); outline: none; -webkit-appearance: none; cursor: pointer; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--accent); border: 3px solid var(--bg); box-shadow: 0 0 0 2px var(--accent); cursor: pointer; }
    .quality-presets { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .preset { padding: 5px 12px; border: 1px solid var(--border); border-radius: 20px; background: transparent; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; transition: all 0.2s; }
    .preset:hover { border-color: var(--accent); color: var(--accent); }
    .btn-compress { width: 100%; padding: 16px; margin-top: 28px; background: linear-gradient(135deg, var(--accent), #5b21b6); border: none; border-radius: 12px; color: white; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 0.05em; cursor: pointer; transition: all 0.2s; }
    .btn-compress:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(124,58,237,0.4); }
    .btn-compress:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .loading { display: none; text-align: center; padding: 40px; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .result { display: none; }
    .result-preview { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    @media (max-width: 600px) { .result-preview { grid-template-columns: 1fr; } }
    .preview-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .preview-box img { width: 100%; height: 180px; object-fit: cover; display: block; }
    .preview-info { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .preview-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
    .preview-size { font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; }
    .stat-value { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 500; color: var(--accent2); display: block; margin-bottom: 4px; }
    .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
    .btn-download { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; background: linear-gradient(135deg, var(--success), #059669); border: none; border-radius: 12px; color: white; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; cursor: pointer; text-decoration: none; transition: all 0.2s; }
    .btn-download:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(16,185,129,0.4); }
    .error-box { display: none; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 16px 20px; color: var(--error); font-family: 'DM Mono', monospace; font-size: 14px; margin-top: 16px; }
    .api-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 36px; }
    .api-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
    .code-block { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 16px 20px; font-family: 'DM Mono', monospace; font-size: 13px; color: var(--accent2); margin-bottom: 12px; overflow-x: auto; white-space: pre; line-height: 1.7; }
    .api-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; font-weight: 600; }
    .btn-reset { background: transparent; border: 1px solid var(--border); border-radius: 10px; color: var(--muted); font-family: 'Syne', sans-serif; font-size: 14px; padding: 10px 20px; cursor: pointer; margin-top: 16px; transition: all 0.2s; }
    .btn-reset:hover { border-color: var(--accent); color: var(--accent); }
  </style>
</head>
<body>
  <div class="blob blob-1"></div>
  <div class="blob blob-2"></div>
  <div class="container">
    <header>
      <div class="logo"><span class="logo-dot"></span> ImgPress</div>
      <h1>Compress <span>Images</span><br/>Instantly</h1>
      <p class="subtitle">Upload a file or paste a link — control quality, keep dimensions</p>
    </header>

    <div class="card">
      <div class="tabs">
        <button class="tab active" onclick="switchTab('upload')">📁 Upload File</button>
        <button class="tab" onclick="switchTab('url')">🔗 Image URL</button>
      </div>
      <div class="panel active" id="panel-upload">
        <div class="dropzone" id="dropzone">
          <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp,image/gif" />
          <div class="dropzone-icon">🖼️</div>
          <div class="dropzone-text">Drop your image here</div>
          <div class="dropzone-hint">or click to browse — JPEG, PNG, WebP, GIF up to 50MB</div>
        </div>
      </div>
      <div class="panel" id="panel-url">
        <div class="url-input-wrap">
          <input type="text" id="urlInput" placeholder="https://example.com/image.jpg" />
        </div>
      </div>
      <div class="quality-section">
        <div class="quality-header">
          <span class="quality-label">Quality</span>
          <span class="quality-value" id="qualityDisplay">80</span>
        </div>
        <input type="range" id="qualitySlider" min="1" max="100" value="80" oninput="updateQuality(this.value)" />
        <div class="quality-presets">
          <button class="preset" onclick="setQuality(95)">95 — Max</button>
          <button class="preset" onclick="setQuality(80)">80 — Web</button>
          <button class="preset" onclick="setQuality(60)">60 — Balanced</button>
          <button class="preset" onclick="setQuality(40)">40 — Small</button>
          <button class="preset" onclick="setQuality(20)">20 — Tiny</button>
        </div>
      </div>
      <button class="btn-compress" onclick="compress()" id="compressBtn">⚡ Compress Image</button>
      <div class="error-box" id="errorBox"></div>
    </div>

    <div class="loading" id="loading">
      <div class="spinner"></div>
      <p style="color:var(--muted);font-family:'DM Mono',monospace;font-size:14px;">Compressing your image...</p>
    </div>

    <div class="card result" id="result">
      <div class="result-preview">
        <div class="preview-box">
          <img id="originalPreview" src="" alt="Original" />
          <div class="preview-info">
            <span class="preview-label">Original</span>
            <span class="preview-size" id="originalSize">—</span>
          </div>
        </div>
        <div class="preview-box">
          <img id="compressedPreview" src="" alt="Compressed" />
          <div class="preview-info">
            <span class="preview-label">Compressed</span>
            <span class="preview-size" id="compressedSize">—</span>
          </div>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><span class="stat-value" id="statReduction">—</span><span class="stat-label">Size Reduction</span></div>
        <div class="stat"><span class="stat-value" id="statDimensions">—</span><span class="stat-label">Dimensions</span></div>
        <div class="stat"><span class="stat-value" id="statQuality">—</span><span class="stat-label">Quality Used</span></div>
      </div>
      <a id="downloadBtn" class="btn-download" download>⬇️ Download Compressed Image</a>
      <button class="btn-reset" onclick="reset()">↩ Compress Another</button>
    </div>

    <div class="api-card" style="margin-top:20px;">
      <div class="api-title">🔌 API Usage</div>
      <div class="api-label">Via File Upload</div>
      <div class="code-block">curl -X POST \\
  -F "file=@image.jpg" \\
  "ORIGIN/api/compress?quality=70"</div>
      <div class="api-label">Via Image URL (for n8n)</div>
      <div class="code-block">curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com/img.jpg","quality":70}' \\
  "ORIGIN/api/compress-json"</div>
    </div>
  </div>

  <script>
    let currentTab = 'upload';

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', (i === 0 && tab === 'upload') || (i === 1 && tab === 'url')));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + tab).classList.add('active');
    }

    function updateQuality(val) { document.getElementById('qualityDisplay').textContent = val; }
    function setQuality(val) { document.getElementById('qualitySlider').value = val; updateQuality(val); }
    function formatBytes(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b/1024).toFixed(1) + ' KB'; return (b/1048576).toFixed(2) + ' MB'; }
    function showError(msg) { const box = document.getElementById('errorBox'); box.style.display = 'block'; box.textContent = '❌ ' + msg; }
    function hideError() { document.getElementById('errorBox').style.display = 'none'; }

    async function compress() {
      hideError();
      const quality = document.getElementById('qualitySlider').value;
      const btn = document.getElementById('compressBtn');

      if (currentTab === 'upload') {
        const file = document.getElementById('fileInput').files[0];
        if (!file) return showError('Please select an image file first.');
        const formData = new FormData();
        formData.append('file', file);
        document.getElementById('originalPreview').src = URL.createObjectURL(file);
        document.getElementById('originalSize').textContent = formatBytes(file.size);
        btn.disabled = true;
        document.getElementById('loading').style.display = 'block';
        document.getElementById('result').style.display = 'none';
        try {
          const res = await fetch('/api/compress?quality=' + quality, { method: 'POST', body: formData });
          if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
          const blob = await res.blob();
          const filename = (res.headers.get('Content-Disposition') || '').split('filename="')[1]?.replace('"','') || 'compressed.jpg';
          const url = URL.createObjectURL(blob);
          document.getElementById('compressedPreview').src = url;
          document.getElementById('compressedSize').textContent = formatBytes(blob.size);
          document.getElementById('statReduction').textContent = res.headers.get('X-Size-Reduction-Percent') + '%';
          document.getElementById('statDimensions').textContent = (res.headers.get('X-Dimensions') || '').replace('x','×');
          document.getElementById('statQuality').textContent = res.headers.get('X-Quality-Used');
          const dl = document.getElementById('downloadBtn'); dl.href = url; dl.download = filename;
          document.getElementById('loading').style.display = 'none';
          document.getElementById('result').style.display = 'block';
        } catch(e) { document.getElementById('loading').style.display = 'none'; showError(e.message); }
      } else {
        const imageUrl = document.getElementById('urlInput').value.trim();
        if (!imageUrl) return showError('Please enter an image URL.');
        if (!imageUrl.startsWith('http')) return showError('URL must start with http:// or https://');
        document.getElementById('originalPreview').src = imageUrl;
        document.getElementById('originalSize').textContent = '—';
        btn.disabled = true;
        document.getElementById('loading').style.display = 'block';
        document.getElementById('result').style.display = 'none';
        try {
          const res = await fetch('/api/compress-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: imageUrl, quality: parseInt(quality) }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          const bytes = atob(data.image);
          const arr = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          const blob = new Blob([arr], { type: 'image/' + data.metadata.format });
          const url = URL.createObjectURL(blob);
          document.getElementById('compressedPreview').src = url;
          document.getElementById('originalSize').textContent = formatBytes(data.metadata.originalSize);
          document.getElementById('compressedSize').textContent = formatBytes(data.metadata.compressedSize);
          document.getElementById('statReduction').textContent = data.metadata.sizeReductionPercent.toFixed(1) + '%';
          document.getElementById('statDimensions').textContent = data.metadata.dimensions.width + '×' + data.metadata.dimensions.height;
          document.getElementById('statQuality').textContent = data.metadata.quality;
          const dl = document.getElementById('downloadBtn'); dl.href = url; dl.download = data.filename;
          document.getElementById('loading').style.display = 'none';
          document.getElementById('result').style.display = 'block';
        } catch(e) { document.getElementById('loading').style.display = 'none'; showError(e.message); }
      }
      btn.disabled = false;
    }

    function reset() {
      document.getElementById('result').style.display = 'none';
      document.getElementById('fileInput').value = '';
      document.getElementById('urlInput').value = '';
      hideError();
    }

    const dz = document.getElementById('dropzone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) { document.getElementById('fileInput').files = e.dataTransfer.files; dz.querySelector('.dropzone-text').textContent = file.name; }
    });
    document.getElementById('fileInput').addEventListener('change', e => {
      if (e.target.files[0]) dz.querySelector('.dropzone-text').textContent = e.target.files[0].name;
    });
  </script>
</body>
</html>`);
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ success: false, error: err.message });
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ImgPress running on port ${PORT}`);
  console.log(`🌐 UI: http://localhost:${PORT}`);
  console.log(`📸 API: http://localhost:${PORT}/api/compress`);
  console.log(`📋 JSON API: http://localhost:${PORT}/api/compress-json\n`);
});
