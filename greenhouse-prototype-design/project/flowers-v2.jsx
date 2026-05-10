// flowers-v2.jsx — RPG-style 10-flower reference set, 12 stages each.
// Renders into a 28×38 pixel canvas. Each flower has a unique bloom shape,
// leaf style, stem profile, and accent.
// Stages:
//   0 seeded · 1 sprouting · 2 growing · 3 budding · 4 flowering ·
//   5 fully flowered · 6 thriving · 7 extra thriving ·
//   8 wilting · 9 sad wilting · 10 dying · 11 dead

(function () {

const W = 28, H = 38;

// ── PixelSprite (inlined) ─────────────────────────────────────────
// Accepts EITHER a 2D array `cells` (preferred — supports multi-char codes
// like "IK"/"P1"/"G1") OR a `grid` of single-char strings (legacy).
function PixelSprite({ cells, grid, palette, scale = 4, style = {}, bg }) {
  // Normalise to a 2D array of codes
  const m = cells || (grid ? grid.map(r => Array.from(r)) : []);
  const h = m.length, w = h ? m[0].length : 0;
  const rects = [];
  if (bg) rects.push(<rect key="bg" x={0} y={0} width={w} height={h} fill={bg} />);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = m[y][x];
      if (c === '.' || c === ' ' || c === '' || c === undefined || c === null) continue;
      const fill = palette[c];
      if (!fill) continue;
      let run = 1;
      while (x + run < w && m[y][x + run] === c) run++;
      rects.push(<rect key={x + ',' + y} x={x} y={y} width={run} height={1} fill={fill} shapeRendering="crispEdges" />);
      x += run - 1;
    }
  }
  return (
    <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'block', imageRendering: 'pixelated', shapeRendering: 'crispEdges', ...style }}
    >{rects}</svg>
  );
}

// ── Shared shop palette (RPG terracotta) ──────────────────────────
const BASE = {
  // pot
  P1: '#7d3a18',  // deep brown
  P2: '#a25a2a',  // mid terracotta
  P3: '#c87838',  // light terracotta
  P4: '#e89a52',  // rim hilite
  // soil
  S1: '#3a1f12',  // deep loam
  S2: '#5a3520',  // mid soil
  S3: '#7a4a30',  // dust
  // stem & leaf (healthy)
  G0: '#1c3a18',  // outline
  G1: '#2e5e2a',  // dark leaf
  G2: '#4a8f3a',  // mid leaf
  G3: '#7fc850',  // hi leaf
  G4: '#b9e87a',  // hilight
  // wilt browns
  W1: '#3a2418',
  W2: '#6a4a1a',
  W3: '#9a7a3a',
  W4: '#c8a85a',
  // dead/dying
  D1: '#3a2c20',
  D2: '#6a5a4a',
  // sparkles
  K1: '#ffd56a',
  K2: '#fff7c8',
  // glow
  GL: '#ffeaa8',
  // outline ink
  IK: '#1d1208',
  // background dirt shadow
  SH: '#000000',
};

// ── Pot + soil, drawn into the 28×38 canvas ──────────────────────
function drawPot(g) {
  const set = (x, y, c) => { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; };
  // ground shadow
  for (let x = 6; x <= 21; x++) set(x, 35, 'SH');
  // base ring
  for (let x = 9; x <= 18; x++) set(x, 34, 'P1');
  // body rows (28..33), curving
  // narrowing pot: rows 28-29 12 wide, 30-32 10 wide, 33 8 wide
  const bands = [
    { y: 28, x0: 7, x1: 20 },
    { y: 29, x0: 7, x1: 20 },
    { y: 30, x0: 8, x1: 19 },
    { y: 31, x0: 8, x1: 19 },
    { y: 32, x0: 9, x1: 18 },
    { y: 33, x0: 9, x1: 18 },
  ];
  bands.forEach((b, i) => {
    for (let x = b.x0; x <= b.x1; x++) {
      const isEdge = x === b.x0 || x === b.x1;
      const isHi = (x - b.x0) <= 2 && i < 4;
      set(x, b.y, isEdge ? 'P1' : isHi ? 'P3' : 'P2');
    }
  });
  // pot rim (taller, rectangular)
  for (let x = 6; x <= 21; x++) {
    set(x, 26, 'P1');
    set(x, 27, x <= 8 || x >= 19 ? 'P1' : (x <= 11 ? 'P4' : 'P3'));
  }
  set(6, 26, 'IK'); set(21, 26, 'IK');
  // soil top inside rim
  for (let x = 9; x <= 18; x++) set(x, 25, 'S1');
  set(11, 25, 'S2'); set(14, 25, 'S3'); set(16, 25, 'S2');
}

