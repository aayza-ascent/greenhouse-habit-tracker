// pixel-art.jsx — sprite renderer + plant compositor + decorations + icons
// Plants are composed from parts (pot, soil, stem, leaves, flower) so each
// of the 12 plant types × 5 health stages is a config rather than a hand-
// drawn 16×16 grid. PixelSprite still ships for one-off art (coins, sun,
// keys, etc).

// ─── palettes ─────────────────────────────────────────────────────────
// Three flavours; default 'terracotta'. Tweak switches the active key.
const PIXEL_PALETTES = {
  terracotta: {
    name: 'Terracotta Greenhouse',
    bgSky:    '#f4e4c8',
    bgFloor:  '#d9b88f',
    bgWall:   '#e9c9a3',
    bgPanel:  '#fff5e2',
    bgPanel2: '#f3dfb6',
    ink:      '#3a2418',
    inkSoft:  '#6b4a36',
    line:     '#8a5a3c',
    accent:   '#c84a2e',  // tomato red
    accentB:  '#e98a3e',  // marigold
    coin:     '#f6c247',
    coinDark: '#b8821b',
    leafD:    '#2e5e2a',
    leaf:     '#4a8f3a',
    leafL:    '#7fc850',
    leafX:    '#b9e87a',
    stem:     '#3d6a2a',
    stemL:    '#6ba53a',
    soil:     '#5a3320',
    soilL:    '#7a4a2c',
    pot:      '#a6532a',
    potL:     '#c8703f',
    potD:     '#7a3a18',
    sky:      '#88c4e8',
    sun:      '#ffd56a',
    moon:     '#e8e0c8',
    star:     '#fff2b8',
    night1:   '#1d1830',
    night2:   '#2c244a',
    nightTint:'#3a2c5a',
    wilt:     '#9a7a3a',
    wiltD:    '#6a4a1a',
    dead:     '#5a4a3a',
    deadL:    '#8a7a6a',
    glass:    'rgba(255,245,220,0.92)',
    glassBorder: '#8a5a3c',
  },
  twilight: {
    name: 'Twilight Conservatory',
    bgSky:    '#1f1a3d',
    bgFloor:  '#3a2a52',
    bgWall:   '#2c2348',
    bgPanel:  '#27224a',
    bgPanel2: '#3a3266',
    ink:      '#f4ecff',
    inkSoft:  '#bba8d8',
    line:     '#7a5fb2',
    accent:   '#ff6ea8',
    accentB:  '#ffd56a',
    coin:     '#ffd14a',
    coinDark: '#a87410',
    leafD:    '#1a4a3a',
    leaf:     '#2e8a6a',
    leafL:    '#4fd2a0',
    leafX:    '#9fffd8',
    stem:     '#2a6a4a',
    stemL:    '#4fb286',
    soil:     '#2a1838',
    soilL:    '#3e2a52',
    pot:      '#5a3a8a',
    potL:     '#7e58b8',
    potD:     '#3a205a',
    sky:      '#1f1a3d',
    sun:      '#ffe07a',
    moon:     '#f4ecff',
    star:     '#fff2b8',
    night1:   '#0c0a1c',
    night2:   '#1d1830',
    nightTint:'#2c244a',
    wilt:     '#a87a4a',
    wiltD:    '#5a3a2a',
    dead:     '#3a2c4a',
    deadL:    '#6a5a7a',
    glass:    'rgba(40,30,70,0.85)',
    glassBorder: '#7a5fb2',
  },
  pastel: {
    name: 'Pastel Garden',
    bgSky:    '#e6f6ff',
    bgFloor:  '#ffd9c2',
    bgWall:   '#fff0e0',
    bgPanel:  '#fffaf2',
    bgPanel2: '#ffe6d2',
    ink:      '#3a2c4a',
    inkSoft:  '#7a6a8a',
    line:     '#c8a2a8',
    accent:   '#ff8aa8',
    accentB:  '#a0d8ff',
    coin:     '#ffd66e',
    coinDark: '#b88a1a',
    leafD:    '#5fa04a',
    leaf:     '#8acf6e',
    leafL:    '#bfe89a',
    leafX:    '#dff5c8',
    stem:     '#6ab84a',
    stemL:    '#9fdc78',
    soil:     '#8a6a4a',
    soilL:    '#a88662',
    pot:      '#ffb088',
    potL:     '#ffd2b0',
    potD:     '#c87a52',
    sky:      '#e6f6ff',
    sun:      '#ffe48a',
    moon:     '#fffaf0',
    star:     '#fff8c8',
    night1:   '#2a2848',
    night2:   '#3c3868',
    nightTint:'#4a4280',
    wilt:     '#c8a85a',
    wiltD:    '#8a6a2a',
    dead:     '#a89aa8',
    deadL:    '#c8bcc8',
    glass:    'rgba(255,250,242,0.92)',
    glassBorder: '#c8a2a8',
  },
};

