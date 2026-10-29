'use strict';
/* 7 CLOVER — 웹 버전
   시트 좌표: 가로 0~1000, 세로 0~1414 (A4). 표는 시트 그림에서 잰 퍼센트. */

const NS = 'http://www.w3.org/2000/svg';
const PENS = [
  { c: '#e4f36b', n: '라임', ang: 38 },
  { c: '#b7eed8', n: '민트', ang: -42 },
  { c: '#17582f', n: '숲', ang: 62 },
  { c: '#7a9420', n: '올리브', ang: -18 },
];
const PTS = { 4: 5, 3: 3, 2: 5, 1: 7 };
const DECOR_PTS = { bug: 2, flower: 1, sprout: 1 };
const DECOR_NAME = { bug: '무당벌레', flower: '꽃', sprout: '새싹' };
const LUCK = {
  m1: { k: 'more', n: 1, t: '1장 더!' },
  m2: { k: 'more', n: 2, t: '2장 더!' },
  m12: { k: 'more', n: 0, t: '1~2장 더!' },
  c1: { k: 'cut', n: 1, t: '1장 컷!' },
  c2: { k: 'cut', n: 2, t: '2장 컷!' },
  r1: { k: 'resv', n: 1, t: '1장 찜!' },
  r2: { k: 'resv', n: 2, t: '2장 찜!' },
};
const WIN_FOUR = 7;
const MAX_DRAW = 3;
// 무당벌레 규칙: free(원래) | completer(그 차례 완성한 사람만) | cost2(2장 써야) | points1(1점)
const RULES = { bugMode: 'free' };
// 잎 색연필: [칠, 테두리] 연두 여러 톤
const LEAF_TONES = ['#c6ec74', '#b8e47f', '#cff08a'];

// [x%, y%, 너비%, 행운, 회전, 줄기 방향]
const SHEETS = {
  two: {
    label: '2인용 시트',
    clovers: [
      [19, 32, 25, 'm12', 10, 195],
      [45, 29, 13, 'm1', -20, -60],
      [62, 31, 8, 'c1', 0, 95],
      [83, 32, 20, 'c1', 15, 70],
      [33, 47, 26, 'm12', -60, -15],
      [77, 53, 15, 'm2', -20, -110],
      [19, 65, 20, 'r1', -60, -120],
      [53, 62, 20, 'm1', 0, 150],
      [36, 75, 16, 'r1', -60, -80],
      [14, 88, 18, 'c1', 0, 25],
      [73, 82, 30, 'm12', -15, 50],
    ],
    // [종류, x%, y%, 크기%]
    decor: [
      ['flower', 8, 44, 8],
      ['flower', 82, 65, 9],
      ['sprout', 61, 44, 8],
      ['sprout', 52, 80, 7],
      ['bug', 37, 88, 8],
    ],
    logo: [51, 91],
  },
  four: {
    label: '3~4인용 시트',
    clovers: [
      [20, 32, 25, 'm12', 10, 195],
      [45, 29, 13, 'm1', -20, -60],
      [62, 31, 8, 'c1', 0, 95],
      [83, 32, 20, 'c1', 15, 70],
      [9, 44, 11, 'm2', 0, -120],
      [33, 47, 26, 'm12', -60, -15],
      [60, 44, 11, 'c1', 0, -120],
      [73, 49, 12, 'c2', -10, 200],
      [86, 55.5, 15, 'm2', -20, -110],
      [35, 61, 10, 'm1', 0, 200],
      [54, 61, 20, 'm1', 0, 150],
      [19, 66, 20, 'r1', -60, -120],
      [74, 64, 13, 'm12', 0, -150],
      [39, 73, 17, 'r1', -30, -70],
      [29, 83, 10, 'm12', 0, 150],
      [77, 85, 30, 'm12', -15, 50],
      [14, 92, 18, 'c1', 0, 10],
      [37, 93, 14, 'm12', 0, 200],
    ],
    decor: [
      ['bug', 69, 25, 6],
      ['bug', 41, 86, 6],
      ['flower', 35, 35, 6],
      ['flower', 54, 38, 4.5],
      ['flower', 87, 64, 7],
      ['flower', 59, 90, 4.5],
      ['sprout', 69, 39, 6],
      ['sprout', 69, 57, 6],
      ['sprout', 20, 79, 6],
      ['sprout', 88, 71, 6],
    ],
    logo: [51, 91],
  },
};