// ── Leaf shapes — each is a small grid placed via offset ─────────
// L=main, l=hilite, k=outline. 'side' = 'L' or 'R' to mirror.
const LEAVES = {
  oval: { // rose, hibiscus
    grid: [
      'kkk.',
      'kLLk',
      'kLlk',
      'kLLk',
      '.kk.',
    ],
    w: 4, h: 5,
  },
  spear: { // tulip, lily, lavender
    grid: [
      'k...',
      'kk..',
      'kLk.',
      'kLLk',
      'kLLk',
      'kLlk',
      '.kkk',
      '..k.',
    ],
    w: 4, h: 8,
  },
  fern: { // poppy, marigold
    grid: [
      'k.k.k.',
      'kLkLkL',
      'kLLLLL',
      'kkkLkk',
      '..kkk.',
    ],
    w: 6, h: 5,
  },
  broad: { // sunflower (heart-ish)
    grid: [
      'kkkk..',
      'kLLLk.',
      'kLllLk',
      'kLLLLk',
      'kLLLLk',
      '.kkkk.',
    ],
    w: 6, h: 6,
  },
  narrow: { // daisy, iris (long blade)
    grid: [
      'k.',
      'kk',
      'Lk',
      'Lk',
      'Lk',
      'lk',
      'kk',
      '.k',
    ],
    w: 2, h: 8,
  },
  arched: { // bluebell (drooping curve)
    grid: [
      '.kk.',
      'kLLk',
      'kLlk',
      'kkk.',
      '.k..',
    ],
    w: 4, h: 5,
  },
};

function stamp(g, sprite, ox, oy, mirror, charMap) {
  for (let y = 0; y < sprite.length; y++) {
    const row = sprite[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === '.' || c === ' ') continue;
      const px = mirror ? ox + (row.length - 1 - x) : ox + x;
      const py = oy + y;
      if (py < 0 || py >= H || px < 0 || px >= W) continue;
      const m = charMap ? (charMap[c] || c) : c;
      g[py][px] = m;
    }
  }
}

