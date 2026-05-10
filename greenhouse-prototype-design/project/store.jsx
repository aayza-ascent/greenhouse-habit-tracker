// store.jsx — global app state for the Greenhouse prototype.
// Uses React.useReducer + Context so every screen reads the same coins,
// tasks, plants, palette, time-of-day, grid size.

const StoreCtx = React.createContext(null);

const STAGE_ORDER = ['seed', 'sprout', 'growing', 'flowering', 'thriving'];
function nextStage(s) {
  const i = STAGE_ORDER.indexOf(s);
  return i < 0 || i === STAGE_ORDER.length - 1 ? s : STAGE_ORDER[i + 1];
}
function stageForHealth(health, prevStage) {
  if (health <= 19) return 'dead';
  if (health <= 49) return 'wilting';
  // otherwise keep their growth stage
  return prevStage === 'dead' || prevStage === 'wilting'
    ? (health >= 70 ? 'flowering' : 'sprout')
    : prevStage;
}

const FREQ_COIN = { daily: 5, dow: 8, weekly: 20, monthly: 70 };
const FREQ_XP   = { daily: 10, dow: 12, weekly: 30, monthly: 80 };

const TASK_ICONS = ['💧', '📚', '🏃', '🧘', '✍️', '🥗', '🛏️', '🦷', '🌱', '🎯', '🎵', '☎️'];
// We use emoji ONLY in this label position (text emoji on the user's task);
// per the spec, plants themselves are pixel art.