/* ---------------- 작은 도구 ---------------- */
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
const rad = (d) => (d * Math.PI) / 180;
const f = (n) => Math.round(n * 10) / 10;
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- 모양 ---------------- */
// 클로버 한 개의 기하: 중심(cx,cy), 반지름 R, 회전 rot
function geo(def) {
  const [x, y, w, luck, rot, stem] = def;
  return { cx: x * 10, cy: y * 14.14, R: (w * 10) / 1.85, luck, rot, stem };
}
function P(g, ang, lx, ly) {
  const a = rad(ang);
  return [g.cx + g.R * (lx * Math.cos(a) - ly * Math.sin(a)), g.cy + g.R * (lx * Math.sin(a) + ly * Math.cos(a))];
}
// 잎 i (0=위) — 하트 모양, 끝이 중심
// 잎 i (0=위) — 하트 모양, 끝이 중심. 손으로 오린 종이처럼 잎마다 조금씩 비뚤빼뚤 (2026-10-29)
function leafD(g, i) {
  g._leaf = g._leaf || [];
  if (g._leaf[i]) return g._leaf[i];
  const rand = rng((g.seed || 1) * 977 + i * 131 + 7);
  const ang = g.rot + i * 90 + (rand() - 0.5) * 5;
  const sc = 0.96 + rand() * 0.06;
  // 기본 하트 윤곽을 점으로
  const base = [];
  const line = (a, b, n) => { for (let k = 0; k < n; k++) base.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); };
  const arc = (cx, cy, r, a0, a1, n) => { for (let k = 0; k < n; k++) { const a = a0 + (a1 - a0) * k / n; base.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  const O = [0, 0], A = [-0.638, -0.537], B = [0.638, -0.537];
  const r = 0.36, cL = [-0.3, -0.66], cR = [0.3, -0.66];
  const aA = Math.atan2(A[1] - cL[1], A[0] - cL[0]);
  const aTL = Math.atan2(-0.858 - cL[1], 0 - cL[0]);
  const aTR = Math.atan2(-0.858 - cR[1], 0 - cR[0]);
  const aB = Math.atan2(B[1] - cR[1], B[0] - cR[0]);
  line(O, A, 4);
  arc(cL[0], cL[1], r, aA, aTL + (aTL < aA ? 2 * Math.PI : 0), 9);
  arc(cR[0], cR[1], r, aTR, aB + (aB < aTR ? 2 * Math.PI : 0), 9);
  line(B, O, 4);
  // 출렁임: 낮은 주파수 + 가위로 자른 듯 작은 각
  const p1 = rand() * 6.28, p2 = rand() * 6.28, a1 = 0.018 + rand() * 0.014, a2 = 0.008 + rand() * 0.008;
  const N = base.length;
  const pts = base.map(([x, y], k) => {
    const t = k / N;
    const keep = Math.sin(Math.PI * t);          // 중심 끝은 덜 흔들어 틈이 안 생기게
    const dx = x, dy = y + 0.5, d = Math.hypot(dx, dy) || 1;
    const w = keep * (a1 * Math.sin(t * 6.28 * 3 + p1) + a2 * Math.sin(t * 6.28 * 7 + p2) + (rand() - 0.5) * 0.012);
    return P(g, ang, (x + dx / d * w) * sc, (y + dy / d * w) * sc);
  });
  g._leaf[i] = 'M' + pts.map((q) => `${f(q[0])} ${f(q[1])}`).join('L') + 'Z';
  return g._leaf[i];
}
function leafMid(g, i) { return P(g, g.rot + i * 90, 0, -0.55); }
function blobD(x, y, r, seed) {
  const rand = rng(seed), n = 11, p = rand() * 6.28;
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * 6.28 + p, rr = r * (0.95 + rand() * 0.09);
    pts.push(`${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`);
  }
  return 'M' + pts.join('L') + 'Z';
}
function circleD(x, y, r) {
  return `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}
function decorGeo(def, di) {
  let sd = (di + 3) * 7919;
  const circleD = (x, y, r) => blobD(x, y, r, sd++);
  const [type, x, y, size] = def;
  const cx = x * 10, cy = y * 14.14, s = (size * 10) / 2;
  let d = '', extra = '';
  if (type === 'flower') {
    for (let i = 0; i < 5; i++) {
      const a = rad(-90 + i * 72);
      d += circleD(cx + Math.cos(a) * 0.52 * s, cy + Math.sin(a) * 0.52 * s, 0.42 * s);
    }
    d += circleD(cx, cy, 0.4 * s);
  } else if (type === 'sprout') {
    const bx = cx - 0.15 * s, by = cy - 0.1 * s;
    [-150, -40, 60].forEach((deg) => {
      const a = rad(deg);
      d += circleD(bx + Math.cos(a) * 0.38 * s, by + Math.sin(a) * 0.38 * s, 0.34 * s);
    });
    extra = `M${f(bx)} ${f(by)}L${f(cx + 0.7 * s)} ${f(cy + 0.95 * s)}`;
  } else {
    d += circleD(cx, cy + 0.12 * s, 0.62 * s);
    d += circleD(cx, cy - 0.5 * s, 0.3 * s);
    extra = `M${f(cx - 0.12 * s)} ${f(cy - 0.75 * s)}q${f(-0.1 * s)} ${f(-0.3 * s)} ${f(-0.25 * s)} ${f(-0.35 * s)}M${f(cx + 0.12 * s)} ${f(cy - 0.75 * s)}q${f(0.1 * s)} ${f(-0.3 * s)} ${f(0.25 * s)} ${f(-0.35 * s)}`;
  }
  return { type, cx, cy, s, d, extra };
}
// 펜으로 슥슥 — 원 범위를 덮는 지그재그
function scribble(cx, cy, r, ang, gap, seed) {
  const rand = rng(seed);
  const a = rad(ang), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const pts = [];
  let side = 1;
  for (let off = -r; off <= r + 0.01; off += gap) {
    const L = Math.sqrt(Math.max(0, r * r - off * off)) + gap * 1.2;
    const j1 = (rand() - 0.5) * gap * 0.9, j2 = (rand() - 0.5) * gap * 0.9;
    const o = off + (rand() - 0.5) * gap * 0.35;
    pts.push([cx + nx * o + dx * (-L * side + j1), cy + ny * o + dy * (-L * side + j1)]);
    pts.push([cx + nx * (o + gap * 0.5) + dx * (L * side + j2), cy + ny * (o + gap * 0.5) + dy * (L * side + j2)]);
    side = -side;
  }
  return 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L');
}
function heartD(x, y, s) {
  return `M${f(x)} ${f(y + s * 0.7)}C${f(x - s * 1.3)} ${f(y - s * 0.1)} ${f(x - s * 0.6)} ${f(y - s * 1.0)} ${f(x)} ${f(y - s * 0.35)}C${f(x + s * 0.6)} ${f(y - s * 1.0)} ${f(x + s * 1.3)} ${f(y - s * 0.1)} ${f(x)} ${f(y + s * 0.7)}Z`;
}
function animStroke(path, dur = 0.45, delay = 0) {
  if (reduceMotion) return;
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len} ${len}`;
  path.style.strokeDashoffset = len;
  path.style.setProperty('--dur', dur + 's');
  path.style.animationDelay = delay + 's';
  path.classList.add('anim');
}

/* ---------------- 상태 ---------------- */
let S = null;        // 게임 상태
let SH = null;       // 지금 시트 (기하 포함)
let undoStack = [];
let aiTimer = null;
let drawnSig = {};   // 그려진 표시 비교용
const board = $('board');

