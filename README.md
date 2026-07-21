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

 
## Meeting Intelligence
 
Meeting transcripts work identically to messaging. Parse the transcript into the standard `{ actor, ts, text }` message array, then call the classifier exactly as normal — nothing else changes.
 
### Supported transcript formats
 
All four formats normalize to the same message array.
 
**Format 1 — Zoom / Otter.ai / Fireflies labeled turns**
```
Alex Chen  00:01:23
We've been seeing really strong retention numbers.
 
Chen Wei  00:01:30
That's encouraging. What does churn look like?
```
 
**Format 2 — WebVTT (.vtt from Zoom / Google Meet)**
```
00:01:23.000 --> 00:01:28.000
<v Alex Chen>We've been seeing really strong retention numbers.
 
00:01:28.500 --> 00:01:34.000
<v Chen Wei>That's encouraging. What does churn look like?
```
 
**Format 3 — Plain colon-separated (manual / no timestamps)**
```
Alex Chen: We've been seeing really strong retention numbers.
Chen Wei: That's encouraging. What does churn look like?
```
 
**Format 4 — Notion AI / markdown bold speaker**
```
**Alex Chen:** We've been seeing really strong retention numbers.
 
**Chen Wei:** That's encouraging. What does churn look like?
```
 
### Parse to standard message array
 
After parsing, assign synthetic timestamps if the format has none (30 seconds apart is the convention). Then call the classifier exactly as you would for any conversation:
 
```javascript
// After parsing any format above:
const messages = [
  {
    actor: "Alex Chen",
    ts: "2025-01-01T00:01:23Z",  // from transcript, or synthetic
    text: "We've been seeing really strong retention numbers."
  },
  {
    actor: "Chen Wei",
    ts: "2025-01-01T00:01:30Z",
    text: "That's encouraging. What does churn look like?"
  }
]
 
// Call the classifier — nothing changes from the messaging flow:
const res = await fetch("https://classifier.hermionai.xyz/classify", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Hermion-Key": passkey
  },
  body: JSON.stringify({ messages })
})
const { signals } = await res.json()
```
 
Then pass signals to `/api/v1/analyze` as normal, with `self_name` set to whichever speaker or group name represents you.
 
**Format reference:**
 
| Format | Timestamp | Source |
|---|---|---|
| Labeled turns (`Name  HH:MM:SS`) | From transcript | Zoom, Otter.ai, Fireflies |
| WebVTT (`.vtt`) | From cue timestamps | Zoom, Google Meet |
| Plain colon (`Name: text`) | Synthetic (30s apart) | Manual notes, plain paste |
| Markdown bold (`**Name:** text`) | Synthetic (30s apart) | Notion AI, meeting notes |
 
**Automation pattern:** As your meeting ends, your transcription tool exports the file. Your server parses it, calls the classifier, calls `/api/v1/analyze`. Intelligence is delivered to your team before they finish writing their notes — no manual upload, no interface required.
 
---


## Group Intelligence
 
Group Intelligence works by preparing the message array before the classifier runs. The classifier and API are unchanged — they always operate on exactly two actors. Your job is to decide which actors matter, which to ignore, and how to label the two sides.
 
### Why we prepare on your side, not ours
 
Hermion never sees your messages. The classifier converts them to encoded signals — no text is transmitted or stored. This means actor filtering and proximity analysis must happen on your side, before classification. This is intentional: **privacy-first architecture means you control which messages reach the classifier at all.**
 
You can adopt the algorithm below exactly, or tune it for your use case — you have full access to your messages, we do not.
 
---
 
### Step 1 — Parse the group export
 
Export any group conversation and parse it into a standard message array. Works with WhatsApp group exports (`.zip` or `.txt`), Slack exports, Discord exports, or any meeting transcript with 3+ speakers.
 
```javascript
const rawMessages = [
  { actor: "Alex",  ts: "2025-01-01T10:00:00Z", text: "We're at 94% retention MoM." },
  { actor: "Maya",  ts: "2025-01-01T10:01:00Z", text: "Enterprise churn is our strongest segment." },
  { actor: "Chen",  ts: "2025-01-01T10:02:00Z", text: "That's encouraging. When does your round close?" },
  { actor: "James", ts: "2025-01-01T10:03:00Z", text: "We'll need one more month of data." },
  { actor: "Alex",  ts: "2025-01-01T10:04:00Z", text: "We're targeting end of Q3." },
]
```
 
---
 
### Step 2 — Define your groups and ignored actors
 
Assign each actor to a group name, or leave them out to ignore them entirely. Ignored actors are stripped before classification — their messages never reach the classifier.
 
```javascript
const actorGroups = {
  "Alex":  "Startup",         // Group 1
  "Maya":  "Startup",         // Group 1
  "Chen":  "Investor Group",  // Group 2
  "James": "Investor Group",  // Group 2
  // Any actor not listed is ignored — stripped completely
}
```
 
---
 
### Step 3 — Apply the window algorithm
 
In a real group conversation, assigned actors may not always be speaking to each other. Between Alex's message and Chen's response, there may be several messages from ignored actors. If you strip ignored actors and keep all assigned actor messages, you risk pairing messages that were never in the same exchange.
 
**Our solution:** Only keep a message from an assigned actor if the other group contributed at least once within ±N messages of it in the original full array. The original array — including ignored actors' messages — is used as a position ruler. Ignored actors' messages count toward the window measurement but are never kept.
 