// ─── PixelSprite — turn a string grid into an SVG of <rect> pixels ───
function PixelSprite({ grid, palette, scale = 4, style = {}, className }) {
  const h = grid.length;
  const w = grid[0].length;
  const rects = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      if (c === '.' || c === ' ') continue;
      const fill = palette[c];
      if (!fill) continue;
      // merge runs along x for fewer nodes
      let run = 1;
      while (x + run < w && grid[y][x + run] === c) run++;
      rects.push(<rect key={`${x},${y}`} x={x} y={y} width={run} height={1} fill={fill} shapeRendering="crispEdges" />);
      x += run - 1;
    }
  }
  return (
    <svg
      width={w * scale} height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'block', imageRendering: 'pixelated', shapeRendering: 'crispEdges', ...style }}
      className={className}
    >{rects}</svg>
  );
}

// ─── Plant compositor ────────────────────────────────────────────────
// Each plant TYPE has flower colour(s) + a flower shape key.
// Each STAGE produces a composed grid drawn into a 24×28 canvas.

const FLOWER_SHAPES = {
  // 7×7 sprites stamped at the top of the stem; '.' transparent
  round: [   // tulip-like single bloom, color 'F' main, 'f' shadow, 'h' highlight
    '..hFh..',
    '.fFFFf.',
    'fFFhFFf',
    'fFFFFFf',
    '.fFFFf.',
    '..fFf..',
    '...d...',
  ],
  star: [   // daisy / sunflower
    '..f.f..',
    '.fFhFf.',
    'fFhcFFf',
    'fFccFFf',
    '.fFFFf.',
    '..f.f..',
    '...d...',
  ],
  bell: [   // bell flower
    '..fFf..',
    '.fFFFf.',
    '.fFhFf.',
    '..fFf..',
    '...f...',
    '...d...',
    '...d...',
  ],
  spike: [  // lavender / spike
    '...f...',
    '..fFf..',
    '.fFhFf.',
    '.fFFFf.',
    '.fFhFf.',
    '..fFf..',
    '...d...',
  ],
  cluster: [ // berry cluster
    '.f.f.f.',
    'fFfFfFf',
    '.fhfhf.',
    '.fFfFf.',
    '..f.f..',
    '...d...',
    '...d...',
  ],
  fan: [    // fern / cactus topper
    '..fFf..',
    '.fhFhf.',
    'fFFhFFf',
    'fFhhhFf',
    '.fFhFf.',
    '..fFf..',
    '...d...',
  ],
  none: null,
};