function setup(mode, n, quiet) {
  clearTimeout(aiTimer);
  const key = n === 2 ? 'two' : 'four';
  const sheet = SHEETS[key];
  SH = {
    key,
    label: sheet.label,
    clovers: sheet.clovers.map((d, ci) => ({ ...geo(d), seed: ci + 1 })),
    decor: sheet.decor.map((d, di) => decorGeo(d, di)),
    logo: sheet.logo,
  };
  const players = [];
  for (let i = 0; i < n; i++) {
    const ai = mode === 'ai' && i > 0;
    players.push({
      name: mode === 'ai' ? (i === 0 ? '나' : n === 2 ? '컴퓨터' : `컴퓨터 ${i}`) : PENS[i].n,
      c: PENS[i].c,
      ang: PENS[i].ang,
      ai,
    });
  }
  const first = Math.floor(Math.random() * n);
  S = {
    mode,
    players,
    cur: first,
    pturns: players.map(() => 0),
    clovers: SH.clovers.map(() => ({ owner: -1, leaves: [0, 1, 2, 3].map(() => ({ o: -1, cut: -1, rv: -1, rx: 0 })) })),
    decor: SH.decor.map(() => ({ o: -1 })),
    t: null,
    carry: [],
    log: [],
    over: false,
    result: null,
  };
  S.pturns[first] = 1;
  S.t = freshTurn([]);
  undoStack = [];
  drawnSig = {};
  buildBoard();
  log(first, `가위바위보! ${players[first].name} 선`);
  renderAll(false);
  if (quiet) return;
  toast(`가위바위보! ${players[first].name === '나' ? '내가 선!' : players[first].name + ' 선!'}`);
  afterChange();
}
function freshTurn(pending) {
  return { normal: 0, forced: 0, pending, mode: null, done: 0 };
}
const cur = () => S.players[S.cur];
const nextIdx = (p) => (p + 1) % S.players.length;
const undrawn = (cl) => cl.leaves.filter((l) => l.o < 0 && l.cut < 0);
const uncutCount = (cl) => cl.leaves.filter((l) => l.cut < 0).length;
const isComplete = (cl) => cl.owner >= 0;

/* ---------------- 규칙 ---------------- */
function drawTargets(p) {
  const out = [];
  S.clovers.forEach((cl, ci) =>
    cl.leaves.forEach((l, li) => {
      if (l.o < 0 && l.cut < 0 && (l.rv < 0 || l.rv === p)) out.push({ type: 'leaf', ci, li });
    })
  );
  S.decor.forEach((d, di) => {
    if (d.o >= 0) return;
    if (SH.decor[di].type === 'bug') {
      if (RULES.bugMode === 'completer' && !(S.t && S.t.done > 0)) return;
      if (RULES.bugMode === 'cost2' && S.t && S.t.forced + (MAX_DRAW - S.t.normal) < 2) return;
    }
    out.push({ type: 'decor', di });
  });
  return out;
}
function cutTargets() {
  const out = [];
  S.clovers.forEach((cl, ci) => {
    if (uncutCount(cl) < 2) return;
    cl.leaves.forEach((l, li) => { if (l.o >= 0 && l.cut < 0) out.push({ ci, li }); });
  });
  return out;
}
function resvTargets() {
  const out = [];
  S.clovers.forEach((cl, ci) => cl.leaves.forEach((l, li) => {
    if (l.o < 0 && l.cut < 0 && l.rv < 0) out.push({ ci, li });
  }));
  return out;
}
const drawsLeft = () => S.t.forced + (MAX_DRAW - S.t.normal);
const canDrawNow = () => !S.over && !S.t.mode && drawsLeft() > 0;

function pushUndo() {
  if (cur().ai) return;
  undoStack.push(JSON.stringify(S));
  if (undoStack.length > 60) undoStack.shift();
}
function draw(target) {
  const p = S.cur;
  const cost = target.type === 'decor' && SH.decor[target.di].type === 'bug' && RULES.bugMode === 'cost2' ? 2 : 1;
  for (let c = 0; c < cost; c++) { if (S.t.forced > 0) S.t.forced--; else S.t.normal++; }
  if (target.type === 'decor') {
    S.decor[target.di].o = p;
    log(p, `${DECOR_NAME[SH.decor[target.di].type]} 그림`);
  } else {
    const cl = S.clovers[target.ci], l = cl.leaves[target.li];
    l.o = p; l.rv = -1;
    checkComplete(target.ci, p);
  }
  checkQuickWin();
}
function checkComplete(ci, p) {
  const cl = S.clovers[ci];
  if (cl.owner >= 0 || undrawn(cl).length) return false;
  cl.owner = p;
  const n = uncutCount(cl);
  log(p, `클로버 완성! ${n}잎 · 행운 ${LUCK[SH.clovers[ci].luck].t}`);
  const item = { ci, luck: SH.clovers[ci].luck };
  if (p === S.cur) { S.t.pending.push(item); S.t.done++; } else S.carry.push(item);
  sparkleAt.push(ci);
  return true;
}
function fourCount(p) {
  return S.clovers.filter((cl) => cl.owner === p && uncutCount(cl) === 4).length;
}
function checkQuickWin() {
  if (S.over) return;
  for (let p = 0; p < S.players.length; p++) {
    if (fourCount(p) >= WIN_FOUR) { finish('quick', p); return; }
  }
}
function activate(idx, chosenN) {
  const item = S.t.pending[idx];
  const L = LUCK[item.luck];
  const p = S.cur;
  if (L.k === 'more') {
    const n = L.n || chosenN;
    S.t.pending.splice(idx, 1);
    if (!drawTargets(p).length) { log(p, `행운 ${n}장 더! — 그릴 곳이 없어 사라짐`); return; }
    S.t.forced += n;
    log(p, `행운 ${n}장 더!`);
  } else {
    S.t.pending.splice(idx, 1);
    const has = L.k === 'cut' ? cutTargets().length : resvTargets().length;
    if (!has) { log(p, `행운 ${L.t} — 쓸 곳이 없어 사라짐`); return; }
    S.t.mode = { k: L.k, left: L.n };
    log(p, `행운 ${L.t}`);
  }
}
function modeAct(ci, li) {
  const p = S.cur, m = S.t.mode;
  const l = S.clovers[ci].leaves[li];
  if (m.k === 'cut') {
    if (!cutTargets().some((t) => t.ci === ci && t.li === li)) return false;
    l.cut = p;
    const owner = S.clovers[ci].owner;
    log(p, owner >= 0 ? `${S.players[owner].name}의 클로버 잎을 컷!` : '잎을 컷!');
  } else {
    if (!(l.o < 0 && l.cut < 0 && l.rv < 0)) return false;
    l.rv = p; l.rx = S.pturns[p] + 1;
    log(p, '잎을 찜!');
  }
  m.left--;
  const more = m.k === 'cut' ? cutTargets().length : resvTargets().length;
  if (m.left <= 0 || !more) S.t.mode = null;
  return true;
}
// 차례를 끝낼 수 있나? 못 끝내면 이유
function endBlock() {
  const p = S.cur;
  if (S.over) return '게임이 끝났어요';
  if (S.t.mode) return S.t.mode.k === 'cut' ? '컷! 할 잎을 먼저 고르세요' : '찜! 할 잎을 먼저 고르세요';
  const targets = drawTargets(p).length;
  if (S.t.pending.length) return '행운을 먼저 쓰세요';
  if (S.t.forced > 0 && targets) return `더! ${S.t.forced}장을 마저 그리세요`;
  if (S.t.normal < 1 && targets) return '잎을 1장 이상 그리세요';
  return '';
}
function endTurn() {
  if (endBlock()) return;
  const p = S.cur, nx = nextIdx(p);
  S.t.forced = 0;
  // 찜 기한: 찜한 사람의 다음 차례 끝 — 하트만 지우고 빈 잎으로
  let freed = 0;
  S.clovers.forEach((cl) => cl.leaves.forEach((l) => {
    if (l.rv === p && l.rx <= S.pturns[p]) { l.rv = -1; freed++; }
  }));
  if (freed) log(p, `찜 ${freed}장이 풀렸어요`);
  checkQuickWin();
  if (S.over) return;
  if (S.clovers.every(isComplete)) { finish('big'); return; }
  S.cur = nx;
  S.pturns[nx]++;
  S.t = freshTurn(S.carry);
  S.carry = [];
  undoStack = [];
  if (S.mode === 'hot' || !cur().ai) toast(S.mode === 'hot' ? `${cur().name} 차례!` : '내 차례!');
}
function scoreOf(p) {
  const r = { 4: 0, 3: 0, 2: 0, 1: 0, bug: 0, small: 0, total: 0 };
  S.clovers.forEach((cl) => { if (cl.owner === p) { const n = uncutCount(cl); r[n]++; r.total += PTS[n]; } });
  S.decor.forEach((d, di) => {
    if (d.o !== p) return;
    const t = SH.decor[di].type;
    if (t === 'bug') r.bug++; else r.small++;
    r.total += DECOR_PTS[t];
  });
  return r;
}
function finish(kind, winner) {
  S.over = true;
  S.t.mode = null;
  const scores = S.players.map((_, p) => scoreOf(p));
  let winners;
  if (kind === 'quick') winners = [winner];
  else {
    const best = Math.max(...scores.map((s) => s.total));
    winners = scores.map((s, p) => (s.total === best ? p : -1)).filter((p) => p >= 0);
  }
  S.result = { kind, winners, scores };
  log(winners[0], kind === 'quick' ? '네잎 클로버 7개! 빠른종료' : '빅매치! 점수 계산');
}

