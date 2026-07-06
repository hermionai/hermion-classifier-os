import express        from 'express';
import { randomBytes } from 'crypto';
import { classifyMessages, warmUp } from './classifier-os.js';

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(express.json({ limit: '10mb' }));

// ── Rate limit + pool constants ───────────────────────────────────────────

const MAX_POOL        = 1000;   // max unique IPs in memory
const RATE_LIMIT      = 30;     // calls per window per key
const RATE_WINDOW_MS  = 60_000; // 1 minute window
const KEY_TTL_MS      = 60 * 60_000; // 1 hour — key expires, dev calls /access again

// ── Passkey store ─────────────────────────────────────────────────────────
//
// _keys: passkey → { ip, issuedAt, callCount, windowStart }
// _ips:  ip      → passkey   (one active key per IP)

const _keys = new Map();
const _ips  = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────

function _makeKey() {
  return randomBytes(12).toString('hex');
}

function _clientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function _evictExpired() {
  const now = Date.now();
  for (const [key, entry] of _keys.entries()) {
    if (now - entry.issuedAt >= KEY_TTL_MS) {
      _ips.delete(entry.ip);
      _keys.delete(key);
    }
  }
}

function _issueKey(ip) {
  // Invalidate existing key for this IP if present
  const existing = _ips.get(ip);
  if (existing) {
    _keys.delete(existing);
    _ips.delete(ip);
  }

  const key   = _makeKey();
  const now   = Date.now();
  _keys.set(key, { ip, issuedAt: now, callCount: 0, windowStart: now });
  _ips.set(ip, key);
  return key;
}

function _checkRateLimit(entry) {
  const now = Date.now();
  if (now - entry.windowStart >= RATE_WINDOW_MS) {
    entry.callCount   = 0;
    entry.windowStart = now;
  }
  if (entry.callCount >= RATE_LIMIT) return false;
  entry.callCount++;
  return true;
}

// ── Background cleanup — evict expired keys every 10 minutes ─────────────

setInterval(_evictExpired, 10 * 60_000);

// ── Routes ────────────────────────────────────────────────────────────────

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// GET /access
// Issues a short-lived passkey bound to the caller's IP.
// One active key per IP — calling again invalidates the old key and issues a new one.
// Pool capped at MAX_POOL unique IPs. When full, expired keys free slots automatically.

app.get('/access', (req, res) => {
  _evictExpired();

  const ip = _clientIp(req);

  // If IP already has a slot, cycling is free — no pool check needed
  const hasSlot = _ips.has(ip);

  if (!hasSlot && _keys.size >= MAX_POOL) {
    return res.status(429).json({
      error:   'capacity_reached',
      message: 'Hosted classifier is at capacity. Self-host hermion-classifier-os for unrestricted access.',
      docs:    'https://github.com/hermionai/hermion-classifier-os',
    });
  }

  const key = _issueKey(ip);

  res.json({
    key,
    rate_limit:     RATE_LIMIT,
    window_seconds: RATE_WINDOW_MS / 1000,
    ttl_seconds:    KEY_TTL_MS    / 1000,
    note:           'One key per IP. Calling /access again issues a fresh key and invalidates the previous one.',
  });
});

// POST /classify
// Classifies messages and returns encoded Hermion Signals.
// Requires valid passkey in X-Hermion-Key header, issued to the calling IP.

app.post('/classify', async (req, res) => {
  const passkey = req.headers['x-hermion-key'];

  if (!passkey) {
    return res.status(401).json({ error: 'missing_key', message: 'Provide your passkey in the X-Hermion-Key header. Call GET /access to obtain one.' });
  }

  const entry = _keys.get(passkey);
 
  if (!entry) {
    return res.status(401).json({ error: 'invalid_key', message: 'Key not found or expired. Call GET /access for a new key.' });
  }

  const ip = _clientIp(req);
  if (entry.ip !== ip) {
    return res.status(403).json({ error: 'ip_mismatch', message: 'Key was issued to a different IP. Call GET /access from this IP.' });
  }

  if (!_checkRateLimit(entry)) {
    return res.status(429).json({
      error:         'rate_limit_exceeded',
      message:       `Limit is ${RATE_LIMIT} calls per ${RATE_WINDOW_MS / 1000}s. Call GET /access to reset your window — or self-host for higher throughput.`,
      retry_after_s: Math.ceil((RATE_WINDOW_MS - (Date.now() - entry.windowStart)) / 1000),
    });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const signals = await classifyMessages(messages);
    res.json({ signals, count: signals.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────

warmUp()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Warm-up failed:', err);
    process.exit(1);
  });