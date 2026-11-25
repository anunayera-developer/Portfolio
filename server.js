const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOAD_DIR = path.join(ROOT_DIR, 'images', 'uploads');
const PORTFOLIO_FILE = path.join(DATA_DIR, 'portfolio.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// In-memory OTP store (keyed by normalized phone)
const activeOtps = new Map();

// Helper: hash password with scrypt
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[\s\-()]/g, '').trim();
}

// Initialize auth.json with owner-only defaults if missing
function loadAuth() {
  if (!fs.existsSync(AUTH_FILE)) {
    const { salt, hash } = hashPassword('Anunay@2026');
    const initialAuth = {
      email: 'anunay@portfolio.local',
      phone: '+919999999999',
      passwordSalt: salt,
      passwordHash: hash,
      authMode: 'email_password', // 'email_password' | 'phone_otp' | 'both'
      tokenSecret: crypto.randomBytes(32).toString('hex'),
      smsWebhookUrl: ''
    };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(initialAuth, null, 2), 'utf8');
    console.log('[PORTFOLIO AUTH] Initialized owner credentials in data/auth.json');
    console.log('[PORTFOLIO AUTH] Default Email: anunay@portfolio.local | Default Password: Change in Admin -> Security Settings (initial: Anunay@2026)');
  }
  return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
}

function saveAuth(authData) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2), 'utf8');
}

function loadPortfolio() {
  return JSON.parse(fs.readFileSync(PORTFOLIO_FILE, 'utf8'));
}

function savePortfolio(data) {
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function loadMessages() {
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveMessages(msgs) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(msgs, null, 2), 'utf8');
}

// Token signing & verification (HMAC-SHA256)
function createToken(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const auth = loadAuth();
  const payload = verifyToken(token, auth.tokenSecret);
  if (!payload || payload.role !== 'owner') {
    sendJson(res, 401, { error: 'Unauthorized. Owner login required.' });
    return null;
  }
  return { payload, auth };
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(body);
}