/* ---------------- 그리기 (화면) ---------------- */
let sparkleAt = [];
let hitEls = [];   // [ci][li]
let decorEls = [];
let cloverEls = [];

function buildBoard() {
  board.innerHTML = '';
  hitEls = []; decorEls = []; cloverEls = [];
  const defs = el('defs', {}, board);
  // 색연필 결: 잘게 갈라진 노이즈로 칠을 거칠게
  defs.innerHTML = `<filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.55 0.16" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.7" result="g"/>
    <feComposite in="SourceGraphic" in2="g" operator="in"/>
  </filter>`;
  // 장식
  SH.decor.forEach((d, di) => {
    const g = el('g', { class: 'decor', 'data-di': di }, board);
    const off = d.s * 0.11;
    el('path', { d: d.d, class: 'decor-shadow', transform: `translate(${f(off)} ${f(off)})` }, g);
    if (d.extra) el('path', { d: d.extra, fill: 'none', stroke: '#1d1d1d', 'stroke-width': f(Math.max(2, d.s * 0.07)), 'stroke-linecap': 'round', transform: `translate(${f(off)} ${f(off)})` }, g);
    if (d.extra) el('path', { d: d.extra, fill: 'none', stroke: '#fff', 'stroke-width': f(Math.max(2, d.s * 0.07)), 'stroke-linecap': 'round' }, g);
    el('path', { d: d.d, class: 'decor-shape' }, g);
    const cp = el('clipPath', { id: `dc${di}` }, defs);
    el('path', { d: d.d }, cp);
    el('g', { class: 'marks' }, g);
    el('path', { d: d.d, class: 'leaf-hit' }, g);
    g.addEventListener('click', () => onDecor(di));
    decorEls.push(g);
  });
  // 클로버
  SH.clovers.forEach((g, ci) => {
    const cg = el('g', { class: 'clover', 'data-ci': ci }, board);
    cloverEls.push(cg);
    // 줄기: 가장 가까운 잎 사이 방향으로 나와서 휘어짐
    const between = g.rot - 45;
    const k = Math.round((g.stem - between) / 90);
    const a0 = between + k * 90, bend = Math.max(-35, Math.min(35, g.stem - a0)) || 18;
    const c = [g.cx, g.cy];
    const p1 = [g.cx + g.R * 1.05 * Math.cos(rad(a0)), g.cy + g.R * 1.05 * Math.sin(rad(a0))];
    const p2 = [g.cx + g.R * 1.6 * Math.cos(rad(a0 + bend)), g.cy + g.R * 1.6 * Math.sin(rad(a0 + bend))];
    el('path', { class: 'stem', d: `M${f(c[0])} ${f(c[1])}Q${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])}`, 'stroke-width': f(Math.max(7, g.R * 0.14)) }, cg);
    for (let i = 0; i < 4; i++) el('path', { d: leafD(g, i), class: 'leaf-base', 'stroke-width': f(Math.max(1.4, g.R * 0.014)) }, cg);
    for (let i = 0; i < 4; i++) {
      const cp = el('clipPath', { id: `lc${ci}-${i}` }, defs);
      el('path', { d: leafD(g, i) }, cp);
    }
    el('g', { class: 'marks' }, cg);
    // 행운 표: 진초록 알약 + 흰 원 아이콘(더 ＋, 찜 하트, 컷 가위) + 숫자
    drawLuckChip(cg, g);
    const hits = [];
    for (let i = 0; i < 4; i++) {
      const h = el('path', { d: leafD(g, i), class: 'leaf-hit' }, cg);
      h.addEventListener('click', () => onLeaf(ci, i));
      hits.push(h);
    }
    hitEls.push(hits);
  });
}