const PLANT_TYPES = {
  basil:      { name: 'Basil',      shape: 'fan',     fMain: 'leaf',  fShade: 'leafD', fHi: 'leafL',  price:  15, desc: 'Hardy starter herb' },
  tomato:     { name: 'Tomato',     shape: 'cluster', fMain: 'accent',fShade: '#7a1a0a',fHi: '#ff8a6a', price:  40, desc: 'Tasty red orbs' },
  sunflower:  { name: 'Sunflower',  shape: 'star',    fMain: 'sun',   fShade: '#b88a10',fHi: '#ffe89a',price:  60, desc: 'Reaches for the light' },
  tulip:      { name: 'Tulip',      shape: 'round',   fMain: 'accent',fShade: '#7a1a3a',fHi: '#ffb0c8',price:  25, desc: 'Classic spring bulb' },
  lavender:   { name: 'Lavender',   shape: 'spike',   fMain: '#9a6ed0',fShade: '#5a3a90',fHi: '#d8b8ff',price:  55, desc: 'Calming purple spires' },
  daisy:      { name: 'Daisy',      shape: 'star',    fMain: '#ffffff',fShade: '#c8c0b0',fHi: '#fff8d0',price:  20, desc: 'Cheerful little face' },
  fern:       { name: 'Fern',       shape: 'fan',     fMain: 'leafL', fShade: 'leafD', fHi: 'leafX', price:  30, desc: 'Quiet and reliable' },
  cactus:     { name: 'Cactus',     shape: 'none',    fMain: 'leaf',  fShade: 'leafD', fHi: 'leafL', price:  35, desc: 'Forgives forgetfulness' },
  rose:       { name: 'Rose',       shape: 'round',   fMain: '#e63864',fShade: '#7a1a3a',fHi: '#ff9ab8',price: 110, desc: 'Tend with patience' },
  mushroom:   { name: 'Mushroom',   shape: 'round',   fMain: '#d04a3a',fShade: '#7a1a0a',fHi: '#ffb89a',price:  90, desc: 'Loves the night shift' },
  bonsai:     { name: 'Bonsai',     shape: 'fan',     fMain: 'leafD', fShade: '#1a3a1a',fHi: 'leaf',  price: 220, desc: 'A long-game plant' },
  starflower: { name: 'Starflower', shape: 'spike',   fMain: '#ffd56a',fShade: '#a87410',fHi: '#fff2b8',price: 320, desc: 'Rare. Glows at night' },
};

// Resolve a plant's flower colors against the active palette (so 'leaf'
// / 'accent' / 'sun' refs become real hex codes; literal hexes pass through).
function resolveFlowerColors(type, palette) {
  const t = PLANT_TYPES[type];
  const r = (k) => (palette[k] != null ? palette[k] : k);
  return { F: r(t.fMain), f: r(t.fShade), h: r(t.fHi) };
}