function readBody(req, maxBytes = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function maskEmail(email) {
  const [user, domain] = String(email || '').split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone) {
  const p = String(phone || '');
  if (p.length <= 4) return '****';
  return `${p.slice(0, 3)}****${p.slice(-3)}`;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, pathname) {
  // Never expose data/auth.json or server.js over static HTTP
  const cleanPath = decodeURIComponent(pathname).split('?')[0];
  if (
    cleanPath.includes('auth.json') ||
    cleanPath.includes('messages.json') ||
    cleanPath === '/server.js' ||
    cleanPath.includes('..')
  ) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  let filePath = path.join(ROOT_DIR, cleanPath === '/' ? 'index.html' : cleanPath);
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (req.method.toUpperCase() === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method.toUpperCase();

  try {
    // ---- Public Portfolio API ----
    if (pathname === '/api/portfolio' && method === 'GET') {
      return sendJson(res, 200, loadPortfolio());
    }

    if (pathname === '/api/contact' && method === 'POST') {
      const body = await readBody(req);
      const msgs = loadMessages();
      msgs.unshift({
        id: `msg-${Date.now()}`,
        name: String(body.name || '').slice(0, 120),
        email: String(body.email || '').slice(0, 160),
        subject: String(body.subject || '').slice(0, 200),
        message: String(body.message || '').slice(0, 5000),
        createdAt: new Date().toISOString()
      });
      saveMessages(msgs);
      return sendJson(res, 200, { ok: true });
    }

    // ---- Auth API ----
    if (pathname === '/api/auth/config' && method === 'GET') {
      const auth = loadAuth();
      return sendJson(res, 200, {
        authMode: auth.authMode,
        emailHint: maskEmail(auth.email),
        phoneHint: maskPhone(auth.phone)
      });
    }

    if (pathname === '/api/auth/send-otp' && method === 'POST') {
      const body = await readBody(req);
      const auth = loadAuth();
      if (auth.authMode === 'email_password') {
        return sendJson(res, 400, { error: 'OTP login is disabled in current auth mode.' });
      }
      const reqPhone = normalizePhone(body.phone);
      const ownerPhone = normalizePhone(auth.phone);
      if (!reqPhone || reqPhone !== ownerPhone) {
        return sendJson(res, 403, { error: 'Phone number does not match the owner account.' });
      }

      const otp = String(crypto.randomInt(100000, 999999));
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      activeOtps.set(ownerPhone, {
        hash: otpHash,
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      console.log(`\n========================================`);
      console.log(`[PORTFOLIO OWNER OTP] Phone: ${auth.phone}`);
      console.log(`[PORTFOLIO OWNER OTP] Code : ${otp} (valid 5 min)`);
      console.log(`========================================\n`);

      // Optional external SMS webhook dispatch
      if (auth.smsWebhookUrl) {
        try {
          await fetch(auth.smsWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: auth.phone, otp })
          });
        } catch (err) {
          console.error('[PORTFOLIO AUTH] Webhook error:', err.message);
        }
      }

      const host = (req.headers.host || '').split(':')[0];
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      return sendJson(res, 200, {
        ok: true,
        message: 'OTP generated. Check your server console / SMS.',
        ...(isLocal && !auth.smsWebhookUrl ? { localPreviewOtp: otp } : {})
      });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await readBody(req);
      const auth = loadAuth();
      const mode = auth.authMode || 'email_password';

      const emailMatch = String(body.email || '').trim().toLowerCase() === auth.email.trim().toLowerCase();
      const phoneMatch = normalizePhone(body.phone) === normalizePhone(auth.phone);
      const passwordOk = verifyPassword(body.password, auth.passwordSalt, auth.passwordHash);

      function checkOtp(otpInput) {
        const ownerPhone = normalizePhone(auth.phone);
        const record = activeOtps.get(ownerPhone);
        if (!record || Date.now() > record.expiresAt) return false;
        const inputHash = crypto.createHash('sha256').update(String(otpInput || '').trim()).digest('hex');
        const ok = crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(record.hash, 'hex'));
        if (ok) activeOtps.delete(ownerPhone);
        return ok;
      }

      let authorized = false;
      if (mode === 'email_password') {
        authorized = emailMatch && passwordOk;
      } else if (mode === 'phone_otp') {
        authorized = phoneMatch && checkOtp(body.otp);
      } else if (mode === 'both') {
        const identifierOk = emailMatch || phoneMatch;
        authorized = identifierOk && passwordOk && checkOtp(body.otp);
      }

      if (!authorized) {
        return sendJson(res, 401, { error: 'Invalid owner credentials or expired OTP.' });
      }

      const token = createToken({ role: 'owner', email: auth.email }, auth.tokenSecret);
      return sendJson(res, 200, { ok: true, token });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      const session = requireAuth(req, res);
      if (!session) return;
      const { auth } = session;
      return sendJson(res, 200, {
        ok: true,
        email: auth.email,
        phone: auth.phone,
        authMode: auth.authMode,
        smsWebhookUrl: auth.smsWebhookUrl || ''
      });
    }

    if (pathname === '/api/auth/settings' && method === 'POST') {
      const session = requireAuth(req, res);
      if (!session) return;
      const body = await readBody(req);
      const { auth } = session;

      if (body.email && String(body.email).includes('@')) {
        auth.email = String(body.email).trim();
      }
      if (body.phone !== undefined) {
        auth.phone = String(body.phone).trim();
      }
      if (['email_password', 'phone_otp', 'both'].includes(body.authMode)) {
        auth.authMode = body.authMode;
      }
      if (body.smsWebhookUrl !== undefined) {
        auth.smsWebhookUrl = String(body.smsWebhookUrl).trim();
      }
      if (body.newPassword && String(body.newPassword).length >= 6) {
        const { salt, hash } = hashPassword(String(body.newPassword));
        auth.passwordSalt = salt;
        auth.passwordHash = hash;
      }

      saveAuth(auth);
      return sendJson(res, 200, {
        ok: true,
        email: auth.email,
        phone: auth.phone,
        authMode: auth.authMode,
        smsWebhookUrl: auth.smsWebhookUrl || ''
      });
    }

    // ---- Protected Portfolio Management API ----
    if (pathname === '/api/messages' && method === 'GET') {
      if (!requireAuth(req, res)) return;
      return sendJson(res, 200, loadMessages());
    }

    if (pathname.startsWith('/api/messages/') && method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = pathname.split('/').pop();
      const msgs = loadMessages().filter(m => m.id !== id);
      saveMessages(msgs);
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/portfolio/profile' && method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const data = loadPortfolio();
      data.profile = { ...data.profile, ...body };
      savePortfolio(data);
      return sendJson(res, 200, { ok: true, profile: data.profile });
    }

    // Projects CRUD
    if (pathname === '/api/projects' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const data = loadPortfolio();
      const newProj = {
        id: `proj-${Date.now()}`,
        category: body.category || 'Web Development',
        title: body.title || 'Untitled Project',
        description: body.description || '',
        image: body.image || 'images/project_gym.jpg',
        focusTitle: body.focusTitle || 'Focus Areas:',
        focusTags: Array.isArray(body.focusTags) ? body.focusTags : [],
        techStack: body.techStack || '',
        repoUrl: body.repoUrl || ''
      };
      data.projects.unshift(newProj);
      savePortfolio(data);
      return sendJson(res, 201, { ok: true, project: newProj });
    }

    if (pathname.startsWith('/api/projects/') && method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = pathname.split('/').pop();
      const body = await readBody(req);
      const data = loadPortfolio();
      const idx = data.projects.findIndex(p => p.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Project not found' });
      data.projects[idx] = { ...data.projects[idx], ...body, id };
      savePortfolio(data);
      return sendJson(res, 200, { ok: true, project: data.projects[idx] });
    }

    if (pathname.startsWith('/api/projects/') && method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = pathname.split('/').pop();
      const data = loadPortfolio();
      data.projects = data.projects.filter(p => p.id !== id);
      savePortfolio(data);
      return sendJson(res, 200, { ok: true });
    }

    // Journey / Roles CRUD
    if (pathname === '/api/journey' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const data = loadPortfolio();
      const newItem = {
        id: `role-${Date.now()}`,
        number: body.number || String(data.journey.length + 1).padStart(2, '0'),
        title: body.title || '',
        description: body.description || '',
        company: body.company || '',
        period: body.period || ''
      };
      data.journey.unshift(newItem);
      savePortfolio(data);
      return sendJson(res, 201, { ok: true, item: newItem });
    }

    if (pathname.startsWith('/api/journey/') && method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = pathname.split('/').pop();
      const body = await readBody(req);
      const data = loadPortfolio();
      const idx = data.journey.findIndex(j => j.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Role/Journey item not found' });
      data.journey[idx] = { ...data.journey[idx], ...body, id };
      savePortfolio(data);
      return sendJson(res, 200, { ok: true, item: data.journey[idx] });
    }

    if (pathname.startsWith('/api/journey/') && method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = pathname.split('/').pop();
      const data = loadPortfolio();
      data.journey = data.journey.filter(j => j.id !== id);
      savePortfolio(data);
      return sendJson(res, 200, { ok: true });
    }

    // Achievements CRUD
    if (pathname === '/api/achievements' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const data = loadPortfolio();
      if (!Array.isArray(data.achievements)) data.achievements = [];
      const newAch = {
        id: `ach-${Date.now()}`,
        title: body.title || '',
        issuer: body.issuer || '',
        year: body.year || '',
        description: body.description || ''
      };
      data.achievements.unshift(newAch);
      savePortfolio(data);
      return sendJson(res, 201, { ok: true, achievement: newAch });
    }

    if (pathname.startsWith('/api/achievements/') && method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = pathname.split('/').pop();
      const body = await readBody(req);
      const data = loadPortfolio();
      const idx = (data.achievements || []).findIndex(a => a.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Achievement not found' });
      data.achievements[idx] = { ...data.achievements[idx], ...body, id };
      savePortfolio(data);
      return sendJson(res, 200, { ok: true, achievement: data.achievements[idx] });
    }

    if (pathname.startsWith('/api/achievements/') && method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = pathname.split('/').pop();
      const data = loadPortfolio();
      data.achievements = (data.achievements || []).filter(a => a.id !== id);
      savePortfolio(data);
      return sendJson(res, 200, { ok: true });
    }

    // Technical Interests CRUD
    if (pathname === '/api/interests' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const data = loadPortfolio();
      if (!Array.isArray(data.interests)) data.interests = [];
      const newInt = {
        id: `int-${Date.now()}`,
        title: body.title || '',
        description: body.description || ''
      };
      data.interests.push(newInt);
      savePortfolio(data);
      return sendJson(res, 201, { ok: true, interest: newInt });
    }

    if (pathname.startsWith('/api/interests/') && method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const id = pathname.split('/').pop();
      const body = await readBody(req);
      const data = loadPortfolio();
      const idx = (data.interests || []).findIndex(i => i.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Interest not found' });
      data.interests[idx] = { ...data.interests[idx], ...body, id };
      savePortfolio(data);
      return sendJson(res, 200, { ok: true, interest: data.interests[idx] });
    }

    if (pathname.startsWith('/api/interests/') && method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = pathname.split('/').pop();
      const data = loadPortfolio();
      data.interests = (data.interests || []).filter(i => i.id !== id);
      savePortfolio(data);
      return sendJson(res, 200, { ok: true });
    }

    // Image Upload (Base64)
    if (pathname === '/api/upload' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req, 8 * 1024 * 1024);
      const match = String(body.dataUrl || '').match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
      if (!match) return sendJson(res, 400, { error: 'Invalid image format. Use PNG, JPG, WEBP, or GIF.' });
      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      const safeName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
      const outPath = path.join(UPLOAD_DIR, safeName);
      fs.writeFileSync(outPath, Buffer.from(match[2], 'base64'));
      return sendJson(res, 200, { ok: true, url: `images/uploads/${safeName}` });
    }

    // Fallback to static files
    return serveStatic(req, res, pathname);
  } catch (err) {
    console.error('[SERVER ERROR]', err);
    return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
});

// Ensure auth file exists on startup
loadAuth();

server.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard available at http://localhost:${PORT}/admin.html`);
});
