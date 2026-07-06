# hermion-classifier-os

**Open source signal classifier for [Hermion](https://hermionai.xyz) — the first interaction intelligence engine built on a proprietary physics theorem.**

Hermion models the dynamics of any relationship — making it descriptive, diagnosable, and predictive. Without ever reading your messages.

This classifier is the privacy layer that makes that possible.

---

## What this does

Every message you send carries more than its words. It carries intent, energy, emotional direction — interaction dynamics that accumulate into a structural pattern over time.

`hermion-classifier-os` takes raw conversation messages and extracts **Hermion Signals** — a compact, encoded representation of interaction dynamics. No message content is retained. No text is transmitted. Only the mathematical signal reaches Hermion's analysis engine.

```
Raw messages → [hermion-classifier-os] → Encoded Hermion Signals → Hermion API
     ↑                                                                    ↓
 your device                                                     Interaction intelligence
```

The classifier runs locally or on your own server. You control where it runs. You verify what leaves it.

---

## Why open source

We open sourced this classifier so you can verify our architecture — not replicate our intelligence.

Inspect this code. Confirm that no message is stored, logged, or transmitted beyond classification. The output is encoded in Hermion's proprietary signal language — meaningful only to Hermion's analysis engine.

**Open source is our contract with you. Hermion Signals are our asset.**

---

## Quick start

### Hosted (rate limited, no install)

```bash
# Get a passkey (one per IP, resets hourly)
curl https://classifier.hermionai.xyz/access

# Classify messages
curl -X POST https://classifier.hermionai.xyz/classify \
  -H "Content-Type: application/json" \
  -H "X-Hermion-Key: <your-passkey>" \
  -d '{
    "messages": [
      { "actor": "Alex", "ts": "2025-01-01T10:00:00Z", "text": "I really miss you right now" },
      { "actor": "Sam",  "ts": "2025-01-01T10:05:00Z", "text": "Miss you too, when are you back?" },
      { "actor": "Alex", "ts": "2025-01-01T10:06:00Z", "text": "Next week, can'\''t wait to see you" }
    ]
  }'
```

### Self-hosted (no rate limits)

```bash
git clone https://github.com/hermionai/hermion-classifier-os
cd hermion-classifier-os
npm install
cp .env.example .env
npm start
```

Then classify against your own instance:

```bash
curl -X POST http://localhost:3002/classify \
  -H "Content-Type: application/json" \
  -H "X-Hermion-Key: <your-passkey>" \
  -d '{ "messages": [...] }'
```

---

## Message format

Every message in the `messages` array follows this shape:

### Text message
```json
{
  "actor": "Alex",
  "ts": "2025-01-01T10:00:00Z",
  "text": "I really miss you right now"
}
```

### Gap signal (silence between messages)
```json
{
  "actor": "Alex",
  "ts": "2025-01-15T00:00:00Z",
  "is_gap": true,
  "gap_days": 14
}
```

### Voice / video call
```json
{
  "actor": "Alex",
  "ts": "2025-01-01T10:00:00Z",
  "call_type": "voice",
  "call_duration_min": 22,
  "missed_call": false
}
```

### Missed call
```json
{
  "actor": "Alex",
  "ts": "2025-01-01T10:00:00Z",
  "call_type": "voice",
  "call_duration_min": 0,
  "missed_call": true
}
```

**Field reference:**

| Field | Type | Required | Description |
|---|---|---|---|
| `actor` | string | ✅ | Message sender identifier |
| `ts` | ISO8601 string | ✅ | Message timestamp |
| `text` | string | for text messages | Message content |
| `is_gap` | boolean | for gaps | Marks a silence period |
| `gap_days` | float | with `is_gap` | Duration of silence in days |
| `call_type` | string | for calls | `"voice"` or `"video"` |
| `call_duration_min` | integer | for calls | Duration in minutes |
| `missed_call` | boolean | for calls | Whether call was answered |

---

## Signal output

The classifier returns encoded Hermion Signals — no readable category names, no plain floats. Each signal is a compact representation of interaction dynamics at that moment.

```json
{
  "signals": [
    {
      "actor": "Alex",
      "ts": "2025-01-01T10:00:00Z",
      "target": "Sam",
      "cat": "cat_a1f2",
      "evt": "evt_085010",
      "a": "u*0.923*1.0",
      "b": "min(q,s*0.923+0.15*0.077)",
      "gh": "gh_c1",
      "meta": {
        "response_latency_sec": null,
        "message_length": 27,
        "read_state": "unknown",
        "time_of_day": "morning"
      },
      "confidence": 0.923,
      "is_gap_signal": false,
      "gap_days": null,
      "call_type": null,
      "call_duration_min": null,
      "missed_call": false
    }
  ],
  "count": 3
}
```

These signals are the input to Hermion's analysis engine. They contain no message content — only dynamics.

---

## Using signals with the Hermion API

Pass encoded signals directly to `/api/v1/analyze`:

```javascript
// Step 1 — classify
const classifyRes = await fetch('https://classifier.hermionai.xyz/classify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Hermion-Key': passkey,
  },
  body: JSON.stringify({ messages }),
})
const { signals } = await classifyRes.json()

// Step 2 — analyze
const analyzeRes = await fetch('https://api.hermionai.xyz/api/v1/analyze', {
  method: 'POST',
  headers: {
    'Content-Type':  'application/json',
    'Authorization': 'Bearer herm_sk_live_...',
  },
  body: JSON.stringify({
    signals,
    context_type: 'relationship',  // relationship | fling | friendship | professional | sales | deal | family
    self_name:    'Alex',
  }),
})
const intelligence = await analyzeRes.json()
```

Get your API key at [hermionai.xyz/get-started](https://hermionai.xyz/get-started).

---

## MCP (Model Context Protocol)

Hermion exposes five MCP tools for AI agents. Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hermion": {
      "url": "https://api.hermionai.xyz/mcp/sse",
      "headers": {
        "Authorization": "Bearer herm_sk_live_..."
      }
    }
  }
}
```

### Available tools

| Tool | Input | Returns |
|---|---|---|
| `hermion_classify` | `messages[]` | Encoded Hermion Signals |
| `hermion_analyze` | `signals[]` | Full intelligence — progression, momentum, next move, risks, diagnosis |
| `hermion_get_state` | `signals[]` | Progression + momentum + interest level |
| `hermion_recommend_move` | `signals[]` | Next move + reasons |
| `hermion_detect_risks` | `signals[]` | Risk scores + short circuits |

**Always call `hermion_classify` first.** The other tools take signals as input — not raw messages.

```
Agent → hermion_classify(messages) → signals
Agent → hermion_get_state(signals) → current state
Agent → hermion_recommend_move(signals) → what to do next
Agent → hermion_detect_risks(signals) → what to watch out for
```

---

## Rate limits (hosted)

| Tier | Limit |
|---|---|
| Public (passkey) | 30 calls / minute per IP |
| Self-hosted | No limits |

For production or high-volume use, self-host this repo. It runs on any Node.js server and the model weights are included.

---

## Environment variables

```bash
PORT=3002                          # Server port
HERMION_INTERNAL_SECRET=           # Secret for internal/backend use (bypasses rate limits)
```

---

## Self-hosting for maximum privacy

Self-hosting gives you:
- **No rate limits** — classify as many messages as your server can handle
- **Complete data isolation** — messages never leave your infrastructure
- **Verifiable privacy** — inspect every line of this code

The only data that leaves your server is the encoded signal payload you choose to send to `api.hermionai.xyz`. That payload contains no message content.

---

## What this is not

This classifier does not contain Hermion's analysis engine. It is not possible to reconstruct Hermion's intelligence from this repository. The encoded signals it produces are interpretable only by Hermion's backend — which applies a proprietary physics theorem to model interaction dynamics.

This is intentional. Open source is for trust. The intelligence layer is Hermion's.

---

## License

MIT — use it, inspect it, self-host it.

---

**[Try Hermion](https://hermionai.xyz) · [Get an API key](https://hermionai.xyz/get-started) · [Read the docs](https://hermionai.xyz/docs)**