// Build a 24×28 grid for a plant at a given stage.
// stages: 'seed' | 'sprout' | 'growing' | 'flowering' | 'thriving' | 'wilting' | 'dead'
function buildPlantGrid({ type, stage, palette, withPot = true }) {
  const W = 24, H = 28;
  // start blank
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const set = (x, y, c) => { if (y >= 0 && y < H && x >= 0 && x < W && c) g[y][x] = c; };
  const stamp = (sprite, ox, oy, charMap) => {
    for (let y = 0; y < sprite.length; y++) {
      for (let x = 0; x < sprite[y].length; x++) {
        const c = sprite[y][x];
        if (c === '.') continue;
        const m = charMap ? (charMap[c] || c) : c;
        set(ox + x, oy + y, m);
      }
    }
  };

  // Pot rim spans x=6..17 at y=22, body 7..16 y=23..26, base 8..15 y=27
  if (withPot) {
    // shadow on ground
    for (let x = 5; x <= 18; x++) set(x, 27, 'k');
    // pot rim
    for (let x = 6; x <= 17; x++) { set(x, 22, 'p'); set(x, 23, 'p'); }
    set(6, 22, 'k'); set(17, 22, 'k');
    // body
    for (let y = 24; y <= 26; y++) {
      for (let x = 7; x <= 16; x++) set(x, y, 'p');
      set(7, y, 'k'); set(16, y, 'k');
    }
    // highlight
    for (let y = 23; y <= 25; y++) set(8, y, 'P');
    set(9, 23, 'P');
    // base shadow
    for (let x = 8; x <= 15; x++) set(x, 27, 'k');
    // soil top
    for (let x = 8; x <= 15; x++) set(x, 22, 's');
    set(10, 22, 'S'); set(13, 22, 'S');
  } else {
    // ground tile
    for (let x = 4; x <= 19; x++) { set(x, 26, 'g'); set(x, 27, 'd'); }
  }

  if (stage === 'seed') {
    // single seed dot in soil
    set(11, 21, 'b'); set(12, 21, 'b');
    set(11, 22, 'b'); set(12, 22, 'b');
    return g;
  }

  if (stage === 'dead') {
    // dried stem only, dust color
    set(11, 21, 'X'); set(12, 21, 'X');
    set(12, 20, 'X');
    set(11, 19, 'X'); set(13, 19, 'X');
    set(12, 18, 'X');
    return g;
  }

  // STEM HEIGHT by stage
  // stem extends upward from soil top (y=21 → up)
  let stemTop = 21;
  if (stage === 'sprout') stemTop = 18;
  if (stage === 'growing') stemTop = 14;
  if (stage === 'flowering') stemTop = 10;
  if (stage === 'thriving') stemTop = 7;
  if (stage === 'wilting') stemTop = 13;

  const stemColor = stage === 'wilting' ? 'W' : 'd';
  const stemHi = stage === 'wilting' ? 'W' : 'D';
  // draw stem center column
  for (let y = stemTop; y <= 21; y++) {
    set(12, y, stemColor);
    if (y % 2 === 0) set(11, y, stemHi);
  }

  // sprout = just two tiny leaves
  if (stage === 'sprout') {
    set(11, 18, 'l'); set(13, 18, 'l');
    set(10, 19, 'l'); set(14, 19, 'l');
    set(11, 19, 'L'); set(13, 19, 'L');
    return g;
  }

  // LEAVES — pairs at intervals up the stem
  const leafColor = stage === 'wilting' ? 'W' : 'l';
  const leafHi = stage === 'wilting' ? 'W' : 'L';
  const leafShade = stage === 'wilting' ? 'w' : 'd';
  const leafYs = [];
  if (stage === 'growing')   leafYs.push(18, 16);
  if (stage === 'flowering') leafYs.push(19, 16, 13);
  if (stage === 'thriving')  leafYs.push(20, 17, 14, 11);
  if (stage === 'wilting')   leafYs.push(18, 16);

  leafYs.forEach((y, i) => {
    const droop = stage === 'wilting' ? i + 1 : 0;
    // left leaf
    set(10, y + droop, leafShade);
    set(9, y + droop, leafColor);
    set(8, y + droop, leafColor);
    set(9, y + 1 + droop, leafHi);
    set(8, y + 1 + droop, leafColor);
    set(10, y + 1 + droop, leafShade);
    // right leaf
    set(14, y + droop, leafShade);
    set(15, y + droop, leafColor);
    set(16, y + droop, leafColor);
    set(15, y + 1 + droop, leafHi);
    set(16, y + 1 + droop, leafColor);
    set(14, y + 1 + droop, leafShade);
  });

  // FLOWER (only on flowering / thriving)
  const t = PLANT_TYPES[type];
  if ((stage === 'flowering' || stage === 'thriving') && t.shape !== 'none') {
    const sprite = FLOWER_SHAPES[t.shape];
    const sw = sprite[0].length;
    const ox = Math.round(12 - sw / 2);
    const oy = stemTop - sw + 1;
    // F=main, f=shade, h=highlight, c=center, d=stem (already set)
    stamp(sprite, ox, oy, { F: 'F', f: 'f', h: 'h', c: 'D', d: stemColor });
    if (stage === 'thriving') {
      // sparkle around bloom
      set(ox - 1, oy + 1, '*');
      set(ox + sw, oy + 2, '*');
      set(ox + Math.floor(sw / 2), oy - 1, '*');
    }
  } else if (stage === 'thriving' && t.shape === 'none') {
    // cactus thriving: more bulk + arms
    set(10, 14, 'l'); set(14, 14, 'l');
    set(10, 13, 'l'); set(14, 13, 'l');
    set(9, 13, 'l'); set(15, 13, 'l');
    set(11, 11, 'L'); set(13, 11, 'L');
  }

  return g;
}

// Plant — high-level renderer. Pass type, stage, palette, scale.
function Plant({ type = 'basil', stage = 'sprout', palette, scale = 5, withPot = true, style = {} }) {
  const t = PLANT_TYPES[type];
  const flowerCols = resolveFlowerColors(type, palette);
  const charMap = {
    // pot
    p: palette.pot, P: palette.potL, k: palette.potD,
    // soil
    s: palette.soil, S: palette.soilL,
    // stem (healthy)
    d: palette.stem, D: palette.stemL,
    // stem (wilting)
    W: palette.wilt, w: palette.wiltD,
    // leaves (healthy)
    l: palette.leaf, L: palette.leafL,
    // ground (when no pot)
    g: palette.leafD,
    // dead
    X: palette.dead,
    // seed
    b: palette.soil,
    // sparkle
    '*': palette.coin,
    // flower
    F: flowerCols.F, f: flowerCols.f, h: flowerCols.h,
  };
  const grid = buildPlantGrid({ type, stage, palette, withPot }).map(row => row.join(''));
  return <PixelSprite grid={grid} palette={charMap} scale={scale} style={style} />;
}