const LUCK_STYLE = { more: '#1f7a45', resv: '#5e8c25', cut: '#0f3d22' };
const LUCK_NUM = { m1: '1', m2: '2', m12: '1~2', c1: '1', c2: '2', r1: '1', r2: '2' };
function drawLuckChip(parent, g) {
  const L = LUCK[g.luck], col = LUCK_STYLE[L.k], num = LUCK_NUM[g.luck];
  const fs = Math.max(17, Math.min(26, g.R * 0.19));
  const H = fs * 1.5, r = H / 2;
  const tw = num.length * fs * 0.72;
  const W = 2 * r + tw + fs * 0.5;
  const [tx, ty] = [g.cx, g.cy + g.R * 0.3];
  const chip = el('g', { class: 'chip', transform: `translate(${f(tx)} ${f(ty)})` }, parent);
  el('rect', { x: f(-W / 2), y: f(-r), width: f(W), height: f(H), rx: f(r), fill: col }, chip);
  const ic = -W / 2 + r, u = r * 0.5;
  el('circle', { cx: f(ic), cy: 0, r: f(r * 0.76), fill: '#fff' }, chip);
  if (L.k === 'more') {
    el('path', { d: `M${f(ic - u)} 0H${f(ic + u)}M${f(ic)} ${f(-u)}V${f(u)}`, stroke: col, 'stroke-width': f(u * 0.5), 'stroke-linecap': 'round', fill: 'none' }, chip);
  } else if (L.k === 'resv') {
    el('path', { d: heartD(ic, u * 0.12, u * 0.78), fill: col }, chip);
  } else {
    const sw = f(u * 0.3);
    el('path', { d: `M${f(ic - u * 0.25)} ${f(u * 0.25)}L${f(ic + u * 0.6)} ${f(-u * 0.95)}M${f(ic + u * 0.25)} ${f(u * 0.25)}L${f(ic - u * 0.6)} ${f(-u * 0.95)}`, stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round', fill: 'none' }, chip);
    el('circle', { cx: f(ic - u * 0.45), cy: f(u * 0.6), r: f(u * 0.34), stroke: col, 'stroke-width': sw, fill: 'none' }, chip);
    el('circle', { cx: f(ic + u * 0.45), cy: f(u * 0.6), r: f(u * 0.34), stroke: col, 'stroke-width': sw, fill: 'none' }, chip);
  }
  const t = el('text', { class: 'wide', x: f(ic + r + fs * 0.12), y: f(fs * 0.36), 'font-size': f(fs * 0.92), 'font-weight': 800, fill: '#fff' }, chip);
  t.textContent = num;
}

function luckIcon(k, size = 22) {
  const col = LUCK_STYLE[k];
  let inner;
  if (k === 'more') inner = `<path d="M7 12H17M12 7V17" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>`;
  else if (k === 'resv') inner = `<path d="${heartD(12, 12.6, 4.2)}" fill="${col}"/>`;
  else inner = `<g stroke="${col}" stroke-width="1.7" stroke-linecap="round" fill="none"><path d="M10.6 13.2L15.2 6.8M13.4 13.2L8.8 6.8"/><circle cx="9.6" cy="15.3" r="1.9"/><circle cx="14.4" cy="15.3" r="1.9"/></g>`;
  return `<svg class="lk" viewBox="0 0 24 24" width="${size}" height="${size}"><circle cx="12" cy="12" r="12" fill="${col}"/><circle cx="12" cy="12" r="9.2" fill="#fff"/>${inner}</svg>`;
}

function renderMarks(animate) {
  S.clovers.forEach((cl, ci) => {
    const g = SH.clovers[ci], cg = cloverEls[ci];
    const sig = cl.owner + ';' + cl.leaves.map((l) => `${l.o},${l.cut},${l.rv}`).join('|');
    if (drawnSig['c' + ci] === sig) return;
    const prev = drawnSig['c' + ci] ? drawnSig['c' + ci].split(';')[1].split('|') : ['', '', '', ''];
    drawnSig['c' + ci] = sig;
    const marks = cg.querySelector('.marks');
    marks.innerHTML = '';
    const stem = cg.querySelector('.stem');
    stem.style.stroke = cl.owner >= 0 ? S.players[cl.owner].c : '';
    cg.querySelector('.chip').classList.toggle('used', cl.owner >= 0);
    cl.leaves.forEach((l, li) => {
      const [was] = prev[li].split(',');
      const fresh = animate && prev[li] !== `${l.o},${l.cut},${l.rv}`;
      const [mx, my] = leafMid(g, li);
      if (l.o >= 0) {
        const tone = S.players[l.o].c;
        const fl = el('path', {
          d: leafD(g, li), fill: tone, stroke: tone,
          'stroke-width': f(Math.max(1.4, g.R * 0.014)), 'stroke-linejoin': 'round',
          opacity: l.cut >= 0 ? 0.35 : 1,
        }, marks);
        fl.style.pointerEvents = 'none';
        if (fresh && String(was) !== String(l.o)) {
          fl.style.transformOrigin = `${f(g.cx)}px ${f(g.cy)}px`;
          fl.classList.add('fillin');
        }
      }
      if (l.cut >= 0) {
        const s = Math.max(8, g.R * 0.18);
        const xd = `M${f(mx - s)} ${f(my - s)}L${f(mx + s)} ${f(my + s)}M${f(mx + s)} ${f(my - s)}L${f(mx - s)} ${f(my + s)}`;
        const x0 = el('path', { class: 'ink', d: xd, stroke: '#fff', 'stroke-width': f(Math.max(6, g.R * 0.075)) }, marks);
        const x = el('path', { class: 'ink', d: xd, stroke: '#0f3d22', 'stroke-width': f(Math.max(3.2, g.R * 0.04)) }, marks);
        if (fresh) { animStroke(x0, 0.3); animStroke(x, 0.3); }
      }
      if (l.rv >= 0) {
        // 찜: 잎을 찜한 사람 색으로 연하게 물들이고, 그 색 하트를 크게
        const pc = S.players[l.rv].c;
        const wash = el('path', { d: leafD(g, li), fill: pc, opacity: 0.25 }, marks);
        wash.style.pointerEvents = 'none';
        const s = Math.max(13, g.R * 0.27);
        const h = el('path', { class: 'ink' + (fresh ? ' pop' : ''), d: heartD(mx, my, s), stroke: '#0f3d22', fill: pc, 'stroke-width': f(Math.max(2, g.R * 0.022)) }, marks);
        h.style.pointerEvents = 'none';
      }
    });
  });
  S.decor.forEach((d, di) => {
    const sig = String(d.o);
    if (drawnSig['d' + di] === sig) return;
    drawnSig['d' + di] = sig;
    const g = SH.decor[di], marks = decorEls[di].querySelector('.marks');
    marks.innerHTML = '';
    if (d.o < 0) return;
    const pl = S.players[d.o];
    const fl = el('path', { d: g.d, fill: pl.c, stroke: pl.c, 'stroke-width': 1.5 }, marks);
    fl.style.pointerEvents = 'none';
    if (animate) { fl.style.transformOrigin = `${f(g.cx)}px ${f(g.cy)}px`; fl.classList.add('fillin'); }
    if (g.type === 'bug') {
      const s = g.s;
      const dots = [[-0.3, 0], [0.3, 0], [-0.22, 0.38], [0.22, 0.38], [0, 0.2]];
      const dg = el('g', { fill: '#1d1d1d' }, marks);
      dots.forEach(([x, y]) => el('circle', { cx: f(g.cx + x * s), cy: f(g.cy + y * s), r: f(s * 0.1) }, dg));
      el('path', { class: 'ink', d: `M${f(g.cx)} ${f(g.cy - 0.48 * s)}L${f(g.cx)} ${f(g.cy + 0.72 * s)}`, stroke: '#1d1d1d', 'stroke-width': 2 }, marks);
      if (animate) dg.classList.add('pop');
    }
  });
  // 완성 반짝
  sparkleAt.forEach((ci) => {
    if (!animate) return;
    const g = SH.clovers[ci];
    const s = g.R * 0.5;
    const star = `M${f(g.cx)} ${f(g.cy - s)}Q${f(g.cx)} ${f(g.cy)} ${f(g.cx + s)} ${f(g.cy)}Q${f(g.cx)} ${f(g.cy)} ${f(g.cx)} ${f(g.cy + s)}Q${f(g.cx)} ${f(g.cy)} ${f(g.cx - s)} ${f(g.cy)}Q${f(g.cx)} ${f(g.cy)} ${f(g.cx)} ${f(g.cy - s)}Z`;
    const sp = el('path', { d: star, class: 'sparkle', fill: '#ffe45c', stroke: '#1d1d1d', 'stroke-width': 2, style: 'animation-delay:.45s;opacity:0' }, board);
    setTimeout(() => sp.remove(), 1600);
  });
  sparkleAt = [];
}

function renderTargets() {
  const p = S.cur;
  const human = !cur().ai && !S.over;
  board.style.setProperty('--hover', cur().c + (S.t.mode ? '55' : '30'));
  const m = S.t.mode;
  const drawSet = new Set(), modeSet = new Set();
  if (human && m) {
    (m.k === 'cut' ? cutTargets() : resvTargets()).forEach((t) => modeSet.add(t.ci + '-' + t.li));
  } else if (human && canDrawNow()) {
    drawTargets(p).forEach((t) => { if (t.type === 'leaf') drawSet.add(t.ci + '-' + t.li); });
  }
  hitEls.forEach((hs, ci) => hs.forEach((h, li) => {
    const k = ci + '-' + li;
    h.classList.toggle('can', drawSet.has(k));
    h.classList.toggle('target', modeSet.has(k));
  }));
  decorEls.forEach((g, di) => g.classList.toggle('can', human && !m && canDrawNow() && S.decor[di].o < 0));
}

const CLOVER_ICON = '<svg class="clv" viewBox="0 0 20 20" width="1.05em" height="1.05em" style="vertical-align:-.15em"><g fill="currentColor" transform="rotate(45 10 10)"><g transform="rotate(0 10 10)"><path d="M10 9.45L6.90 6.35L10.00 3.25L13.10 6.35Z"/><circle cx="8.45" cy="4.80" r="2.19"/><circle cx="11.55" cy="4.80" r="2.19"/></g><g transform="rotate(90 10 10)"><path d="M10 9.45L6.90 6.35L10.00 3.25L13.10 6.35Z"/><circle cx="8.45" cy="4.80" r="2.19"/><circle cx="11.55" cy="4.80" r="2.19"/></g><g transform="rotate(180 10 10)"><path d="M10 9.45L6.90 6.35L10.00 3.25L13.10 6.35Z"/><circle cx="8.45" cy="4.80" r="2.19"/><circle cx="11.55" cy="4.80" r="2.19"/></g><g transform="rotate(270 10 10)"><path d="M10 9.45L6.90 6.35L10.00 3.25L13.10 6.35Z"/><circle cx="8.45" cy="4.80" r="2.19"/><circle cx="11.55" cy="4.80" r="2.19"/></g></g></svg>';
const LEAF_ICON = '<svg class="dot" viewBox="0 0 24 24"><path d="M12 21C3.6 15.2 3.8 7.6 8.3 6.3 10.2 5.8 11.5 7 12 8.3 12.5 7 13.8 5.8 15.7 6.3 20.2 7.6 20.4 15.2 12 21Z"/></svg>';

function renderPanel() {
  const pl = cur();
  // 머리 플레이어 줄
  $('players').classList.toggle('many', S.players.length > 2);
  $('players').innerHTML = S.players.map((p, i) => {
    const s = scoreOf(i);
    return `<div class="pcell${i === S.cur && !S.over ? ' cur' : ''}" style="--c:${p.c}">
      <span class="pen"></span><span class="nm">${p.name}</span>
      <span class="four">${CLOVER_ICON} ${fourCount(i)}/${WIN_FOUR}</span><span class="pt">${s.total}점</span></div>`;
  }).join('');
  const panel = $('panel');
  panel.style.setProperty('--c', pl.c);
  $('turn').innerHTML = S.over
    ? `<span>게임 끝</span>`
    : `<span class="pen"></span><span>${pl.name === '나' ? '내 차례' : pl.name + ' 차례'}</span><span class="sub">${S.pturns[S.cur]}번째</span>`;
  // 그리기 칸
  let dots = '';
  for (let i = 0; i < MAX_DRAW; i++) dots += LEAF_ICON.replace('class="dot"', `class="dot${i < S.t.normal ? ' used' : ''}" style="transform:rotate(${[-14, 4, 16][i]}deg)"`);
  for (let i = 0; i < S.t.forced; i++) dots += LEAF_ICON.replace('class="dot"', 'class="dot forced"');
  $('draws').innerHTML = S.over ? '' : `<span class="lbl">그리기 ${S.t.normal}/${MAX_DRAW}${S.t.forced ? ` · 더! ${S.t.forced}장` : ''}</span>${dots}`;
  // 행운
  const human = !pl.ai && !S.over;
  $('luck').innerHTML = S.over ? '' : S.t.pending.map((it, i) =>
    `<button class="luck-chip" data-i="${i}" ${human && !S.t.mode ? '' : 'disabled'}>${luckIcon(LUCK[it.luck].k)}${LUCK[it.luck].t}</button>`).join('');
  $('luck').querySelectorAll('.luck-chip').forEach((b) => b.addEventListener('click', () => onLuck(+b.dataset.i)));
  // 안내
  $('hint').innerHTML = hintText();
  $('undo').disabled = !human || !undoStack.length;
  $('end').disabled = !human || !!endBlock();
  // 기록
  $('log').innerHTML = S.log.slice(0, 40).map((e) => `<li style="--c:${S.players[e.p] ? S.players[e.p].c : '#999'}"><span class="pen"></span><span>${e.p >= 0 ? `<b>${S.players[e.p].name}</b> ` : ''}${e.t}</span></li>`).join('');
}
function hintText() {
  if (S.over) return '결과를 확인하세요. 새 게임은 아래에서.';
  const pl = cur();
  if (pl.ai) return `<b>${pl.name}</b> 생각 중…`;
  const m = S.t.mode;
  if (m) return m.k === 'cut'
    ? `<b>컷!</b> 지울 잎을 고르세요. 칠해진 잎만 돼요. (${m.left}장)`
    : `<b>찜!</b> 맡아 둘 빈 잎을 고르세요. (${m.left}장)`;
  if (S.t.pending.length) return '클로버 완성! <b>행운</b>을 눌러 쓰세요. 잎 그리기와 순서는 자유예요.';
  const targets = drawTargets(S.cur).length;
  if (!targets) return S.clovers.every(isComplete) ? '모든 클로버 완성! 차례를 끝내면 점수를 계산해요.' : '그릴 수 있는 잎이 없어요. 차례를 끝내세요.';
  if (S.t.forced > 0) return `<b>더!</b> ${S.t.forced}장을 꼭 더 그려야 해요.`;
  if (S.t.normal === 0) return '잎을 <b>1~3장</b> 그리세요. 무당벌레·꽃·새싹도 돼요.';
  if (S.t.normal < MAX_DRAW) return '더 그리거나 <b>차례 끝내기</b>.';
  if (S.clovers.every(isComplete)) return '모든 클로버 완성! 차례를 끝내면 점수를 계산해요.';
  return '다 그렸어요. <b>차례 끝내기</b>.';
}
function log(p, t) { S.log.unshift({ p, t }); }

function renderAll(animate = true) {
  renderMarks(animate);
  renderTargets();
  renderPanel();
}
function afterChange(animate = true) {
  renderAll(animate);
  if (S.over) { setTimeout(showEnd, 900); return; }
  if (cur().ai) { clearTimeout(aiTimer); aiTimer = setTimeout(aiStep, 650); }
}

/* ---------------- 입력 ---------------- */
function onLeaf(ci, li) {
  if (!S || S.over || cur().ai) return;
  const l = S.clovers[ci].leaves[li];
  if (S.t.mode) {
    const snap = JSON.stringify(S);
    if (modeAct(ci, li)) { undoStack.push(snap); afterChange(); }
    return;
  }
  if (!canDrawNow()) { nudge(); return; }
  if (l.o >= 0 || l.cut >= 0) return;
  if (l.rv >= 0 && l.rv !== S.cur) { toast(`${S.players[l.rv].name}의 찜이에요`); return; }
  pushUndo();
  draw({ type: 'leaf', ci, li });
  afterChange();
}
function onDecor(di) {
  if (!S || S.over || cur().ai || S.t.mode) return;
  if (S.decor[di].o >= 0) return;
  if (!canDrawNow()) { nudge(); return; }
  pushUndo();
  draw({ type: 'decor', di });
  afterChange();
}
function nudge() {
  if (S.t.pending.length) toast('행운을 먼저 쓰거나 차례를 끝내세요');
  else toast('이번 차례엔 다 그렸어요');
}
function onLuck(i) {
  if (cur().ai || S.t.mode) return;
  const L = LUCK[S.t.pending[i].luck];
  if (L.k === 'more' && !L.n) {
    showModal('chooseModal');
    $('chooseModal').querySelectorAll('[data-n]').forEach((b) => {
      b.onclick = () => { hideModal('chooseModal'); pushUndo(); activate(i, +b.dataset.n); afterChange(); };
    });
    return;
  }
  pushUndo();
  activate(i);
  afterChange();
}
$('end').addEventListener('click', () => {
  const why = endBlock();
  if (why) { toast(why); return; }
  endTurn();
  afterChange();
});
$('undo').addEventListener('click', () => {
  if (!undoStack.length || cur().ai) return;
  S = JSON.parse(undoStack.pop());
  sparkleAt = [];
  afterChange(false);
});
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); $('undo').click(); }
  if (e.key === 'Enter' && !document.querySelector('.modal.show')) $('end').click();
  if (e.key === 'Escape') document.querySelectorAll('.modal.show').forEach((m) => { if (m.id !== 'startModal' || S) m.classList.remove('show'); });
});