// ── Bloom sprites (per flower) ───────────────────────────────────
// chars: a/b/c outer→inner petal, d=center, e=center hi, h=highlight, k=outline
const BLOOMS = {
  rose: {
    bud: [ '.k.', 'kak', 'kak', 'kbk', '.k.' ],
    open: [
      '.kkk.',
      'kbabk',
      'kabak',
      'kbabk',
      '.kkk.',
    ],
    full: [
      '..kkk..',
      '.kbabk.',
      'kabhbak',
      'kahcahk',
      'kabhbak',
      '.kbabk.',
      '..kkk..',
    ],
    mega: [
      '...kkk...',
      '..kbabk..',
      '.kabhbak.',
      'kbahchabk',
      'kahcecahk',
      'kbahchabk',
      '.kabhbak.',
      '..kbabk..',
      '...kkk...',
    ],
    cols: { a: '#a3173a', b: '#d83a64', h: '#ff8aa8', c: '#5a0820', d: '#5a0820', e: '#ffc0d0' },
  },
  tulip: {
    bud: [ 'kak', 'kak', 'kbk', 'kbk', '.k.' ],
    open: [
      'k.k.k',
      'kakak',
      'kabak',
      'kbcbk',
      '.kkk.',
    ],
    full: [
      '.k.k.k.',
      '.kakak.',
      'kababak',
      'kabhbak',
      'kbacabk',
      '.kbcbk.',
      '..kkk..',
    ],
    mega: [
      'k.k.k.k.k',
      'kakakakak',
      'kabababak',
      'kabhhhbak',
      'kabhcebak',
      'kbacacabk',
      '.kbacabk.',
      '..kbcbk..',
      '...kkk...',
    ],
    cols: { a: '#e8497a', b: '#ff7aa8', h: '#ffc0d8', c: '#7a1838', d: '#7a1838', e: '#ffe0e8' },
  },
  sunflower: {
    bud: [ '.k.', 'kak', 'kdk', 'kak', '.k.' ],
    open: [
      'kakak',
      'akakA',  // typo guard
      'adcda',
      'akakA',
      'kakak',
    ],
    full: [
      '.a.a.a.',
      'akabaka',
      'akbdbka',
      'abdedba',
      'akbdbka',
      'akabaka',
      '.a.a.a.',
    ],
    mega: [
      'a.a.a.a.a',
      'aaabababa',
      'abkababka',
      'abkbdbkba',
      'abdedededba',  // 11 wide
    ].map(r => r.padEnd(9, '.').slice(0, 9)).concat([
      'abkbdbkba',
      'abkababka',
      'aaabababa',
      'a.a.a.a.a',
    ]),
    cols: { a: '#f6c247', b: '#ffd56a', h: '#fff2b8', c: '#3a1f08', d: '#3a1f08', e: '#7a4a10', A: '#f6c247' },
  },
  daisy: {
    bud: [ 'kak', 'kak', 'kdk', '.k.' ],
    open: [
      '.k.k.',
      'kabak',
      'adeda',
      'kabak',
      '.k.k.',
    ],
    full: [
      '.k.a.k.',
      'kababak',
      'abdedba',
      'a dedea',
      'abdedba',
      'kababak',
      '.k.a.k.',
    ],
    mega: [
      '..k.a.k..',
      '.kababak.',
      'akabhabka',
      'abdededba',
      'aedeeedea',
      'abdededba',
      'akabhabka',
      '.kababak.',
      '..k.a.k..',
    ],
    cols: { a: '#fff8e8', b: '#d8c8a8', h: '#fffce0', c: '#7a5a10', d: '#f6c247', e: '#fff2b8' },
  },
  lavender: {
    bud: [ '.a.', 'kak', 'kak', '.a.' ],
    open: [
      '..a..',
      '.aba.',
      'aabaa',
      '.bab.',
      '..a..',
      'aabaa',
      '.aba.',
      '..a..',
    ],
    full: [
      '..a..',
      '.aba.',
      'aabaa',
      '.bhb.',
      '.aba.',
      'aabaa',
      '.bhb.',
      '.aba.',
      'aabaa',
      '.aba.',
      '..a..',
    ],
    mega: [
      '..a..',
      '.aba.',
      'aabaa',
      '.bhb.',
      'aabaa',
      '.aba.',
      'aabaa',
      '.bhb.',
      'aabaa',
      '.aba.',
      'aabaa',
      '.bhb.',
      'aabaa',
      '.aba.',
      '..a..',
    ],
    cols: { a: '#9a6ed0', b: '#5a3a90', h: '#d8b8ff', c: '#3a1f5a', d: '#3a1f5a', e: '#fff' },
  },
  lily: {
    bud: [ 'kak', 'kak', 'kbk', 'kbk', '.k.' ],
    open: [
      '.a.a.',
      'kbabk',
      'kbdbk',
      '.bdb.',
      '..d..',
    ],
    full: [
      '.a.a.a.',
      'kbacabk',
      'kbcdcbk',
      'k.bdb.k',
      '..bdb..',
      '...d...',
      '..b.b..',
    ],
    mega: [
      'a.a.a.a.a',
      'akbacabka',
      'kbacacabk',
      'kbcdedcbk',
      '.kbdedbk.',
      '..bdedb..',
      '...bdb...',
      '...bdb...',
      '..b...b..',
    ],
    cols: { a: '#ff8a3a', b: '#e85a18', h: '#ffc890', c: '#7a3a18', d: '#3a1808', e: '#ffe0a8' },
  },
  poppy: {
    bud: [ '.k.', 'kak', 'kak', 'kak', '.k.' ],
    open: [
      '.kkk.',
      'kabak',
      'adeda',
      'kabak',
      '.kkk.',
    ],
    full: [
      '..kkk..',
      '.kababk',
      'kababak',
      'aadedaa',
      'kababak',
      '.kababk',
      '..kkk..',
    ],
    mega: [
      '...kkk...',
      '..kababk.',
      '.kabhbabk',
      'kabhdedahk',  // 10
    ].map(r => r.padEnd(9, '.').slice(0, 9)).concat([
      'kabededbak',
    ].map(r => r.padEnd(9, '.').slice(0, 9))).concat([
      '.kabhbabk',
      '..kababk.',
      '...kkk...',
    ]),
    cols: { a: '#e8341a', b: '#ff6a3a', h: '#ffb088', c: '#1a0808', d: '#1a0808', e: '#3a1f08' },
  },
  bluebell: { // bell hangs downward; we draw a cluster
    bud: [ '.a.', 'aba', 'aba', '.a.' ],
    open: [
      '.a.a.',
      'abdba',
      'abdba',
      '.bdb.',
      '..d..',
    ],
    full: [
      'a.a.a.a',
      'abababa',
      'abdbdba',
      '.bdbdb.',
      '..bdb..',
      '...d...',
    ],
    mega: [
      'a.a.a.a.a',
      'abababaab',  // 9
    ].map(r => r.padEnd(9, '.').slice(0,9)).concat([
      'abdbdbdba',
      'abdbdbdba',
      '.bdbdbdb.',
      '..bdbdb..',
      '...bdb...',
      '....d....',
    ]),
    cols: { a: '#5a8ad8', b: '#3a5aa8', h: '#a8c8ff', c: '#1f2c5a', d: '#1f2c5a', e: '#fff' },
  },
  marigold: {
    bud: [ '.a.', 'kak', 'kak', '.a.' ],
    open: [
      '.kak.',
      'kbabk',
      'abdba',
      'kbabk',
      '.kak.',
    ],
    full: [
      '..a.a..',
      '.kabak.',
      'kbababk',
      'abdedba',
      'kbababk',
      '.kabak.',
      '..a.a..',
    ],
    mega: [
      '..a.a.a..',
      '.kababak.',
      'kbababbak',  // 9
    ].map(r => r.padEnd(9, '.').slice(0,9)).concat([
      'abdededba',
      'abedeedea',
    ].map(r => r.padEnd(9, '.').slice(0,9))).concat([
      'abdededba',
      'kbababbak',
      '.kababak.',
      '..a.a.a..',
    ]),
    cols: { a: '#f8a01c', b: '#e8631c', h: '#ffd078', c: '#7a3a08', d: '#7a3a08', e: '#ffd078' },
  },
  iris: {
    bud: [ '.k.', 'kak', 'kbk', 'kbk', '.k.' ],
    open: [
      '..a..',
      '.aba.',
      'abdba',
      'kbeak',
      'kkbkk',
    ],
    full: [
      '.a.a.a.',
      '.ababa.',
      'abcdcba',
      'kbdedbk',
      'k.beb.k',
      '.k.b.k.',
      '..bbb..',
    ],
    mega: [
      'a.a.a.a.a',
      '.abababa.',
      'abcdcdcba',  // 9
    ].map(r => r.padEnd(9, '.').slice(0,9)).concat([
      'kbcdededbk',
      'kbdeeebdk',
    ].map(r => r.padEnd(9, '.').slice(0,9))).concat([
      'kkbdedbkk',
      '..bdedb..',
      '...beb...',
      '...bbb...',
    ]),
    cols: { a: '#9a4ad0', b: '#5a2a90', h: '#d8a8ff', c: '#7a4ab0', d: '#3a1f5a', e: '#f8c042' },
  },
};