// ─── Misc pixel art: coin, xp, sun, moon, watering can, seed packet, heart
const COIN_GRID = [
  '..yyyy..',
  '.yYYYYy.',
  'yYYffYYy',
  'yYYffYYy',
  'yYYffYYy',
  'yYYYYYYy',
  '.yYYYYy.',
  '..yyyy..',
];
function CoinIcon({ palette, scale = 3, style }) {
  return <PixelSprite scale={scale} style={style} grid={COIN_GRID} palette={{
    y: palette.coinDark, Y: palette.coin, f: '#fff7c8',
  }} />;
}

const XP_GRID = [
  '....x....',
  '...xXx...',
  '..xXXXx..',
  'xXXXXXXXx',
  '.xXXXXXx.',
  '..xX.Xx..',
  '.xX...Xx.',
  'xX.....Xx',
];
function XPIcon({ palette, scale = 3, style }) {
  return <PixelSprite scale={scale} style={style} grid={XP_GRID} palette={{
    x: palette.coinDark, X: palette.accentB,
  }} />;
}

const HEART_GRID = [
  '.rr..rr.',
  'rRRrrRRr',
  'rRRRRRRr',
  'rRRRRRRr',
  '.rRRRRr.',
  '..rRRr..',
  '...rr...',
];
function HeartIcon({ palette, color, scale = 3, style }) {
  return <PixelSprite scale={scale} style={style} grid={HEART_GRID} palette={{
    r: '#7a1a2a', R: color || palette.accent,
  }} />;
}

const SUN_GRID = [
  '....y....',
  '..y.y.y..',
  '...yyy...',
  '.yyyYYyyy.',
  'y.yYYYYy.y',
  'y.yYYYYy.y',
  '.yyyYYyyy.',
  '...yyy...',
  '..y.y.y..',
  '....y....',
];
function SunIcon({ palette, scale = 3, style }) {
  return <PixelSprite scale={scale} style={style} grid={SUN_GRID} palette={{
    y: palette.sun, Y: '#fff7c8',
  }} />;
}

const MOON_GRID = [
  '...mmmm..',
  '..mMMMmm.',
  '.mMMMMMmm',
  'mMMMMMmmm',
  'mMMMMMmm.',
  'mMMMMMmm.',
  '.mMMMMmm.',
  '..mMMmm..',
  '...mmm...',
];
function MoonIcon({ palette, scale = 3, style }) {
  return <PixelSprite scale={scale} style={style} grid={MOON_GRID} palette={{
    m: palette.inkSoft, M: palette.moon,
  }} />;
}

const WATERING_CAN = [
  '.....bbbbb..',
  '....bBBBBBb.',
  '...bBBBBBBb.',
  'bbbBBBBBBBBb',
  'bBBBBBBBBBBb',
  'bBBBBBBBBBb.',
  '.bbbbbbbbb..',
];
function WateringCan({ palette, scale = 3, style }) {
  return <PixelSprite scale={scale} style={style} grid={WATERING_CAN} palette={{
    b: palette.line, B: palette.accentB,
  }} />;
}

const SEED_PACKET = [
  'ggggggggg',
  'gGGGGGGGg',
  'gG.....Gg',
  'gG.sss.Gg',
  'gG.sss.Gg',
  'gG.....Gg',
  'gGGGGGGGg',
  'ggggggggg',
];
function SeedPacket({ palette, scale = 3, accent, style }) {
  return <PixelSprite scale={scale} style={style} grid={SEED_PACKET} palette={{
    g: palette.line, G: palette.bgPanel, s: accent || palette.accent,
  }} />;
}

const STAR_GRID = [
  '....s....',
  '...sSs...',
  '...sSs...',
  'sssSSSsss',
  '.sSSSSSs.',
  '..sSSSs..',
  '.sS.S.Ss.',
  's.s...s.s',
];
function StarIcon({ palette, scale = 2, style, color }) {
  return <PixelSprite scale={scale} style={style} grid={STAR_GRID} palette={{
    s: palette.coinDark, S: color || palette.star,
  }} />;
}