/* ---------------- 컴퓨터 ---------------- */
const LUCK_VAL = { m1: 2, m2: 3, m12: 3, c1: 2.5, c2: 3.5, r1: 2, r2: 3 };
function leafValue(p, ci, li) {
  const cl = S.clovers[ci], g = SH.clovers[ci];
  const left = undrawn(cl);
  const k = left.length;
  const mine = left.filter((l) => l.rv < 0 || l.rv === p).length;
  const dl = drawsLeft();
  const l = cl.leaves[li];
  let v;
  if (k === 1) v = 12 + LUCK_VAL[g.luck] * 1.5 + (uncutCount(cl) === 4 ? 3 : 0);
  else if (k <= dl && mine === k) v = 8 - k * 0.5 + LUCK_VAL[g.luck] * 0.3;
  else {
    const others = left.filter((x) => x !== l);
    const guarded = others.some((x) => x.rv === p);
    if (guarded) v = 0.5;
    else if (k === 4) v = -6;
    else v = -2.5;
  }
  if (l.rv === p && l.rx <= S.pturns[p]) v += 3;
  return v;
}
function aiOptions(p) {
  return drawTargets(p).map((t) => {
    let v;
    if (t.type === 'decor') v = SH.decor[t.di].type === 'bug' ? (DECOR_PTS.bug >= 3 ? 3 : 1.2) / (RULES.bugMode === 'cost2' ? 2 : 1) + (RULES.bugMode === 'cost2' ? 0.6 : 0) : 1.2;
    else v = leafValue(p, t.ci, t.li);
    return { t, v: v + Math.random() * 0.3 };
  }).sort((a, b) => b.v - a.v);
}
function aiCutPick(p) {
  let best = null;
  cutTargets().forEach(({ ci, li }) => {
    const cl = S.clovers[ci];
    const n = uncutCount(cl);
    let v = 0;
    if (cl.owner >= 0) {
      const d = PTS[n - 1] - PTS[n];
      if (cl.owner === p) v = d - (n === 4 ? 4 : 0);
      else v = -d + (n === 4 ? 3 + (fourCount(cl.owner) >= WIN_FOUR - 2 ? 8 : 0) : 0);
    } else {
      v = cl.leaves[li].o === p ? -1 : 0.3;
    }
    v += Math.random() * 0.2;
    if (!best || v > best.v) best = { ci, li, v };
  });
  return best;
}
function aiResvPick(p) {
  let best = null;
  resvTargets().forEach(({ ci, li }) => {
    const cl = S.clovers[ci];
    const left = undrawn(cl);
    const k = left.length;
    const allMine = left.every((l) => l.rv === p || l === cl.leaves[li] || l.rv < 0);
    let v = 10 - k * 2 + LUCK_VAL[SH.clovers[ci].luck] + (allMine ? 2 : 0) + Math.random() * 0.3;
    if (!best || v > best.v) best = { ci, li, v };
  });
  return best;
}
function aiChooseMore() {
  const dl = drawsLeft();
  const count = (n) => S.clovers.filter((cl) => {
    const left = undrawn(cl);
    return left.length && left.length <= dl + n && left.every((l) => l.rv < 0 || l.rv === S.cur);
  }).length;
  return count(2) > count(1) ? 2 : 1;
}
function aiStep() {
  if (!S || S.over || !cur().ai) return;
  const p = S.cur;
  let acted = true;
  if (S.t.mode) {
    const pick = S.t.mode.k === 'cut' ? aiCutPick(p) : aiResvPick(p);
    if (pick) modeAct(pick.ci, pick.li); else S.t.mode = null;
  } else if (S.t.pending.length) {
    let i = S.t.pending.findIndex((it) => LUCK[it.luck].k !== 'more');
    if (i < 0) i = 0;
    const L = LUCK[S.t.pending[i].luck];
    activate(i, L.k === 'more' && !L.n ? aiChooseMore() : undefined);
  } else {
    const opts = canDrawNow() ? aiOptions(p) : [];
    const best = opts[0];
    if (best && (S.t.forced > 0 || S.t.normal === 0 || best.v > 1.5)) draw(best.t);
    else acted = false;
  }
  if (!acted) {
    endTurn();
  }
  afterChange();
}