// ── Flower defs: leaf style + stem profile ───────────────────────
const FLOWERS_V2 = {
  rose:      { name: 'Rose',      leaf: 'oval',   stem: { thorns: true } },
  tulip:     { name: 'Tulip',     leaf: 'spear',  stem: { } },
  sunflower: { name: 'Sunflower', leaf: 'broad',  stem: { thick: true } },
  daisy:     { name: 'Daisy',     leaf: 'narrow', stem: { } },
  lavender:  { name: 'Lavender',  leaf: 'narrow', stem: { spike: true } },
  lily:      { name: 'Lily',      leaf: 'spear',  stem: { } },
  poppy:     { name: 'Poppy',     leaf: 'fern',   stem: { hairy: true } },
  bluebell:  { name: 'Bluebell',  leaf: 'arched', stem: { arched: true } },
  marigold:  { name: 'Marigold',  leaf: 'fern',   stem: { } },
  iris:      { name: 'Iris',      leaf: 'narrow', stem: { } },
};

const FLOWER_ORDER = ['rose','tulip','sunflower','daisy','lavender','lily','poppy','bluebell','marigold','iris'];

// ── Stage configs ────────────────────────────────────────────────
const STAGES = [
  // i, name, stemTopY, leafYs, bloomKey, scale, droop, brown, dead, sparkle, glow
  // bushy mound model: tiers = number of foliage clump rows; blooms = bloom head count
  { name: 'seeded',         tiers: 0, blooms: 0, droop: 0, brown: 0, dead: false },
  { name: 'sprouting',      tiers: 0, blooms: 0, droop: 0, brown: 0, dead: false, sprout: true },
  { name: 'growing',        tiers: 1, blooms: 0, droop: 0, brown: 0, dead: false },
  { name: 'budding',        tiers: 2, blooms: 1, droop: 0, brown: 0, useBud: true, dead: false },
  { name: 'flowering',      tiers: 3, blooms: 3, droop: 0, brown: 0, dead: false },
  { name: 'fully flowered', tiers: 4, blooms: 5, droop: 0, brown: 0, dead: false },
  { name: 'thriving',       tiers: 5, blooms: 7, droop: 0, brown: 0, sparkle: true, dead: false },
  { name: 'extra thriving', tiers: 6, blooms: 10, droop: 0, brown: 0, sparkle: true, glow: true, dead: false },
  { name: 'wilting',        tiers: 3, blooms: 3, droop: 1, brown: 0.3, dead: false },
  { name: 'sad wilting',    tiers: 2, blooms: 2, droop: 2, brown: 0.6, dead: false },
  { name: 'dying',          tiers: 1, blooms: 1, droop: 3, brown: 1, useBud: true, dead: false },
  { name: 'dead',           tiers: 0, blooms: 0, droop: 4, brown: 1, dead: true },
];