// Tab bar pixel icons (10×10)
const TAB_ICONS = {
  greenhouse: [
    '...gggg...',
    '..gGGGGg..',
    '.gGGGGGGg.',
    'gGgGGGgGg.',
    'wwwwwwwww.',
    'wbwbwbwbw.',
    'wbwbwbwbw.',
    'wwwwwwwww.',
    '..........',
    '..........',
  ],
  tasks: [
    'bbbbbbbbb.',
    'b.......b.',
    'b.cc....b.',
    'b.cc.LL.b.',
    'b....LL.b.',
    'b.cc....b.',
    'b.cc.LL.b.',
    'b....LL.b.',
    'b.......b.',
    'bbbbbbbbb.',
  ],
  shop: [
    '..bbbbb...',
    '.b.....b..',
    '.b.....b..',
    'bbbbbbbbb.',
    'b.......b.',
    'b.cc.cc.b.',
    'b.......b.',
    'b.cc.cc.b.',
    'b.......b.',
    'bbbbbbbbb.',
  ],
  stats: [
    '..........',
    '.........b',
    '......c..b',
    '......c..b',
    '...c..c..b',
    '...c..c..b',
    '.c.c..c..b',
    '.c.c..c..b',
    '.c.c..c..b',
    'bbbbbbbbbb',
  ],
  profile: [
    '...ccc....',
    '..cCCCc...',
    '..cCCCc...',
    '...ccc....',
    '..cccccc..',
    '.cCCCCCCc.',
    '.cCCCCCCc.',
    'cCCCCCCCCc',
    'cCCCCCCCCc',
    'cccccccccc',
  ],
};

function TabIcon({ name, active, palette, scale = 3, style }) {
  const base = active ? palette.accent : palette.inkSoft;
  const hi = active ? palette.accentB : palette.line;
  return (
    <PixelSprite scale={scale} style={style} grid={TAB_ICONS[name]} palette={{
      b: base, B: base, c: base, C: hi, g: base, G: hi, w: base, L: hi,
    }} />
  );
}

// Pixel font helper for plus-coin float-ups, etc — built into the components
// that need them. Not exported.

// Pixel-style button (chunky border + bottom shadow line)
function PixelButton({ children, onClick, palette, color, fg, style = {}, disabled, size = 'md' }) {
  const padY = size === 'sm' ? 6 : size === 'lg' ? 14 : 10;
  const padX = size === 'sm' ? 10 : size === 'lg' ? 22 : 16;
  const fs = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
  const bg = disabled ? palette.inkSoft : (color || palette.accent);
  const shadow = disabled ? palette.line : (color ? color : palette.accent);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        appearance: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: `${padY}px ${padX}px`,
        background: bg,
        color: fg || '#fff',
        fontFamily: 'Pixelify Sans, monospace',
        fontWeight: 600, fontSize: fs, letterSpacing: 0.5,
        boxShadow: `inset -3px -3px 0 0 ${shadow}99, inset 3px 3px 0 0 #ffffff44, 0 4px 0 0 ${palette.ink}`,
        transition: 'transform .08s, box-shadow .08s',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      onPointerDown={(e) => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = `inset -3px -3px 0 0 ${shadow}99, inset 3px 3px 0 0 #ffffff44, 0 2px 0 0 ${palette.ink}`; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `inset -3px -3px 0 0 ${shadow}99, inset 3px 3px 0 0 #ffffff44, 0 4px 0 0 ${palette.ink}`; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `inset -3px -3px 0 0 ${shadow}99, inset 3px 3px 0 0 #ffffff44, 0 4px 0 0 ${palette.ink}`; }}
    >
      {children}
    </button>
  );
}

// Chunky pixel border box
function PixelPanel({ children, palette, color, style = {}, pad = 12 }) {
  const bg = color || palette.bgPanel;
  return (
    <div style={{
      background: bg,
      padding: pad,
      boxShadow: `inset -3px -3px 0 0 ${palette.line}55, inset 3px 3px 0 0 #ffffff88, 0 3px 0 0 ${palette.ink}`,
      border: `2px solid ${palette.ink}`,
      ...style,
    }}>{children}</div>
  );
}

Object.assign(window, {
  PIXEL_PALETTES, PLANT_TYPES, PixelSprite, Plant,
  CoinIcon, XPIcon, HeartIcon, SunIcon, MoonIcon,
  WateringCan, SeedPacket, StarIcon, TabIcon,
  PixelButton, PixelPanel,
  buildPlantGrid, resolveFlowerColors,
});