/* ---------------- 결과 ---------------- */
function showEnd() {
  if (!S.over || !S.result) return;
  const { kind, winners, scores } = S.result;
  const names = winners.map((p) => S.players[p].name).join(' · ');
  const meWin = S.mode === 'ai' && winners.includes(0);
  $('endTitle').textContent = winners.length > 1 ? `공동 승리! ${names}` : (meWin ? '행운의 주인공은 나!' : `${names} 승리!`);
  $('endSub').textContent = kind === 'quick' ? '빠른종료 · 네잎 클로버 7개를 먼저 모았어요' : '빅매치! 모든 클로버가 그려졌어요';
  const rows = [['4잎', 4, 5], ['3잎', 3, 3], ['2잎', 2, 5], ['1잎', 1, 7], ['무당벌레', 'bug', 2], ['꽃·새싹', 'small', 1]];
  let h = `<table class="score-table"><tr><th>클로버</th><th>점수</th>${S.players.map((p, i) => `<th class="${winners.includes(i) ? 'win' : ''}"><span class="pen" style="--c:${p.c}"></span>${p.name}</th>`).join('')}</tr>`;
  rows.forEach(([lbl, key, pt]) => {
    h += `<tr><td>${lbl}</td><td>${pt}점</td>${scores.map((s, i) => `<td class="${winners.includes(i) ? 'win' : ''}">${s[key] || ''}</td>`).join('')}</tr>`;
  });
  h += `<tr class="total"><td colspan="2">총 점</td>${scores.map((s, i) => `<td class="${winners.includes(i) ? 'win' : ''}">${s.total}</td>`).join('')}</tr></table>`;
  $('endTable').innerHTML = h;
  showModal('endModal');
}