// ── Builder (bushy mound: foliage clumps + scattered bloom heads) ─
// Foliage clump (5x4) — overlapping leaf cluster
const CLUMP = [
  '.LLL.',
  'LLlLL',
  'LlLlL',
  '.kkk.',
];
// Mini bloom head (5x5) — palette resolves a/b/d/h per flower
const HEAD_ROUND = [
  '.kak.',
  'kbhbk',
  'ahdha',
  'kbhbk',
  '.kak.',
];
// Mini pointed/cup head — for tulip, lily, bluebell, iris
const HEAD_CUP = [
  '.kak.',
  'kbabk',
  'kahak',
  'kbdbk',
  '.kkk.',
];
// Mini bud (4x4) — used at budding/dying
const HEAD_BUD = [
  '.kk.',
  'kbak',
  'kahk',
  '.kk.',
];

// Per-flower head shape preference
const HEAD_SHAPE = {
  rose: 'round', daisy: 'round', sunflower: 'round', poppy: 'round',
  marigold: 'round', lavender: 'round',
  tulip: 'cup', lily: 'cup', bluebell: 'cup', iris: 'cup',
};

// Six tiers of foliage clump centers, bottom (closest to pot) to top.
// Each entry [cx, cy, alt] — alt=1 swaps to lighter leaf shade for variety.
const FOLIAGE_TIERS = [
  // T0: bottom row — sits on pot rim (rim is at y=26)
  [[10,24,0], [14,24,1], [18,24,0]],
  // T1
  [[8,22,1], [13,22,0], [18,22,1], [22,22,0]],
  // T2
  [[10,20,0], [15,20,1], [20,20,0]],
  // T3
  [[9,18,1], [14,18,0], [19,18,1]],
  // T4
  [[11,16,0], [17,16,1]],
  // T5: apex
  [[14,14,0]],
];

// Bloom slot positions, sorted so we add from edge-low → center-high as count grows.
// Designed to scatter across the mound surface (top half).
const BLOOM_SLOTS = [
  [14, 21],            // 1: front-center low
  [10, 19], [18, 19],  // 2-3: front-side
  [14, 17],            // 4: middle
  [11, 15], [17, 15],  // 5-6: middle-side
  [14, 14],            // 7: top-center
  [8, 17], [20, 17],   // 8-9: outer
  [14, 12],            // 10: apex
];

