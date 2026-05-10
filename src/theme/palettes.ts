// Pixel palettes ported from greenhouse-prototype-design/project/pixel-art.jsx.
// Three palettes drive the entire app's color story; user picks one in Profile.
// Plant sprites resolve color refs ('leaf' / 'accent' / 'sun' / etc.) against
// the active palette so a single sprite definition adapts to any theme.

export type PaletteKey = "terracotta" | "twilight" | "pastel";

export type Palette = {
  name: string;
  bgSky: string;
  bgFloor: string;
  bgWall: string;
  bgPanel: string;
  bgPanel2: string;
  ink: string;
  inkSoft: string;
  line: string;
  accent: string;
  accentB: string;
  coin: string;
  coinDark: string;
  leafD: string;
  leaf: string;
  leafL: string;
  leafX: string;
  stem: string;
  stemL: string;
  soil: string;
  soilL: string;
  pot: string;
  potL: string;
  potD: string;
  sky: string;
  sun: string;
  moon: string;
  star: string;
  night1: string;
  night2: string;
  nightTint: string;
  wilt: string;
  wiltD: string;
  dead: string;
  deadL: string;
  glass: string;
  glassBorder: string;
};

export const PIXEL_PALETTES: Record<PaletteKey, Palette> = {
  terracotta: {
    name: "Terracotta Greenhouse",
    bgSky: "#f4e4c8",
    bgFloor: "#d9b88f",
    bgWall: "#e9c9a3",
    bgPanel: "#fff5e2",
    bgPanel2: "#f3dfb6",
    ink: "#3a2418",
    inkSoft: "#6b4a36",
    line: "#8a5a3c",
    accent: "#c84a2e",
    accentB: "#e98a3e",
    coin: "#f6c247",
    coinDark: "#b8821b",
    leafD: "#2e5e2a",
    leaf: "#4a8f3a",
    leafL: "#7fc850",
    leafX: "#b9e87a",
    stem: "#3d6a2a",
    stemL: "#6ba53a",
    soil: "#5a3320",
    soilL: "#7a4a2c",
    pot: "#a6532a",
    potL: "#c8703f",
    potD: "#7a3a18",
    sky: "#88c4e8",
    sun: "#ffd56a",
    moon: "#e8e0c8",
    star: "#fff2b8",
    night1: "#1d1830",
    night2: "#2c244a",
    nightTint: "#3a2c5a",
    wilt: "#9a7a3a",
    wiltD: "#6a4a1a",
    dead: "#5a4a3a",
    deadL: "#8a7a6a",
    glass: "rgba(255,245,220,0.92)",
    glassBorder: "#8a5a3c",
  },
  twilight: {
    name: "Twilight Conservatory",
    bgSky: "#1f1a3d",
    bgFloor: "#3a2a52",
    bgWall: "#2c2348",
    bgPanel: "#27224a",
    bgPanel2: "#3a3266",
    ink: "#f4ecff",
    inkSoft: "#bba8d8",
    line: "#7a5fb2",
    accent: "#ff6ea8",
    accentB: "#ffd56a",
    coin: "#ffd14a",
    coinDark: "#a87410",
    leafD: "#1a4a3a",
    leaf: "#2e8a6a",
    leafL: "#4fd2a0",
    leafX: "#9fffd8",
    stem: "#2a6a4a",
    stemL: "#4fb286",
    soil: "#2a1838",
    soilL: "#3e2a52",
    pot: "#5a3a8a",
    potL: "#7e58b8",
    potD: "#3a205a",
    sky: "#1f1a3d",
    sun: "#ffe07a",
    moon: "#f4ecff",
    star: "#fff2b8",
    night1: "#0c0a1c",
    night2: "#1d1830",
    nightTint: "#2c244a",
    wilt: "#a87a4a",
    wiltD: "#5a3a2a",
    dead: "#3a2c4a",
    deadL: "#6a5a7a",
    glass: "rgba(40,30,70,0.85)",
    glassBorder: "#7a5fb2",
  },
  pastel: {
    name: "Pastel Garden",
    bgSky: "#e6f6ff",
    bgFloor: "#ffd9c2",
    bgWall: "#fff0e0",
    bgPanel: "#fffaf2",
    bgPanel2: "#ffe6d2",
    ink: "#3a2c4a",
    inkSoft: "#7a6a8a",
    line: "#c8a2a8",
    accent: "#ff8aa8",
    accentB: "#a0d8ff",
    coin: "#ffd66e",
    coinDark: "#b88a1a",
    leafD: "#5fa04a",
    leaf: "#8acf6e",
    leafL: "#bfe89a",
    leafX: "#dff5c8",
    stem: "#6ab84a",
    stemL: "#9fdc78",
    soil: "#8a6a4a",
    soilL: "#a88662",
    pot: "#ffb088",
    potL: "#ffd2b0",
    potD: "#c87a52",
    sky: "#e6f6ff",
    sun: "#ffe48a",
    moon: "#fffaf0",
    star: "#fff8c8",
    night1: "#2a2848",
    night2: "#3c3868",
    nightTint: "#4a4280",
    wilt: "#c8a85a",
    wiltD: "#8a6a2a",
    dead: "#a89aa8",
    deadL: "#c8bcc8",
    glass: "rgba(255,250,242,0.92)",
    glassBorder: "#c8a2a8",
  },
};

export const DEFAULT_PALETTE: PaletteKey = "terracotta";