/* ---------------- 모달·토스트 ---------------- */
function showModal(id) { $(id).classList.add('show'); }
function hideModal(id) { $(id).classList.remove('show'); }
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}
document.querySelectorAll('.modal').forEach((m) => m.addEventListener('click', (e) => {
  if (e.target === m && (m.id !== 'startModal' || S)) m.classList.remove('show');
}));
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('.modal').classList.remove('show')));

// 시작 화면
let pickMode = 'ai', pickN = 2;
function syncStart() {
  $('modeSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.mode === pickMode));
  $('countSeg').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', +b.dataset.n === pickN);
  });

}
$('modeSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.dataset.mode) { pickMode = b.dataset.mode; syncStart(); } });
$('countSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.dataset.n) { pickN = +b.dataset.n; syncStart(); } });
$('startBtn').addEventListener('click', () => { hideModal('startModal'); setup(pickMode, pickN); });
const openStart = () => { hideModal('endModal'); syncStart(); showModal('startModal'); };
$('newBtn').addEventListener('click', openStart);
$('badge').addEventListener('click', openStart);
$('again').addEventListener('click', openStart);
$('seeBoard').addEventListener('click', () => hideModal('endModal'));
$('rulesBtn').addEventListener('click', () => showModal('rulesModal'));
$('rulesBtn2').addEventListener('click', () => showModal('rulesModal'));

document.querySelectorAll('[data-lk]').forEach((e) => { e.insertAdjacentHTML('afterbegin', luckIcon(e.dataset.lk, 20)); });

// 처음: 뒤에 빈 시트를 깔고 시작 창
(function boot() {
  setup('hot', 2, true);
  syncStart();
  showModal('startModal');
})();

// 시험용 (콘솔에서 상태 보기)
window.__7c = { get S() { return S; }, setup, endTurn, draw, scoreOf, aiOptions, aiStep, fourCount, showEnd, DECOR_PTS, RULES };
