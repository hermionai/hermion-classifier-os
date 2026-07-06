import { pipeline, env } from '@huggingface/transformers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MODEL_PATH = process.env.MODEL_PATH
  ? join(process.cwd(), process.env.MODEL_PATH)
  : join(__dirname, 'models');

const _anchorsRaw  = JSON.parse(readFileSync(join(__dirname, 'anchors.json'),  'utf8'));
const _ontologyRaw = JSON.parse(readFileSync(join(__dirname, 'ontology.json'), 'utf8'));

const _e9k = {};
for (const [_ck, _ci] of Object.entries(_ontologyRaw.categories)) {
  for (const _et of (_ci.event_types || [])) {
    _e9k[_et] = _ck;
  }
}

const _CD = {
  'cat_a1f2': {a:'u', b:'s', gh:'gh_c1', cp:'q'},
  'cat_b3e7': {a:'s', b:'q', gh:'gh_c1'},
  'cat_c4d8': {a:'o', b:'o', gh:'gh_c1', cp:'p'},
  'cat_d5c9': {a:'s', b:'q', gh:'gh_c1'},
  'cat_e6b0': {a:'g', b:'q', gh:'gh_c1'},
  'cat_f7a1': {a:'a', b:'t', gh:'gh_u1', fl:'q'},
  'cat_g8z2': {a:'m', b:'q', gh:'gh_r1'},
  'cat_h9y3': {a:'e', b:'l', gh:'gh_w1'},
  'cat_i0x4': {a:'c', b:'t', gh:'gh_u1', fl:'q'},
  'cat_j1w5': {a:'q', b:'q', gh:'gh_c1'},
  'cat_k2v6': {a:'h', b:'i', gh:'gh_i1', cp:'k'},
  'cat_l3u7': {a:'h', b:'k', gh:'gh_i1', cp:'l'},
  'cat_m4t8': {a:'q', b:'m', gh:'gh_c1'},
  'cat_n5s9': {a:'g', b:'q', gh:'gh_a1'},
  'cat_o6r0': {a:'c', b:'s', gh:'gh_t1', fl:'o'},
  'cat_p7q1': {a:'s', b:'v', gh:'gh_c1', fl:'s'},
  'cat_q8p2': {a:'b', b:'o', gh:'gh_w1'},
  'cat_r9o3': {a:'m', b:'o', gh:'gh_c1'},
  'cat_s0n4': {a:'h', b:'o', gh:'gh_t1'},
  'cat_t1m5': {a:'h', b:'k', gh:'gh_i1', cp:'k'},
  'cat_u2l6': {a:'o', b:'o', gh:'gh_c1', cp:'r'},
  'cat_v3k7': {a:'q', b:'s', gh:'gh_i1', fl:'n'},
  'cat_w4j8': {a:'f', b:'r', gh:'gh_a1', fl:'m'},
  'cat_x5i9': {a:'n', b:'s', gh:'gh_co1', fl:'m'},
  'cat_y6h0': {a:'n', b:'u', gh:'gh_co1', fl:'r'},
  'cat_z7g1': {a:'j', b:'n', gh:'gh_c1', cp:'q'},
  'cat_a8f2': {a:'d', b:'r', gh:'gh_a1', fl:'m'},
  'cat_b9e3': {a:'p', b:'m', gh:'gh_i1', cp:'p'},
  'cat_c0d4': {a:'s', b:'t', gh:'gh_co1', fl:'p'},
  'cat_d1c5': {a:'q', b:'r', gh:'gh_a1', fl:'m'},
  'cat_e2b6': {a:'o', b:'p', gh:'gh_c1', cp:'s'},
  'cat_f3a7': {a:'r', b:'p', gh:'gh_c1', cp:'s'},
};

const _h3a = new Set([
  'cat_h9y3',
  'cat_o6r0',
  'cat_f7a1',
  'cat_i0x4',
  'cat_q8p2',
  'cat_a8f2',
  'cat_w4j8',
]);