function buildFlowerGrid(type, stageIdx) {
  const F = FLOWERS_V2[type];
  const S = STAGES[stageIdx];
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const set = (x, y, c) => { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; };

  drawPot(g);

  // Dead: just dirt with a couple of dried twig fragments
  if (S.dead) {
    set(11, 24, 'D2'); set(13, 25, 'D1');
    set(15, 24, 'D1'); set(17, 25, 'D2');
    set(13, 23, 'D2'); set(16, 23, 'D1');
    return g;
  }

  // Seeded: a few seeds on soil
  if (S.name === 'seeded') {
    set(11, 25, 'IK'); set(12, 25, 'IK');
    set(15, 25, 'IK'); set(17, 24, 'IK');
    return g;
  }

  // Sprouting: tiny green sprout
  if (S.sprout) {
    set(14, 24, 'G1'); set(14, 23, 'G1');
    set(13, 22, 'G2'); set(15, 22, 'G2');
    set(12, 22, 'IK'); set(16, 22, 'IK');
    set(13, 21, 'G3'); set(15, 21, 'G3');
    set(14, 22, 'G2'); set(14, 21, 'G2');
    return g;
  }

  // ── Foliage mound ───────────────────────────────────────────
  // Two leaf-color variants for depth
  const leafA = (S.brown >= 1)   ? { L: 'W2', l: 'W3', k: 'W1' }
              : (S.brown >= 0.6) ? { L: 'W3', l: 'W4', k: 'W1' }
              : (S.brown >= 0.3) ? { L: 'G1', l: 'W4', k: 'W1' }
              :                    { L: 'G1', l: 'G3', k: 'IK' };
  const leafB = (S.brown >= 0.3) ? leafA
              :                    { L: 'G2', l: 'G3', k: 'IK' };

  const droop = S.droop || 0;
  const droopX = droop ? Math.min(3, droop) : 0;

  for (let t = 0; t < S.tiers; t++) {
    const tierClumps = FOLIAGE_TIERS[t] || [];
    // wilt: upper tiers droop right and down
    const tierFrac = t / Math.max(1, S.tiers - 1);
    const dy = Math.round(droop * tierFrac);
    const dx = Math.round(droopX * tierFrac);
    for (const [cx, cy, alt] of tierClumps) {
      const map = alt ? leafB : leafA;
      stamp(g, CLUMP, cx - 2 + dx, cy - 1 + dy, false, map);
    }
  }

  // ── Bloom heads ─────────────────────────────────────────────
  const headShape = HEAD_SHAPE[type] === 'cup' ? HEAD_CUP : HEAD_ROUND;
  const headGrid  = S.useBud ? HEAD_BUD : headShape;
  const hw = headGrid[0].length, hh = headGrid.length;

  // Stamp blooms in z-order: top tier (back) first → front-low last
  // Sort slots by y descending so foreground (higher y) overdraws background.
  const slots = BLOOM_SLOTS.slice(0, S.blooms).sort((a, b) => a[1] - b[1]);
  for (const [bx, by] of slots) {
    const tierFrac = (24 - by) / 12; // 0 near pot, 1 near apex
    const dy = Math.round(droop * tierFrac);
    const dx = Math.round(droopX * tierFrac);
    stamp(g, headGrid, bx - Math.floor(hw / 2) + dx, by - Math.floor(hh / 2) + dy, false, null);
  }

  // ── Effects ─────────────────────────────────────────────────
  if (S.sparkle) {
    [[5, 17], [22, 14], [4, 12], [23, 19], [14, 9], [9, 10]].forEach(([px, py]) => {
      set(px, py, 'K1');
      set(px + 1, py, 'K2');
      set(px, py + 1, 'K2');
    });
  }
  if (S.glow) {
    [[3, 14], [24, 14], [5, 9], [22, 9], [11, 7], [17, 7], [14, 6]].forEach(([px, py]) => {
      if (g[py] && g[py][px] === '.') g[py][px] = 'GL';
    });
  }

  return g;
}

function makeCharMap() {
  // base + per-render overlay supplied separately (flower colors live in stamp())
  return { ...BASE };
}

function FlowerV2({ type = 'rose', stage = 5, scale = 4, style = {}, bg }) {
  const cells = React.useMemo(() => buildFlowerGrid(type, stage), [type, stage]);
  const palette = React.useMemo(() => {
    const def = BLOOMS[type] || { cols: {} };
    const S = STAGES[stage];
    const base = { ...BASE };
    // Bloom outline shares ink
    base.k = BASE.IK;
    // Per-flower petal colors
    const cols = { ...def.cols };
    // Brown shift on wilt
    if (S.brown >= 0.6) {
      cols.a = BASE.W3; cols.b = BASE.W4; cols.h = BASE.W2;
      cols.c = BASE.W1; cols.d = BASE.W1; cols.e = BASE.W4;
    } else if (S.brown >= 0.3) {
      cols.b = BASE.W4; cols.h = BASE.W4;
    }
    return { ...base, ...cols };
  }, [type, stage]);
  return <PixelSprite cells={cells} palette={palette} scale={scale} style={style} bg={bg} />;
}

const STAGE_NAMES = STAGES.map(s => s.name);

Object.assign(window, { FlowerV2, FLOWERS_V2, FLOWER_ORDER, STAGE_NAMES, BLOOMS, PixelSpriteV2: PixelSprite });

})();