const INITIAL = {
  // ── meta ──
  paletteKey: 'terracotta',
  timeOfDay: 'day', // 'day' | 'dusk' | 'night'
  gridCols: 6,
  gridRows: 4,
  onboarded: true,
  // ── economy ──
  coins: 240,
  xp: 380,
  level: 4,
  streak: 7,
  // ── tasks ── id, name, icon, freq, streak, lastDoneISO, doneToday, plantId
  tasks: [
    { id: 't1', name: 'Drink 8 cups water', icon: '💧', freq: 'daily', streak: 12, doneToday: true,  plantId: 'p1' },
    { id: 't2', name: 'Morning stretch',    icon: '🧘', freq: 'daily', streak: 8,  doneToday: true,  plantId: 'p2' },
    { id: 't3', name: 'Read 30 minutes',    icon: '📚', freq: 'daily', streak: 5,  doneToday: false, plantId: 'p3' },
    { id: 't4', name: 'Run 3 km',           icon: '🏃', freq: 'dow',   streak: 4,  doneToday: false, plantId: 'p4', dows: [1,3,5] },
    { id: 't5', name: 'Practice guitar',    icon: '🎵', freq: 'daily', streak: 21, doneToday: false, plantId: 'p5' },
    { id: 't6', name: 'Journal',            icon: '✍️', freq: 'daily', streak: 3,  doneToday: false, plantId: 'p6' },
    { id: 't7', name: 'Meal prep',          icon: '🥗', freq: 'weekly',streak: 6,  doneToday: false, plantId: 'p7' },
    { id: 't8', name: 'Pay rent',           icon: '🏠', freq: 'monthly',streak: 11, doneToday: false, plantId: 'p8' },
    { id: 't9', name: 'Floss',              icon: '🦷', freq: 'daily', streak: 1,  doneToday: false, plantId: 'p9' },
  ],
  // ── plants ── id, type, slot {col,row}, health(0-100), stage, taskId
  plants: [
    { id: 'p1', type: 'basil',      slot: { col: 0, row: 0 }, health: 92, stage: 'thriving',  taskId: 't1' },
    { id: 'p2', type: 'tulip',      slot: { col: 1, row: 0 }, health: 84, stage: 'flowering', taskId: 't2' },
    { id: 'p3', type: 'fern',       slot: { col: 2, row: 0 }, health: 62, stage: 'growing',   taskId: 't3' },
    { id: 'p4', type: 'sunflower',  slot: { col: 4, row: 0 }, health: 71, stage: 'flowering', taskId: 't4' },
    { id: 'p5', type: 'lavender',   slot: { col: 5, row: 0 }, health: 96, stage: 'thriving',  taskId: 't5' },
    { id: 'p6', type: 'daisy',      slot: { col: 0, row: 1 }, health: 55, stage: 'growing',   taskId: 't6' },
    { id: 'p7', type: 'tomato',     slot: { col: 2, row: 1 }, health: 78, stage: 'flowering', taskId: 't7' },
    { id: 'p8', type: 'cactus',     slot: { col: 3, row: 1 }, health: 88, stage: 'thriving',  taskId: 't8' },
    { id: 'p9', type: 'mushroom',   slot: { col: 5, row: 1 }, health: 32, stage: 'wilting',   taskId: 't9' },
    // unowned slots in greenhouse can remain empty
  ],
  // ── shop inventory keyed by plant type ──
  shopOwned: ['basil', 'tulip', 'fern', 'sunflower', 'lavender', 'daisy', 'tomato', 'cactus', 'mushroom'],
  // ── celebration queue ──
  celebrate: null, // { taskId, coin, xp, plantId, oldStage, newStage }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PALETTE':   return { ...state, paletteKey: action.key };
    case 'SET_TIME':      return { ...state, timeOfDay: action.value };
    case 'SET_GRID':      return { ...state, gridCols: action.cols, gridRows: action.rows };
    case 'PATCH':         return { ...state, ...action.patch };

    case 'COMPLETE_TASK': {
      const t = state.tasks.find(x => x.id === action.id);
      if (!t || t.doneToday) return state;
      const coin = FREQ_COIN[t.freq] * (t.streak >= 30 ? 3 : t.streak >= 7 ? 2 : 1);
      const xp = FREQ_XP[t.freq] * (t.streak >= 7 ? 2 : 1);
      const tasks = state.tasks.map(x =>
        x.id === t.id ? { ...x, doneToday: true, streak: x.streak + 1 } : x);
      // bump linked plant: +health, possibly grow stage
      let plants = state.plants;
      let oldStage = null, newStage = null;
      if (t.plantId) {
        plants = plants.map(p => {
          if (p.id !== t.plantId) return p;
          const newHealth = Math.min(100, p.health + 12);
          oldStage = p.stage;
          let stage = p.stage;
          if (newHealth >= 70 && (p.stage === 'sprout' || p.stage === 'growing'))
            stage = nextStage(p.stage);
          else if (newHealth >= 50 && p.stage === 'wilting') stage = 'growing';
          else if (newHealth >= 90 && p.stage === 'flowering') stage = 'thriving';
          newStage = stage;
          return { ...p, health: newHealth, stage };
        });
      }
      return {
        ...state,
        tasks, plants,
        coins: state.coins + coin,
        xp: state.xp + xp,
        celebrate: { taskId: t.id, coin, xp, plantId: t.plantId, oldStage, newStage },
      };
    }
    case 'UNCOMPLETE_TASK': {
      const t = state.tasks.find(x => x.id === action.id);
      if (!t || !t.doneToday) return state;
      return {
        ...state,
        tasks: state.tasks.map(x => x.id === t.id ? { ...x, doneToday: false, streak: Math.max(0, x.streak - 1) } : x),
      };
    }
    case 'CLEAR_CELEBRATE': return { ...state, celebrate: null };

    case 'ADD_TASK': {
      const id = 't' + (Date.now() % 100000);
      const plantId = action.plant ? 'p' + (Date.now() % 100000) : null;
      const tasks = [...state.tasks, { ...action.task, id, streak: 0, doneToday: false, plantId }];
      let plants = state.plants;
      if (plantId && action.plant) {
        // first empty slot
        const occupied = new Set(state.plants.map(p => `${p.slot.col},${p.slot.row}`));
        let slot = null;
        for (let r = 0; r < state.gridRows && !slot; r++) {
          for (let c = 0; c < state.gridCols && !slot; c++) {
            if (!occupied.has(`${c},${r}`)) slot = { col: c, row: r };
          }
        }
        if (slot) plants = [...plants, { id: plantId, type: action.plant, slot, health: 50, stage: 'sprout', taskId: id }];
      }
      return { ...state, tasks, plants };
    }

    case 'MOVE_PLANT': {
      // swap if dest occupied
      const a = state.plants.find(p => p.id === action.id);
      if (!a) return state;
      const b = state.plants.find(p => p.slot.col === action.col && p.slot.row === action.row && p.id !== action.id);
      const plants = state.plants.map(p => {
        if (p.id === a.id) return { ...p, slot: { col: action.col, row: action.row } };
        if (b && p.id === b.id) return { ...p, slot: a.slot };
        return p;
      });
      return { ...state, plants };
    }

    case 'BUY_PLANT': {
      const t = window.PLANT_TYPES[action.plantType];
      if (!t || state.coins < t.price) return state;
      // place in first empty slot
      const occupied = new Set(state.plants.map(p => `${p.slot.col},${p.slot.row}`));
      let slot = null;
      for (let r = 0; r < state.gridRows && !slot; r++) {
        for (let c = 0; c < state.gridCols && !slot; c++) {
          if (!occupied.has(`${c},${r}`)) slot = { col: c, row: r };
        }
      }
      if (!slot) return state;
      const id = 'p' + (Date.now() % 100000);
      return {
        ...state,
        coins: state.coins - t.price,
        plants: [...state.plants, { id, type: action.plantType, slot, health: 50, stage: 'sprout', taskId: null }],
        shopOwned: state.shopOwned.includes(action.plantType) ? state.shopOwned : [...state.shopOwned, action.plantType],
      };
    }

    case 'DEMO_DECAY': {
      // drop everyone's health by ~22 to demo wilting / death cycle
      const plants = state.plants.map(p => {
        const h = Math.max(0, p.health - 22);
        let stage = p.stage;
        if (h <= 19) stage = 'dead';
        else if (h <= 49) stage = 'wilting';
        return { ...p, health: h, stage };
      });
      const tasks = state.tasks.map(t => ({ ...t, doneToday: false }));
      return { ...state, plants, tasks };
    }

    case 'DEMO_RESET':
      return { ...INITIAL, paletteKey: state.paletteKey, timeOfDay: state.timeOfDay, gridCols: state.gridCols, gridRows: state.gridRows };

    case 'REVIVE': {
      if (state.coins < 25) return state;
      return {
        ...state,
        coins: state.coins - 25,
        plants: state.plants.map(p => p.id === action.id ? { ...p, health: 50, stage: 'sprout' } : p),
      };
    }

    default: return state;
  }
}

function StoreProvider({ children }) {
  const [state, dispatch] = React.useReducer(reducer, INITIAL);
  const palette = window.PIXEL_PALETTES[state.paletteKey];
  const value = React.useMemo(() => ({ state, dispatch, palette }), [state, palette]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
function useStore() { return React.useContext(StoreCtx); }

Object.assign(window, { StoreProvider, useStore, StoreCtx, TASK_ICONS, FREQ_COIN, FREQ_XP });