const _b7f = new Set([
  'cat_a1f2',
  'cat_b3e7',
  'cat_c4d8',
  'cat_d5c9',
  'cat_m4t8',
  'cat_p7q1',
  'cat_r9o3',
  'cat_j1w5',
  'cat_g8z2',
  'cat_u2l6',
  'cat_x5i9',
  'cat_y6h0',
  'cat_b9e3',
  'cat_c0d4',
  'cat_d1c5',
  'cat_e2b6',
  'cat_f3a7',
]);

const _c2d = new Set([
  'cat_l3u7',
  'cat_k2v6',
  'cat_t1m5',
  'cat_v3k7',
  'cat_z7g1',
]);

const URL_PATTERN      = /https?:\/\/\S+/i;
const NUMERIC_ONLY     = /^\d[\d,.\s]*$/;
const SHORT_ID_PATTERN = /^[A-Z0-9]{4,20}$/;
const ADDRESS_TYPO     = /\badd?r?e*s+\b/i;
const PUNCTUATION_ONLY = /^[\s.…,!?*_~\-–—+=#@^&|<>()[\]{}'"`;:/\\]+$/;
const SHORT_PROFESSIONAL_ACK = /^(yes\s+(sir|ma)|no\s+(sir|ma)|okay\s+(sir|ma)|sure\s+(sir|ma)|noted\s+(sir|ma)|alright\s+(sir|ma))\.?$/i;
const ACTIVITY_UPDATE  = /\b(driving|parked|parking|in traffic|on my way|at the office|in a meeting|in church|boarding|landed|just got|just arrived|just left)\b/i;
const THIRD_PERSON         = /\b(he|she|him|her|his|hers|they|them|their|this person|the guy|the girl|someone|this man|this woman)\b/i;
const SECOND_PERSON_DIRECT = /\b(you|your|you're|you've|you'll|you'd)\b/i;
const WORK_SIGNALS         = /\b(login|password|account|email|gmail|crypto|btc|wallet|transaction|complaint|resolve|client|customer)\b/i;
const SELF_REFERENCE       = /\b(i feel|i felt|i was|i am|i've been|it hurt me|made me|i'm scared|i miss|i loved|i lost|i can't|i don't know|i need|i want|i wish|i thought)\b/i;
const GREETING_ONLY        = /^(good\s+)?(morning|afternoon|evening|night|hi|hello|hey|howdy)[\s!.]*$/i;

const TOO_SHORT_NON_EMOJI = (t) => t.length <= 2 && !/\p{Emoji}/u.test(t);

function _itc(text) {
  const t = text.trim();
  if (URL_PATTERN.test(t))      return true;
  if (NUMERIC_ONLY.test(t))     return true;
  if (SHORT_ID_PATTERN.test(t)) return true;
  if (ADDRESS_TYPO.test(t) && t.length < 20) return true;
  return false;
}

function _itp(text) {
  const _ht  = THIRD_PERSON.test(text);
  const _hsp = SECOND_PERSON_DIRECT.test(text);
  const _hws = WORK_SIGNALS.test(text);
  const _hsr = SELF_REFERENCE.test(text);
  if (_hsr) return false;
  return _ht && (!_hsp || _hws);
}

const _sf = 0.15;
const _sc = 0.55;
const _ms = 0.22;

function _stc(sim) {
  const _cl = Math.max(_sf, Math.min(_sc, sim));
  return (_cl - _sf) / (_sc - _sf);
}

function _cs(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function _tod(ts) {
  const h = ts.getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'late_night';
}

function _acw(match, confidence, _rs) {
  if (_rs.length < 2)           return { match, _id: 1.0 };
  if (!_h3a.has(match.category)) return { match, _id: 1.0 };

  const _w   = _rs.slice(-4);
  const _pc  = _w.filter(s => _b7f.has(s.category)).length;
  const _nc  = _w.filter(s => _c2d.has(s.category)).length;
  const _pr  = _pc / _w.length;

  if (_pr >= 0.5 && confidence < 0.72) {
    return {
      match: {
        eventType: _nc > _pc ? 'evt_91c794' : 'evt_1a6c95',
        category:  'cat_l3u7',
        similarity: match.similarity,
      },
      _id: 1.0,
    };
  }

  const _id = _pr >= 0.25
    ? Math.max(0.4, 1.0 - _pr * 0.8)
    : 1.0;

  return { match, _id };
}

let _ei      = null;
let _aec     = null;

async function _ge() {
  if (_ei) return _ei;
  env.allowLocalModels  = true;
  env.allowRemoteModels = false;
  env.localModelPath    = MODEL_PATH + '/';
  env.useBrowserCache   = false;
  _ei = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
    { dtype: 'q8', local_files_only: true }
  );
  return _ei;
}

async function _gae() {
  if (_aec) return _aec;
  const _emb   = await _ge();
  const _cache = new Map();
  const _anch  = _anchorsRaw.anchors;

  for (const [_et, _phrases] of Object.entries(_anch)) {
    const _vecs = [];
    for (const _ph of _phrases) {
      const _out = await _emb(_ph, { pooling: 'mean', normalize: true });
      _vecs.push(_out.data);
    }
    const _dim = _vecs[0].length;
    const _avg = new Float32Array(_dim);
    for (const _v of _vecs) {
      for (let i = 0; i < _dim; i++) _avg[i] += _v[i] / _vecs.length;
    }
    let _norm = 0;
    for (let i = 0; i < _dim; i++) _norm += _avg[i] * _avg[i];
    _norm = Math.sqrt(_norm);
    for (let i = 0; i < _dim; i++) _avg[i] /= _norm;
    _cache.set(_et, _avg);
  }

  _aec = _cache;
  return _aec;
}

async function _ct(text) {
  const t = text.trim();

  if (PUNCTUATION_ONLY.test(t) || TOO_SHORT_NON_EMOJI(t)) {
    return { eventType: 'evt_3994e3', category: 'cat_l3u7', similarity: 0.5 };
  }
  if (_itc(t)) {
    return { eventType: 'evt_e1b7c2', category: 'cat_l3u7', similarity: 0.5 };
  }
  if (_itp(t)) {
    const _iw = WORK_SIGNALS.test(t);
    return {
      eventType: _iw ? 'evt_2c618d' : 'evt_201aaa',
      category:  _iw ? 'cat_t1m5'   : 'cat_c4d8',
      similarity: 0.45,
    };
  }

  const _emb  = await _ge();
  const _anch = await _gae();

  const _out  = await _emb(text, { pooling: 'mean', normalize: true });
  const _mv   = _out.data;

  let _best = { eventType: 'evt_3994e3', category: 'cat_l3u7', similarity: -1 };
  for (const [_et, _av] of _anch.entries()) {
    const _sim = _cs(_mv, _av);
    if (_sim > _best.similarity) {
      _best = {
        eventType: _et,
        category:  _e9k[_et] ?? 'cat_l3u7',
        similarity: _sim,
      };
    }
  }

  if (_best.similarity < _ms) {
    return { eventType: 'evt_3994e3', category: 'cat_l3u7', similarity: _best.similarity };
  }

  return _best;
}

const _LW  = 8;
const _BM  = 10;
const _MC  = 4;
const _ML  = 15;

const _DT = [
  { pct: 0.35, intensity: 0.25, label: 'subtle'   },
  { pct: 0.50, intensity: 0.40, label: 'mild'     },
  { pct: 0.65, intensity: 0.55, label: 'moderate' },
  { pct: 0.75, intensity: 0.70, label: 'clear'    },
  { pct: 0.85, intensity: 0.85, label: 'strong'   },
];

function _als() {
  return { messages: [], baseline: null, prevDeviation: null, consecutiveCount: 0 };
}

function _gtb(deviation) {
  let breach = null;
  for (const t of _DT) {
    if (deviation >= t.pct) breach = t;
  }
  return breach;
}

function _cls(text, actor, target, ts, _as) {
  const _ml = text.trim().length;

  if (!_as.has(actor)) _as.set(actor, _als());
  const _st = _as.get(actor);
  _st.messages.push(_ml);

  if (_st.messages.length < _BM) return null;

  const _wm    = _st.messages.slice(-_LW);
  _st.baseline = _wm.reduce((a, b) => a + b, 0) / _wm.length;

  if (_ml <= _ML) {
    _st.consecutiveCount = 0;
    _st.prevDeviation    = null;
    return null;
  }

  const _pw  = _st.messages.slice(-(_LW + 1), -1);
  const _pb  = _pw.length >= 3
    ? _pw.reduce((a, b) => a + b, 0) / _pw.length
    : _st.baseline;

  const _rd  = (_pb - _ml) / _pb;
  const _dir =
    _rd >  0.05 ? 'decline'  :
    _rd < -0.05 ? 'increase' : null;

  if (_dir === null) {
    _st.consecutiveCount = 0;
    _st.prevDeviation    = null;
    return null;
  }

  if (_dir === _st.prevDeviation) {
    _st.consecutiveCount++;
  } else {
    _st.consecutiveCount = 1;
    _st.prevDeviation    = _dir;
  }

  if (_st.consecutiveCount < _MC) return null;
  if (_st.consecutiveCount > _MC) return null;

  const _dv  = Math.abs(_rd);
  const _br  = _gtb(_dv);
  if (!_br) return null;

  const _base = {
    ts,
    actor,
    target,
    meta: {
      response_latency_sec: null,
      message_length:       _ml,
      read_state:           'unknown',
      time_of_day:          'unknown',
    },
    confidence:        1.0,
    is_gap_signal:     false,
    is_length_signal:  true,
    gap_days:          null,
    call_type:         null,
    call_duration_min: null,
    missed_call:       false,
  };

  if (_dir === 'decline') {
    return {
      ..._base,
      cat:  'cat_h9y3',
      evt:  'evt_f27dc6',
      a:    `${-_br.intensity * 0.8}`,
      b:    `${_br.intensity}`,
      gh:   'gh_w1',
    };
  }

  return {
    ..._base,
    cat:  'cat_j1w5',
    evt:  'evt_88de56',
    a:    `${_br.intensity * 0.7}`,
    b:    `${_br.intensity}`,
    gh:   'gh_c1',
  };
}

export async function classifyMessages(messages) {
  const _actors = [...new Set(messages.filter(m => !m.is_gap).map(m => m.actor))];
  const signals = [];
  const _as     = new Map();

  for (let i = 0; i < messages.length; i++) {
    const msg   = messages[i];
    const ts    = new Date(msg.ts);
    const actor = msg.actor;

    if (msg.is_gap) {
      const _gd  = msg.gap_days ?? 1;
      const _gi  = Math.min(0.95, 0.3 + (_gd / 60));
      const _gs  = -(0.2 + Math.min(0.4, _gd / 100));
      signals.push({
        ts:                msg.ts,
        actor,
        target:            null,
        cat:               'cat_h9y3',
        evt:               _gd >= 7 ? 'evt_289448' : 'evt_289448',
        a:                 `${Math.max(-1, Math.min(1, Math.round(_gs * 1000) / 1000))}`,
        b:                 `${Math.max(0,  Math.min(1, Math.round(_gi * 1000) / 1000))}`,
        gh:                'gh_w1',
        meta: {
          response_latency_sec: Math.round(_gd * 86400),
          message_length:       0,
          read_state:           'unknown',
          time_of_day:          'morning',
        },
        confidence:        1.0,
        is_gap_signal:     true,
        gap_days:          _gd,
        call_type:         null,
        call_duration_min: null,
        missed_call:       false,
      });
      _as.clear();
      continue;
    }

    if (msg.call_type && msg.call_duration_min !== undefined && msg.call_duration_min !== null) {
      const _dm   = msg.call_duration_min;
      const _iv   = msg.call_type === 'video';
      const _im   = msg.missed_call === true;
      const _pts  = i > 0 ? new Date(messages[i - 1].ts) : null;

      if (_im) {
        signals.push({
          ts:                msg.ts,
          actor,
          target:            _actors.find(a => a !== actor) ?? null,
          cat:               'cat_q8p2',
          evt:               'evt_3f6ef3',
          a:                 '-0.35',
          b:                 '0.45',
          gh:                'gh_u1',
          meta: {
            response_latency_sec: _pts ? Math.round((ts - _pts) / 1000) : null,
            message_length:       0,
            read_state:           'unknown',
            time_of_day:          _tod(ts),
          },
          confidence:        1.0,
          is_gap_signal:     false,
          gap_days:          null,
          call_type:         msg.call_type,
          call_duration_min: 0,
          missed_call:       true,
        });
      } else {
        const _ci = Math.min(0.95, 0.5 + (_dm / 120));
        const _cs2 = 0.6 + Math.min(0.3, _dm / 200);
        signals.push({
          ts:                msg.ts,
          actor,
          target:            _actors.find(a => a !== actor) ?? null,
          cat:               _iv ? 'cat_p7q1' : 'cat_c4d8',
          evt:               _iv ? 'evt_58d300' : 'evt_b4c06a',
          a:                 `${Math.round(Math.max(-1, Math.min(1, _cs2)) * 1000) / 1000}`,
          b:                 `${Math.round(Math.max(0,  Math.min(1, _ci))  * 1000) / 1000}`,
          gh:                'gh_c1',
          meta: {
            response_latency_sec: _pts ? Math.round((ts - _pts) / 1000) : null,
            message_length:       _dm,
            read_state:           'unknown',
            time_of_day:          _tod(ts),
          },
          confidence:        1.0,
          is_gap_signal:     false,
          gap_days:          null,
          call_type:         msg.call_type,
          call_duration_min: _dm,
          missed_call:       false,
        });
      }
      continue;
    }

    const text = (msg.text || '').trim();
    if (!text) continue;

    const _pts     = i > 0 ? new Date(messages[i - 1].ts) : null;
    const _lat     = _pts ? Math.round((ts - _pts) / 1000) : null;
    const target   = _actors.find(a => a !== actor) ?? null;

    const _rm      = await _ct(text);
    const _conf    = _stc(_rm.similarity);

    const _rsr     = signals.filter(s => !s.is_gap_signal).slice(-4);
    const { match, _id } = _acw(_rm, _conf, _rsr);

    const _dv      = _CD[match.category] ?? _CD['cat_l3u7'];

    const _bInt    = _dv.b;
    const _bFloat  = { a:-0.70,b:-0.60,c:-0.50,d:-0.35,e:-0.30,f:-0.20,g:-0.10,h:0.00,i:0.10,j:0.15,k:0.20,l:0.25,m:0.30,n:0.35,o:0.40,p:0.45,q:0.50,r:0.55,s:0.60,t:0.70,u:0.80,v:0.85 }[_bInt];
    const _aInt    = _dv.a;

    let _intensityExpr;
    const _rawIntExpr = `${_bInt}*${_conf}+0.15*${1 - _conf}`;
    if (_dv.fl && _dv.cp) {
      _intensityExpr = `min(${_dv.cp},max(${_dv.fl},${_rawIntExpr}))`;
    } else if (_dv.fl) {
      _intensityExpr = `max(${_dv.fl},${_rawIntExpr})`;
    } else if (_dv.cp) {
      _intensityExpr = `min(${_dv.cp},${_rawIntExpr})`;
    } else {
      _intensityExpr = _rawIntExpr;
    }

    const _sentimentExpr = `${_aInt}*${_conf}*${_id}`;

    signals.push({
      ts:                msg.ts,
      actor,
      target,
      cat:               match.category,
      evt:               match.eventType,
      a:                 _sentimentExpr,
      b:                 _intensityExpr,
      gh:                _dv.gh,
      meta: {
        response_latency_sec: _lat,
        message_length:       text.length,
        read_state:           'unknown',
        time_of_day:          _tod(ts),
      },
      confidence:        Math.round(Math.max(0, Math.min(1, _conf)) * 1000) / 1000,
      is_gap_signal:     false,
      gap_days:          null,
      call_type:         null,
      call_duration_min: null,
      missed_call:       false,
    });

    const _ls = _cls(text, actor, target, msg.ts, _as);
    if (_ls) signals.push(_ls);
  }

  return signals;
}

export async function warmUp() {
  await _ge();
  await _gae();
}