**Deriving N:**
 
```
groupSpacing(Group) = totalMessages / totalMessagesFromGroupActors
N = min(max(groupSpacingA, groupSpacingB), 20)
```
 
- Use the group's combined message count, not individual actor counts
- Take the maximum spacing between the two groups — this is the natural window for the less frequent group
- Hard ceiling of 20: if 20 messages have passed without the other group contributing, these actors are not in the same exchange. Human attention and conversational context do not span that distance in a group chat
**Bypass condition:** If no actors are ignored (all detected actors are assigned to a group), skip the window algorithm entirely. Every message is between the two groups by definition.
 
```javascript
function prepareGroupMessages(allMessages, actorGroups) {
  const assignedActors = Object.keys(actorGroups)
  const total = allMessages.length
 
  // Bypass: no ignored actors
  const ignoredExists = allMessages.some(m => !(m.actor in actorGroups))
  if (!ignoredExists) {
    return allMessages
      .filter(m => m.actor in actorGroups)
      .map(m => ({ ...m, actor: actorGroups[m.actor] }))
  }
 
  // Compute group spacings
  const groupNames = [...new Set(Object.values(actorGroups))]
  const groupCounts = {}
  for (const g of groupNames) groupCounts[g] = 0
  for (const m of allMessages) {
    if (m.actor in actorGroups) groupCounts[actorGroups[m.actor]]++
  }
 
  const spacings = groupNames.map(g =>
    groupCounts[g] > 0 ? total / groupCounts[g] : total
  )
  const N = Math.min(Math.max(...spacings), 20)
 
  // Window filter
  const kept = []
  for (let i = 0; i < allMessages.length; i++) {
    const msg = allMessages[i]
    if (!(msg?.actor in actorGroups)) continue
 
    const myGroup = actorGroups[msg.actor]
    const start = Math.max(0, i - Math.round(N))
    const end = Math.min(allMessages.length - 1, i + Math.round(N))
 
    let found = false
    for (let j = start; j <= end; j++) {
      if (j === i) continue
      const neighbor = allMessages[j]
      if (!neighbor) continue
      if (neighbor.actor in actorGroups && actorGroups[neighbor.actor] !== myGroup) {
        found = true
        break
      }
    }
 
    if (found) {
      kept.push({ ...msg, actor: actorGroups[msg.actor] })
    }
  }
 
  return kept
}
 
const preparedMessages = prepareGroupMessages(rawMessages, actorGroups)
// Result: only messages where the other group appeared within ±N positions
// All actor names remapped to group names
// Ignored actors stripped completely — never reach the classifier
```
 
---
 
### Step 4 — Classify and analyze
 
```javascript
// Classify the prepared messages — same call as always
const classifyRes = await fetch("https://classifier.hermionai.xyz/classify", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Hermion-Key": passkey
  },
  body: JSON.stringify({ messages: preparedMessages })
})
const { signals } = await classifyRes.json()
 
// Analyze — self_name is your group name
const analyzeRes = await fetch("https://api.hermionai.xyz/api/v1/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer herm_sk_live_..."
  },
  body: JSON.stringify({
    signals,
    context_type: "professional",  // or deal, relationship, etc.
    self_name: "Startup"           // whichever group name is yours
  })
})
const intelligence = await analyzeRes.json()
```
 
---
 
### Preserving individual speaker attribution
 
The classifier receives group names as actor identifiers. If you want individual speaker attribution in your own display layer, maintain a parallel map client-side — never send it to the API:
 
```javascript
// Build display labels from your original mapping
const displayMap = {}
Object.entries(actorGroups).forEach(([speaker, group]) => {
  displayMap[speaker] = `${speaker} (${group})`
})
// { "Alex": "Alex (Startup)", "Maya": "Maya (Startup)", ... }
// Use for your own signal trace display only
// The backend always receives group names — never display labels
```
 
---
 
### Common patterns
 
| Pattern | Actor mapping | `self_name` |
|---|---|---|
| Two-side meeting | Your team → `"Us"`, their team → `"Them"` | `"Us"` |
| Investor call | Founders → `"Startup"`, GPs → `"Investors"` | `"Startup"` |
| Team pair evaluation | Alice → `"Alice"`, Bob → `"Bob"`, everyone else ignored | `"Alice"` |
| GP split (isolate decision maker) | Chen → `"Startup"`, James → `"Investors"`, others ignored | `"Startup"` |
| Ally detection | Your team + target → `"Our Side"`, rest → `"Their Side"` | `"Our Side"` |
| Meeting with 3+ speakers | Parse transcript, apply group mapping above | your group name |
| Team composition analysis | Run multiple pairings systematically — vary who is assigned vs ignored to find structural peaks | varies |
 
---
 
### A note on tuning
 
The window algorithm above is what Hermion uses in its web app. It is a privacy-first approximation — designed to work without reading message content, only message positions and actor identity.
 
If you have access to your messages (which you do, since you are running this on your own infrastructure), you can go further:
 
- Use semantic similarity to identify which messages are topically related before filtering
- Use reply threading data (if your platform exposes it) for precise exchange mapping
- Use time windows instead of message count windows for slow-moving groups
- Run the analysis multiple times with different actor groupings to find structural peaks
Hermion's engine is indifferent to how you prepared the messages — it reads the signals. The more precisely you can isolate a genuine two-actor exchange, the more accurate the intelligence will be.
 

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