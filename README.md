<!-- ─────────────────────────────────────────────────────────────────────────
PATCH — hermion-classifier-os/README.md

INSERT the two sections below immediately after the "Message format" section
and before the "Signal output" section.

Find this line:
  ## Signal output

Insert everything between the markers above it.
───────────────────────────────────────────────────────────────────────── -->

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

### Step 1 — Parse the group export

Export any group conversation and parse it into a standard message array. Works with WhatsApp group exports (`.zip` or `.txt`), Slack exports, Discord exports, or any meeting transcript with 3+ speakers.

```javascript
// Raw parsed messages — 4 actors detected
const rawMessages = [
  { actor: "Alex",  ts: "2025-01-01T10:00:00Z", text: "We're at 94% retention MoM." },
  { actor: "Maya",  ts: "2025-01-01T10:01:00Z", text: "Enterprise churn is our strongest segment." },
  { actor: "Chen",  ts: "2025-01-01T10:02:00Z", text: "That's encouraging. When does your round close?" },
  { actor: "James", ts: "2025-01-01T10:03:00Z", text: "We'll need one more month of data." },
  { actor: "Alex",  ts: "2025-01-01T10:04:00Z", text: "We're targeting end of Q3." },
]
```

### Step 2 — Define your groups

Assign each actor to a group name, or leave them out to ignore them. Ignored actors are stripped entirely — their messages are removed before the classifier runs. The two group names become the actor identifiers the engine sees.

```javascript
const actorGroups = {
  "Alex":  "Startup",         // assigned to Group 1
  "Maya":  "Startup",         // assigned to Group 1
  "Chen":  "Investor Group",  // assigned to Group 2
  "James": "Investor Group",  // assigned to Group 2
  // any actor not listed is ignored and stripped
}

function prepareGroupMessages(messages, actorGroups) {
  return messages
    .filter(msg => msg.actor in actorGroups)   // strip ignored actors
    .map(msg => ({
      ...msg,
      actor: actorGroups[msg.actor]            // remap to group name
    }))
}

const preparedMessages = prepareGroupMessages(rawMessages, actorGroups)
// Classifier and API see only two actors: "Startup" and "Investor Group"
```

### Step 3 — Call classifier and analyze

```javascript
// Classify — same call as always
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
    context_type: "deal",
    self_name: "Startup"   // whichever group name is yours
  })
})
const intelligence = await analyzeRes.json()
```

### Preserving individual speaker attribution

The classifier output shows `actor: "Startup"` for all Group 1 signals. If you want individual speaker attribution in your own logging or display layer, keep a parallel map and enrich on your side — never send it to the API:

```javascript
// Build display labels from your original mapping
const displayMap = {}
Object.entries(actorGroups).forEach(([speaker, group]) => {
  displayMap[speaker] = `${speaker} (${group})`
})
// { "Alex": "Alex (Startup)", "Maya": "Maya (Startup)", ... }
// Use this for your own signal trace display only
```

### Common patterns

| Pattern | Actor mapping | `self_name` |
|---|---|---|
| Two-side meeting | Your team → `"Us"`, their team → `"Them"` | `"Us"` |
| Investor call | Founders → `"Startup"`, GPs → `"Investors"` | `"Startup"` |
| Team pair evaluation | Alice → `"Alice"`, Bob → `"Bob"`, everyone else ignored | `"Alice"` |
| GP split (isolate decision maker) | Chen → `"Startup"`, James → `"Investors"`, others ignored | `"Startup"` |
| Ally detection | Your team + target → `"Our Side"`, rest → `"Their Side"` | `"Our Side"` |
| Meeting with 3+ speakers | Parse transcript, apply group mapping above | your group name |

**Note:** Meeting transcripts with 3+ speakers use the same group preparation flow. Group Intelligence and Meeting Intelligence share identical classifier and API calls — the only difference is input preparation.