// screens.jsx — all in-app screens for the Greenhouse prototype.
// Each screen is a component that takes the live store + dispatch.
// Bundled in one file because they share heavy imports & helpers.

const { useStore } = window;
const sx = (...a) => Object.assign({}, ...a);

// ─── Pixel scene helpers ─────────────────────────────────────────────
function GreenhouseSky({ palette, time, height = 110 }) {
  const day = time === 'day';
  const dusk = time === 'dusk';
  const skyTop = day ? palette.sky : dusk ? '#f0a868' : palette.night1;
  const skyMid = day ? '#bce4f5' : dusk ? '#e87a4a' : palette.night2;
  const skyBot = day ? '#dff0e0' : dusk ? '#5a3a6a' : palette.nightTint;
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${skyTop}, ${skyMid} 60%, ${skyBot})` }} />
      {/* glass roof crossbeams */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage:
        `repeating-linear-gradient(90deg, transparent 0 38px, ${palette.line}33 38px 40px),
         repeating-linear-gradient(0deg, transparent 0 24px, ${palette.line}22 24px 26px)`,
        opacity: 0.7,
      }} />
      {/* sun / moon */}
      <div style={{ position: 'absolute', top: 14, right: 22 }}>
        {time === 'night'
          ? <window.MoonIcon palette={palette} scale={3} />
          : <window.SunIcon palette={palette} scale={3} />}
      </div>
      {time === 'night' && [
        [50, 22, 1.4], [110, 16, 1], [180, 30, 1.2], [240, 18, 1], [300, 36, 1.4], [60, 50, 1.1], [320, 60, 1],
      ].map(([x, y, s], i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y, opacity: 0.9 }}>
          <window.StarIcon palette={palette} scale={s} />
        </div>
      ))}
      {/* fireflies on dusk */}
      {dusk && [[80, 50], [200, 70], [280, 60]].map(([x, y], i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y, width: 4, height: 4, background: palette.coin, boxShadow: `0 0 8px ${palette.coin}`, borderRadius: 1 }} />
      ))}
    </div>
  );
}

// ─── Coin / XP / streak HUD pill ─────────────────────────────────────
function StatPill({ palette, icon, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: palette.bgPanel, border: `2px solid ${palette.ink}`,
      padding: '4px 10px 4px 6px',
      boxShadow: `inset -2px -2px 0 0 ${palette.line}55, 0 2px 0 0 ${palette.ink}`,
    }}>
      {icon}
      <span style={{ fontFamily: 'Silkscreen, monospace', fontSize: 14, color: color || palette.ink, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function HUD({ palette, state, big = false }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <StatPill palette={palette} icon={<window.CoinIcon palette={palette} scale={2} />} value={state.coins} />
      <StatPill palette={palette} icon={<window.XPIcon palette={palette} scale={2} />} value={state.xp} color={palette.accentB} />
      <StatPill palette={palette} icon={<span style={{ fontSize: 14 }}>🔥</span>} value={state.streak} color={palette.accent} />
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────
function TabBar({ palette, current, onChange }) {
  const tabs = [
    { id: 'greenhouse', label: 'Greenhouse' },
    { id: 'tasks',      label: 'Tasks' },
    { id: 'shop',       label: 'Shop' },
    { id: 'stats',      label: 'Stats' },
    { id: 'profile',    label: 'You' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '6px 6px 12px', background: palette.bgPanel,
      borderTop: `2px solid ${palette.ink}`,
      boxShadow: `inset 0 3px 0 0 ${palette.line}55`,
    }}>
      {tabs.map(t => {
        const active = current === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            appearance: 'none', border: 'none', background: 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '4px 2px', cursor: 'pointer', minWidth: 56,
            color: active ? palette.accent : palette.inkSoft,
            fontFamily: 'Pixelify Sans, monospace', fontSize: 11, fontWeight: 600,
          }}>
            <window.TabIcon name={t.id} active={active} palette={palette} scale={2} />
            <span style={{ marginTop: 2, letterSpacing: 0.3 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Onboarding ──────────────────────────────────────────────────────
function OnboardingScreen({ palette, onContinue }) {
  const [step, setStep] = React.useState(0);
  const choices = ['basil', 'tulip', 'sunflower'];
  const [picked, setPicked] = React.useState(null);
  const slides = [
    {
      title: 'Welcome to your\nGreenhouse',
      body: 'Tend tasks. Grow plants.\nMiss days, watch them wilt.',
    },
    {
      title: 'Pick your\nfirst seed',
      body: 'Each task you complete\nfeeds its plant.',
    },
    {
      title: 'Your first task',
      body: 'Pick something small.\nDo it daily.',
    },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: palette.bgPanel, paddingTop: 60 }}>
      {/* greenhouse vignette */}
      <div style={{ position: 'relative', height: 180, marginTop: -10 }}>
        <GreenhouseSky palette={palette} time="day" height={180} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: palette.bgFloor }} />
        <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%) scale(1.2)', transformOrigin: 'bottom' }}>
          <window.Plant type={picked || choices[step % 3]} stage={step === 0 ? 'sprout' : 'flowering'} palette={palette} scale={5} />
        </div>
      </div>

      <div style={{ padding: '32px 28px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 26, color: palette.ink, lineHeight: 1.2, whiteSpace: 'pre-line', textShadow: `2px 2px 0 ${palette.line}33` }}>
          {slides[step].title}
        </div>
        <div style={{ fontFamily: 'Pixelify Sans, monospace', fontSize: 16, color: palette.inkSoft, marginTop: 10, whiteSpace: 'pre-line', lineHeight: 1.4 }}>
          {slides[step].body}
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'center' }}>
            {choices.map(t => (
              <button key={t} onClick={() => setPicked(t)} style={{
                background: picked === t ? palette.bgPanel2 : palette.bgPanel,
                border: `2px solid ${picked === t ? palette.accent : palette.ink}`,
                padding: 8, cursor: 'pointer',
                boxShadow: picked === t ? `0 3px 0 0 ${palette.accent}` : `0 3px 0 0 ${palette.ink}`,
              }}>
                <window.Plant type={t} stage="flowering" palette={palette} scale={3} />
                <div style={{ fontFamily: 'Pixelify Sans', fontSize: 12, color: palette.ink, marginTop: 4 }}>{window.PLANT_TYPES[t].name}</div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ marginTop: 18 }}>
            <window.PixelPanel palette={palette} pad={14}>
              <div style={{ fontFamily: 'Pixelify Sans', fontSize: 13, color: palette.inkSoft, marginBottom: 4 }}>SUGGESTED</div>
              <div style={{ fontFamily: 'Pixelify Sans', fontSize: 18, color: palette.ink, fontWeight: 600 }}>💧 Drink 8 cups water</div>
              <div style={{ fontFamily: 'Pixelify Sans', fontSize: 13, color: palette.inkSoft, marginTop: 4 }}>Daily · +5🪙 +10 XP</div>
            </window.PixelPanel>
          </div>
        )}

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 8, height: 8, background: i === step ? palette.accent : palette.line, opacity: i === step ? 1 : 0.4 }} />
          ))}
        </div>
        <window.PixelButton palette={palette} onClick={() => step < 2 ? setStep(step + 1) : onContinue()} style={{ width: '100%' }}>
          {step < 2 ? 'NEXT' : "LET'S GROW →"}
        </window.PixelButton>
      </div>
    </div>
  );
}

// ─── Greenhouse hero ─────────────────────────────────────────────────
function GreenhouseScreen({ palette, onTab, onPlantTap }) {
  const { state, dispatch } = useStore();
  const slotW = 50, slotH = 64;
  const cols = state.gridCols, rows = state.gridRows;
  const [draggingId, setDraggingId] = React.useState(null);
  const [hoverSlot, setHoverSlot] = React.useState(null);
  const [tipPlant, setTipPlant] = React.useState(null);
  const gridRef = React.useRef(null);

  const occupied = new Map(state.plants.map(p => [`${p.slot.col},${p.slot.row}`, p]));

  const onPointerDown = (e, plant) => {
    e.stopPropagation();
    setDraggingId(plant.id);
    setHoverSlot({ col: plant.slot.col, row: plant.slot.row });
    const move = (ev) => {
      const r = gridRef.current.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      const col = Math.max(0, Math.min(cols - 1, Math.floor(x / slotW)));
      const row = Math.max(0, Math.min(rows - 1, Math.floor(y / slotH)));
      setHoverSlot({ col, row });
    };
    const up = (ev) => {
      const r = gridRef.current.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      const col = Math.max(0, Math.min(cols - 1, Math.floor(x / slotW)));
      const row = Math.max(0, Math.min(rows - 1, Math.floor(y / slotH)));
      if (col !== plant.slot.col || row !== plant.slot.row) {
        dispatch({ type: 'MOVE_PLANT', id: plant.id, col, row });
      } else {
        // tap (no drag)
        setTipPlant(plant);
      }
      setDraggingId(null); setHoverSlot(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const sceneBg = state.timeOfDay === 'night'
    ? `linear-gradient(${palette.night2}, ${palette.nightTint})`
    : state.timeOfDay === 'dusk'
      ? `linear-gradient(#e8a070, ${palette.bgFloor})`
      : `linear-gradient(${palette.bgWall}, ${palette.bgFloor})`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: sceneBg, position: 'relative', overflow: 'hidden' }}>
      <GreenhouseSky palette={palette} time={state.timeOfDay} height={130} />

      {/* HUD */}
      <div style={{ position: 'relative', zIndex: 5, padding: '14px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 18, color: palette.ink, textShadow: `2px 2px 0 ${palette.bgPanel}88` }}>
            MY GREENHOUSE
          </div>
          <div style={{ fontFamily: 'Pixelify Sans, monospace', fontSize: 12, color: palette.inkSoft, marginTop: 2 }}>
            Lv.{state.level} · {state.plants.length} plants
          </div>
        </div>
        <HUD palette={palette} state={state} />
      </div>

      {/* greenhouse floor + grid */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {/* floor planks */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background:
          `repeating-linear-gradient(90deg, ${palette.bgFloor} 0 38px, ${palette.bgFloor}cc 38px 40px),
           linear-gradient(${palette.bgFloor}, ${palette.soilL})`,
          borderTop: `3px solid ${palette.line}`,
        }} />

        <div ref={gridRef} style={{
          position: 'relative',
          width: cols * slotW, height: rows * slotH,
          marginBottom: 22,
          touchAction: 'none',
        }}>
          {/* slot tiles */}
          {Array.from({ length: rows * cols }).map((_, i) => {
            const col = i % cols, row = Math.floor(i / cols);
            const isHover = draggingId && hoverSlot && hoverSlot.col === col && hoverSlot.row === row;
            const empty = !occupied.has(`${col},${row}`);
            return (
              <div key={i} style={{
                position: 'absolute',
                left: col * slotW, top: row * slotH,
                width: slotW - 2, height: slotH - 2,
                border: `2px dashed ${empty ? palette.line + '80' : 'transparent'}`,
                background: isHover ? palette.coin + '55' : (empty ? palette.bgPanel + '33' : 'transparent'),
                boxSizing: 'border-box',
              }} />
            );
          })}
          {/* plants */}
          {state.plants.map(p => {
            const isDrag = draggingId === p.id;
            const c = isDrag && hoverSlot ? hoverSlot.col : p.slot.col;
            const r = isDrag && hoverSlot ? hoverSlot.row : p.slot.row;
            return (
              <div key={p.id}
                onPointerDown={(e) => onPointerDown(e, p)}
                style={{
                  position: 'absolute',
                  left: c * slotW + slotW/2, top: r * slotH + slotH,
                  transform: `translate(-50%, -100%) ${isDrag ? 'scale(1.15)' : ''}`,
                  transition: isDrag ? 'none' : 'left .2s, top .2s',
                  cursor: 'grab',
                  filter: isDrag ? 'drop-shadow(0 6px 0 rgba(0,0,0,0.3))' : '',
                  zIndex: isDrag ? 10 : 1,
                }}>
                <window.Plant type={p.type} stage={p.stage} palette={palette} scale={3} />
                {/* tiny health pip */}
                <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 24, height: 4, background: palette.ink + '44', boxSizing: 'border-box' }}>
                  <div style={{ width: `${p.health}%`, height: '100%', background: p.health > 70 ? palette.leafL : p.health > 49 ? palette.coin : palette.accent }} />
                </div>
              </div>
            );
          })}

          {/* empty-slot ghosts */}
          {Array.from({ length: rows * cols }).map((_, i) => {
            const col = i % cols, row = Math.floor(i / cols);
            if (occupied.has(`${col},${row}`)) return null;
            return (
              <div key={'g' + i} onClick={() => onTab && onTab('shop')} style={{
                position: 'absolute', left: col * slotW + slotW/2, top: row * slotH + slotH/2,
                transform: 'translate(-50%, -50%)',
                fontFamily: 'Silkscreen, monospace', fontSize: 18, color: palette.line, opacity: 0.5,
                cursor: 'pointer',
              }}>+</div>
            );
          })}
        </div>
      </div>

      {/* plant info popup */}
      {tipPlant && (() => {
        const linked = state.tasks.find(t => t.id === tipPlant.taskId);
        return (
          <div onClick={() => setTipPlant(null)} style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: '#00000077',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 96,
          }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 320 }}>
              <window.PixelPanel palette={palette} pad={16}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <window.Plant type={tipPlant.type} stage={tipPlant.stage} palette={palette} scale={3} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 16, color: palette.ink }}>{window.PLANT_TYPES[tipPlant.type].name}</div>
                    <div style={{ fontFamily: 'Pixelify Sans', fontSize: 12, color: palette.inkSoft, textTransform: 'uppercase' }}>{tipPlant.stage}</div>
                    <div style={{ marginTop: 6, height: 6, background: palette.line + '55' }}>
                      <div style={{ width: `${tipPlant.health}%`, height: '100%', background: tipPlant.health > 70 ? palette.leafL : tipPlant.health > 49 ? palette.coin : palette.accent }} />
                    </div>
                    <div style={{ fontFamily: 'Pixelify Sans', fontSize: 11, color: palette.inkSoft, marginTop: 2 }}>{tipPlant.health}/100 health</div>
                  </div>
                </div>
                {linked && (
                  <div style={{ marginTop: 12, padding: 10, background: palette.bgPanel2, border: `2px dashed ${palette.line}` }}>
                    <div style={{ fontFamily: 'Pixelify Sans', fontSize: 11, color: palette.inkSoft, textTransform: 'uppercase' }}>FED BY</div>
                    <div style={{ fontFamily: 'Pixelify Sans', fontSize: 16, color: palette.ink }}>{linked.icon} {linked.name}</div>
                    <div style={{ fontFamily: 'Pixelify Sans', fontSize: 12, color: palette.inkSoft }}>🔥 {linked.streak}-day streak</div>
                  </div>
                )}
                {tipPlant.stage === 'dead' && (
                  <window.PixelButton palette={palette} style={{ marginTop: 12, width: '100%' }} onClick={() => { dispatch({ type: 'REVIVE', id: tipPlant.id }); setTipPlant(null); }}>
                    REVIVE FOR 25🪙
                  </window.PixelButton>
                )}
              </window.PixelPanel>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Tasks list ──────────────────────────────────────────────────────
function TasksScreen({ palette, onNewTask }) {
  const { state, dispatch } = useStore();
  const groups = [
    { id: 'daily',   label: 'Daily',         tasks: state.tasks.filter(t => t.freq === 'daily') },
    { id: 'dow',     label: 'Mon · Wed · Fri', tasks: state.tasks.filter(t => t.freq === 'dow') },
    { id: 'weekly',  label: 'This Week',     tasks: state.tasks.filter(t => t.freq === 'weekly') },
    { id: 'monthly', label: 'This Month',    tasks: state.tasks.filter(t => t.freq === 'monthly') },
  ].filter(g => g.tasks.length);

  const todayDone = state.tasks.filter(t => t.freq === 'daily' && t.doneToday).length;
  const todayTot  = state.tasks.filter(t => t.freq === 'daily').length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: palette.bgPanel, overflow: 'auto' }}>
      <div style={{ padding: '14px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: palette.bgPanel, zIndex: 5 }}>
        <div>
          <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 18, color: palette.ink }}>TODAY</div>
          <div style={{ fontFamily: 'Pixelify Sans', fontSize: 12, color: palette.inkSoft }}>Friday · May 9</div>
        </div>
        <HUD palette={palette} state={state} />
      </div>
      {/* progress */}
      <div style={{ padding: '0 14px 12px' }}>
        <div style={{ height: 14, background: palette.bgPanel2, border: `2px solid ${palette.ink}`, position: 'relative' }}>
          <div style={{ width: `${(todayDone / Math.max(1, todayTot)) * 100}%`, height: '100%', background: palette.leafL, transition: 'width .35s' }} />
          <div style={{ position: 'absolute', inset: 0, fontFamily: 'Silkscreen, monospace', fontSize: 10, color: palette.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {todayDone}/{todayTot} TODAY
          </div>
        </div>
      </div>

      {groups.map(g => (
        <div key={g.id} style={{ padding: '4px 14px 0' }}>
          <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 12, color: palette.inkSoft, padding: '12px 4px 6px', letterSpacing: 1 }}>
            {g.label.toUpperCase()}
          </div>
          {g.tasks.map(t => {
            const linkedPlant = state.plants.find(p => p.id === t.plantId);
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', marginBottom: 6,
                background: t.doneToday ? palette.bgPanel2 : palette.bgPanel,
                border: `2px solid ${palette.ink}`,
                boxShadow: `0 3px 0 0 ${palette.ink}`,
                opacity: t.doneToday ? 0.65 : 1,
              }}>
                {/* check button */}
                <button onClick={() => dispatch({ type: t.doneToday ? 'UNCOMPLETE_TASK' : 'COMPLETE_TASK', id: t.id })} style={{
                  width: 32, height: 32, border: `2px solid ${palette.ink}`,
                  background: t.doneToday ? palette.leafL : palette.bgPanel,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: t.doneToday ? `inset -2px -2px 0 0 ${palette.leafD}55` : '',
                  color: '#fff', fontFamily: 'Silkscreen', fontSize: 16,
                }}>{t.doneToday ? '✓' : ''}</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Pixelify Sans, monospace', fontSize: 16, color: palette.ink, fontWeight: 600, textDecoration: t.doneToday ? 'line-through' : 'none' }}>
                    <span style={{ marginRight: 6 }}>{t.icon}</span>{t.name}
                  </div>
                  <div style={{ fontFamily: 'Pixelify Sans, monospace', fontSize: 11, color: palette.inkSoft, marginTop: 2, display: 'flex', gap: 8 }}>
                    <span>🔥 {t.streak}d</span>
                    <span>+{window.FREQ_COIN[t.freq]}🪙</span>
                    <span>+{window.FREQ_XP[t.freq]} XP</span>
                  </div>
                </div>
                {linkedPlant && (
                  <div title={window.PLANT_TYPES[linkedPlant.type].name} style={{ flexShrink: 0, opacity: t.doneToday ? 0.6 : 1 }}>
                    <window.Plant type={linkedPlant.type} stage={linkedPlant.stage} palette={palette} scale={2} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ padding: '12px 14px 24px' }}>
        <window.PixelButton palette={palette} color={palette.leafL} onClick={onNewTask} style={{ width: '100%' }}>
          + NEW TASK
        </window.PixelButton>
      </div>
    </div>
  );
}

// ─── New-task creation flow ──────────────────────────────────────────
function NewTaskScreen({ palette, onCancel, onCreated }) {
  const { state, dispatch } = useStore();
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState('🌱');
  const [freq, setFreq] = React.useState('daily');
  const [plant, setPlant] = React.useState('basil');
  const owned = state.shopOwned;

  const create = () => {
    if (!name.trim()) return;
    dispatch({ type: 'ADD_TASK', task: { name: name.trim(), icon, freq }, plant });
    onCreated();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: palette.bgPanel }}>
      <div style={{ padding: '14px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onCancel} style={{ appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Pixelify Sans', fontSize: 14, color: palette.inkSoft }}>✕ Cancel</button>
        <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 16, color: palette.ink }}>NEW TASK</div>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ padding: '12px 16px', overflow: 'auto', flex: 1 }}>
        {/* preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <window.Plant type={plant} stage="sprout" palette={palette} scale={5} />
        </div>

        <FormField label="NAME" palette={palette}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What will you do?" style={{
            width: '100%', appearance: 'none', border: `2px solid ${palette.ink}`, background: palette.bgPanel,
            padding: '10px 12px', fontFamily: 'Pixelify Sans, monospace', fontSize: 16, color: palette.ink, outline: 'none', boxSizing: 'border-box',
            boxShadow: `inset -2px -2px 0 0 ${palette.line}33`,
          }} />
        </FormField>

        <FormField label="ICON" palette={palette}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {window.TASK_ICONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: 38, height: 38, border: `2px solid ${ic === icon ? palette.accent : palette.ink}`,
                background: ic === icon ? palette.bgPanel2 : palette.bgPanel,
                fontSize: 20, cursor: 'pointer',
                boxShadow: ic === icon ? `0 2px 0 0 ${palette.accent}` : `0 2px 0 0 ${palette.ink}`,
              }}>{ic}</button>
            ))}
          </div>
        </FormField>

        <FormField label="FREQUENCY" palette={palette}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['daily','Daily'],['dow','Mon/Wed/Fri'],['weekly','Weekly'],['monthly','Monthly']].map(([id, lbl]) => (
              <button key={id} onClick={() => setFreq(id)} style={{
                appearance: 'none', cursor: 'pointer',
                padding: '10px', border: `2px solid ${freq === id ? palette.accent : palette.ink}`,
                background: freq === id ? palette.bgPanel2 : palette.bgPanel,
                fontFamily: 'Pixelify Sans', fontSize: 14, color: palette.ink,
                boxShadow: freq === id ? `0 2px 0 0 ${palette.accent}` : `0 2px 0 0 ${palette.ink}`,
              }}>{lbl}</button>
            ))}
          </div>
        </FormField>

        <FormField label="LINK TO PLANT" palette={palette}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {owned.map(t => (
              <button key={t} onClick={() => setPlant(t)} style={{
                flex: '0 0 auto', appearance: 'none', cursor: 'pointer',
                padding: 6,
                border: `2px solid ${plant === t ? palette.accent : palette.ink}`,
                background: plant === t ? palette.bgPanel2 : palette.bgPanel,
              }}>
                <window.Plant type={t} stage="flowering" palette={palette} scale={2} />
                <div style={{ fontFamily: 'Pixelify Sans', fontSize: 11, color: palette.ink, textAlign: 'center', marginTop: 2 }}>{window.PLANT_TYPES[t].name}</div>
              </button>
            ))}
          </div>
        </FormField>

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: palette.bgPanel2, border: `2px dashed ${palette.line}` }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          <span style={{ fontFamily: 'Pixelify Sans', fontSize: 13, color: palette.inkSoft, flex: 1 }}>Remind me at <b style={{ color: palette.ink }}>9:00 AM</b></span>
          <div style={{ width: 36, height: 20, background: palette.leafL, position: 'relative', border: `2px solid ${palette.ink}` }}>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 16, background: palette.bgPanel, borderLeft: `2px solid ${palette.ink}` }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 16px 24px', borderTop: `2px solid ${palette.ink}`, background: palette.bgPanel }}>
        <window.PixelButton palette={palette} disabled={!name.trim()} onClick={create} style={{ width: '100%' }}>
          PLANT IT 🌱
        </window.PixelButton>
      </div>
    </div>
  );
}

function FormField({ label, palette, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 11, color: palette.inkSoft, marginBottom: 6, letterSpacing: 1 }}>{label}</div>
      {children}
    </div>
  );
}

// ─── Shop ────────────────────────────────────────────────────────────
function ShopScreen({ palette }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = React.useState('seeds');
  const [purchaseFlash, setFlash] = React.useState(null);
  const all = Object.keys(window.PLANT_TYPES);
  const buy = (t) => {
    dispatch({ type: 'BUY_PLANT', plantType: t });
    setFlash(t);
    setTimeout(() => setFlash(null), 600);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: palette.bgPanel, overflow: 'auto' }}>
      <div style={{ padding: '14px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 18, color: palette.ink }}>SHOP</div>
          <div style={{ fontFamily: 'Pixelify Sans', fontSize: 12, color: palette.inkSoft }}>Spend coins, grow goodness</div>
        </div>
        <HUD palette={palette} state={state} />
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', padding: '0 14px', gap: 6, marginBottom: 8 }}>
        {[['seeds','SEEDS'],['decor','DECOR'],['revive','REVIVE']].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, appearance: 'none', cursor: 'pointer',
            padding: '8px', border: `2px solid ${palette.ink}`,
            background: tab === id ? palette.accent : palette.bgPanel,
            color: tab === id ? '#fff' : palette.ink,
            fontFamily: 'Silkscreen, monospace', fontSize: 12,
            boxShadow: tab === id ? `0 3px 0 0 ${palette.ink}` : `0 3px 0 0 ${palette.line}`,
          }}>{lbl}</button>
        ))}
      </div>

      {tab === 'seeds' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '4px 14px 24px' }}>
          {all.map(t => {
            const T = window.PLANT_TYPES[t];
            const owned = state.shopOwned.includes(t);
            const canBuy = state.coins >= T.price;
            const flash = purchaseFlash === t;
            return (
              <div key={t} style={{
                background: palette.bgPanel,
                border: `2px solid ${palette.ink}`,
                padding: 10,
                boxShadow: `0 3px 0 0 ${palette.ink}`,
                position: 'relative',
                transform: flash ? 'translateY(-4px)' : 'none',
                transition: 'transform .25s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', height: 100, background: palette.bgPanel2, border: `2px dashed ${palette.line}` }}>
                  <window.Plant type={t} stage="flowering" palette={palette} scale={3} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 12, color: palette.ink }}>{T.name.toUpperCase()}</div>
                  <div style={{ fontFamily: 'Pixelify Sans', fontSize: 11, color: palette.inkSoft, height: 26, lineHeight: 1.2, marginTop: 2 }}>{T.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <window.CoinIcon palette={palette} scale={2} />
                    <span style={{ fontFamily: 'Silkscreen', fontSize: 13, color: palette.ink }}>{T.price}</span>
                  </div>
                  {owned && !flash ? (
                    <span style={{ fontFamily: 'Pixelify Sans', fontSize: 11, color: palette.leafD, padding: '4px 6px', background: palette.leafX, border: `1px solid ${palette.leafD}` }}>OWNED</span>
                  ) : (
                    <button onClick={() => canBuy && buy(t)} disabled={!canBuy} style={{
                      appearance: 'none', cursor: canBuy ? 'pointer' : 'not-allowed',
                      padding: '4px 10px', border: `2px solid ${palette.ink}`,
                      background: canBuy ? palette.accent : palette.line,
                      color: '#fff', fontFamily: 'Silkscreen', fontSize: 11,
                      opacity: canBuy ? 1 : 0.6,
                    }}>{flash ? 'GOT IT!' : 'BUY'}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'decor' && (
        <div style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { name: 'TERRA POT', price: 30, render: <window.PixelSprite scale={3} grid={['..pppppppp..','.pPPPPPPPPp.','pPPPPPPPPPPp','pkkkkkkkkkkp','.pkkkkkkkkp.','..pkkkkkkp..']} palette={{ p: palette.pot, P: palette.potL, k: palette.potD }} /> },
              { name: 'STONE PATH', price: 25, render: <window.PixelSprite scale={3} grid={['kkkkkkkkkk','kssksksskk','kskskskssk','ksskskskks','kkkkkkkkkk']} palette={{ k: palette.line, s: palette.bgFloor }} /> },
              { name: 'TRELLIS',    price: 60, render: <window.PixelSprite scale={3} grid={['b........b','b.l...l..b','b..l.l...b','b...l....b','b..l.l...b','b.l...l..b','bbbbbbbbbb']} palette={{ b: palette.line, l: palette.leaf }} /> },
              { name: 'FAIRY LIGHT',price: 80, render: <window.PixelSprite scale={3} grid={['..........','.bbbbbbbbb','y.b.y.b.y.','.b.y.b.y.b','y.........']} palette={{ b: palette.line, y: palette.coin }} /> },
            ].map((d, i) => (
              <div key={i} style={{ background: palette.bgPanel, border: `2px solid ${palette.ink}`, padding: 10, boxShadow: `0 3px 0 0 ${palette.ink}` }}>
                <div style={{ display: 'flex', justifyContent: 'center', height: 80, background: palette.bgPanel2, border: `2px dashed ${palette.line}`, alignItems: 'center' }}>{d.render}</div>
                <div style={{ marginTop: 6, fontFamily: 'Silkscreen', fontSize: 11, color: palette.ink }}>{d.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <window.CoinIcon palette={palette} scale={2} /><span style={{ fontFamily: 'Silkscreen', fontSize: 12 }}>{d.price}</span>
                  </div>
                  <button style={{ padding: '3px 10px', border: `2px solid ${palette.ink}`, background: palette.accent, color: '#fff', fontFamily: 'Silkscreen', fontSize: 10, cursor: 'pointer' }}>BUY</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'revive' && (
        <div style={{ padding: 14 }}>
          <window.PixelPanel palette={palette}>
            <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 14, color: palette.ink, marginBottom: 6 }}>REVIVAL TOKEN</div>
            <div style={{ fontFamily: 'Pixelify Sans', fontSize: 13, color: palette.inkSoft, marginBottom: 10 }}>Bring a wilted or dead plant back to 50 health. One token = one revive.</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <window.HeartIcon palette={palette} scale={3} />
                <span style={{ fontFamily: 'Silkscreen', fontSize: 16, color: palette.accent }}>25</span>
                <window.CoinIcon palette={palette} scale={3} />
              </div>
              <window.PixelButton palette={palette} size="sm">BUY 1</window.PixelButton>
            </div>
          </window.PixelPanel>
        </div>
      )}
    </div>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────
function StatsScreen({ palette }) {
  const { state } = useStore();
  // 8-week heatmap (mock data)
  const cells = Array.from({ length: 8 * 7 }, (_, i) => {
    const seed = (i * 31 + 17) % 100;
    return seed > 80 ? 0 : seed > 60 ? 1 : seed > 35 ? 2 : 3;
  });
  cells[cells.length - 1] = 3;
  cells[cells.length - 2] = 3;
  const heatColors = [palette.bgPanel2, palette.leafX, palette.leafL, palette.leaf];
  // bar chart of 7 days
  const days = [3, 5, 4, 6, 7, 5, 8];
  const dayLbls = ['M','T','W','T','F','S','S'];
  const max = 8;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: palette.bgPanel, overflow: 'auto' }}>
      <div style={{ padding: '14px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 18, color: palette.ink }}>YOUR GROWTH</div>
          <div style={{ fontFamily: 'Pixelify Sans', fontSize: 12, color: palette.inkSoft }}>Last 8 weeks</div>
        </div>
        <HUD palette={palette} state={state} />
      </div>

      {/* big numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '8px 14px' }}>
        {[
          { lbl: 'STREAK',   val: state.streak, sub: 'days', color: palette.accent },
          { lbl: 'PLANTS',   val: state.plants.length, sub: 'alive', color: palette.leafL },
          { lbl: 'COINS',    val: state.coins, sub: 'total', color: palette.coin },
        ].map(s => (
          <div key={s.lbl} style={{ background: palette.bgPanel2, border: `2px solid ${palette.ink}`, padding: 10, boxShadow: `0 3px 0 0 ${palette.ink}` }}>
            <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 10, color: palette.inkSoft }}>{s.lbl}</div>
            <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 22, color: s.color, marginTop: 4 }}>{s.val}</div>
            <div style={{ fontFamily: 'Pixelify Sans', fontSize: 11, color: palette.inkSoft }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* heat map */}
      <div style={{ padding: '12px 14px 4px' }}>
        <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 12, color: palette.inkSoft, marginBottom: 8 }}>COMPLETION GRID</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3 }}>
          {cells.map((v, i) => (
            <div key={i} style={{ aspectRatio: '1', background: heatColors[v], border: `1px solid ${palette.ink}33` }} />
          ))}
        </div>
      </div>

      {/* bar chart */}
      <div style={{ padding: '14px 14px 8px' }}>
        <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 12, color: palette.inkSoft, marginBottom: 8 }}>THIS WEEK</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110, background: palette.bgPanel2, border: `2px solid ${palette.ink}`, padding: 8 }}>
          {days.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: `${(d/max) * 100}%`, background: i === 4 ? palette.accent : palette.leaf, border: `2px solid ${palette.ink}` }} />
              <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 10, color: palette.inkSoft }}>{dayLbls[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* badges */}
      <div style={{ padding: '8px 14px 24px' }}>
        <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 12, color: palette.inkSoft, marginBottom: 8 }}>BADGES</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { t: 'FIRST BLOOM', e: '🌷', got: true },
            { t: '7-DAY STREAK', e: '🔥', got: true },
            { t: 'GREEN THUMB', e: '👍', got: true },
            { t: '30-DAY', e: '⭐', got: false },
            { t: 'COLLECTOR', e: '🏆', got: false },
          ].map(b => (
            <div key={b.t} style={{ flex: 1, textAlign: 'center', padding: 6, background: b.got ? palette.bgPanel2 : palette.bgPanel, border: `2px solid ${b.got ? palette.ink : palette.line}`, opacity: b.got ? 1 : 0.4 }}>
              <div style={{ fontSize: 22 }}>{b.e}</div>
              <div style={{ fontFamily: 'Silkscreen', fontSize: 8, color: palette.inkSoft, marginTop: 2 }}>{b.t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────────
function ProfileScreen({ palette }) {
  const { state, dispatch } = useStore();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: palette.bgPanel, overflow: 'auto' }}>
      <div style={{ padding: '20px 14px 16px', display: 'flex', alignItems: 'center', gap: 14, background: palette.bgPanel2, borderBottom: `2px solid ${palette.ink}` }}>
        <window.PixelSprite scale={4} grid={[
          '..ccccccc.',
          '.cCCCCCCCc',
          'cCCCCCCCCC',
          'cCCfCCfCCC',
          'cCCCCCCCCC',
          'cCCfffffCC',
          '.cCCCCCCCc',
          '..cccccc..',
        ]} palette={{ c: palette.line, C: palette.coin, f: palette.ink }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 16, color: palette.ink }}>PIXEL GARDENER</div>
          <div style={{ fontFamily: 'Pixelify Sans', fontSize: 12, color: palette.inkSoft }}>Lvl {state.level} · {state.xp} XP</div>
          <div style={{ marginTop: 6, height: 8, background: palette.bgPanel, border: `2px solid ${palette.ink}` }}>
            <div style={{ height: '100%', width: `${(state.xp % 100)}%`, background: palette.accentB }} />
          </div>
        </div>
      </div>

      {[
        { hdr: 'NOTIFICATIONS', items: [
          { lbl: 'Task reminders',   sub: '9:00 AM',   toggle: true,  on: true },
          { lbl: 'Plant wilt alerts',sub: 'Important', toggle: true,  on: true },
          { lbl: 'Weekly recap',     sub: 'Sundays',   toggle: true,  on: false },
        ]},
        { hdr: 'GREENHOUSE', items: [
          { lbl: 'Grid size',     sub: `${state.gridCols} × ${state.gridRows}` },
          { lbl: 'Time of day',   sub: state.timeOfDay },
          { lbl: 'Theme',         sub: window.PIXEL_PALETTES[state.paletteKey].name },
        ]},
        { hdr: 'ACCOUNT', items: [
          { lbl: 'Cloud sync',    sub: 'pixelgardener@…' },
          { lbl: 'Connect Apple Health', sub: 'Off' },
          { lbl: 'Sign out',      sub: '', danger: true },
        ]},
      ].map(g => (
        <div key={g.hdr}>
          <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 11, color: palette.inkSoft, padding: '14px 14px 6px', letterSpacing: 1 }}>{g.hdr}</div>
          <div style={{ borderTop: `2px solid ${palette.ink}`, borderBottom: `2px solid ${palette.ink}`, background: palette.bgPanel2 }}>
            {g.items.map((it, i) => (
              <div key={it.lbl} style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px',
                borderTop: i ? `1px solid ${palette.line}55` : 'none',
                color: it.danger ? palette.accent : palette.ink,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Pixelify Sans', fontSize: 15, fontWeight: 600 }}>{it.lbl}</div>
                  {it.sub && <div style={{ fontFamily: 'Pixelify Sans', fontSize: 12, color: palette.inkSoft, marginTop: 2 }}>{it.sub}</div>}
                </div>
                {it.toggle ? (
                  <div style={{ width: 36, height: 20, background: it.on ? palette.leafL : palette.line, border: `2px solid ${palette.ink}`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, [it.on ? 'right' : 'left']: 0, width: 16, background: palette.bgPanel, borderLeft: it.on ? `2px solid ${palette.ink}` : '', borderRight: !it.on ? `2px solid ${palette.ink}` : '' }} />
                  </div>
                ) : <span style={{ fontFamily: 'Silkscreen', fontSize: 12, color: palette.line }}>›</span>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ padding: 18 }}>
        <window.PixelButton palette={palette} color={palette.line} onClick={() => dispatch({ type: 'DEMO_RESET' })} style={{ width: '100%' }}>RESET DEMO DATA</window.PixelButton>
      </div>
    </div>
  );
}

// ─── Task Complete celebration overlay ───────────────────────────────
function CelebrationOverlay({ palette }) {
  const { state, dispatch } = useStore();
  const c = state.celebrate;
  if (!c) return null;
  const plant = c.plantId ? state.plants.find(p => p.id === c.plantId) : null;
  const grew = c.oldStage && c.newStage && c.oldStage !== c.newStage;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: '#00000088', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'gh-fade .25s ease-out',
    }}>
      <style>{`
        @keyframes gh-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes gh-pop  { 0% { transform: scale(0.6) translateY(20px); opacity: 0 } 60% { transform: scale(1.08) translateY(-4px); opacity: 1 } 100% { transform: scale(1) translateY(0) } }
        @keyframes gh-float { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(-40px); opacity: 0 } }
        @keyframes gh-grow  { 0% { transform: scale(1) } 50% { transform: scale(1.3) } 100% { transform: scale(1) } }
      `}</style>
      <div style={{ width: 280, animation: 'gh-pop .45s cubic-bezier(.3,1.4,.5,1)' }}>
        <window.PixelPanel palette={palette} pad={20} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 20, color: palette.accent, marginBottom: 8, letterSpacing: 1 }}>
            DONE!
          </div>
          {plant && (
            <div style={{ position: 'relative', height: 140, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                {/* sparkles */}
                {[[-40,-20],[40,-30],[-50,-50],[50,-60],[-20,-70],[20,-80]].map(([x,y], i) => (
                  <div key={i} style={{ position: 'absolute', left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, animation: 'gh-float 1.2s ease-out forwards', animationDelay: `${i*0.05}s` }}>
                    <window.StarIcon palette={palette} scale={1.5} />
                  </div>
                ))}
              </div>
              <div style={{ animation: grew ? 'gh-grow 1s ease-out' : '' }}>
                <window.Plant type={plant.type} stage={plant.stage} palette={palette} scale={4} />
              </div>
            </div>
          )}
          {grew && (
            <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 12, color: palette.leafD, marginTop: 4 }}>
              GREW TO {c.newStage.toUpperCase()}!
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, margin: '14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, animation: 'gh-pop .8s ease-out' }}>
              <window.CoinIcon palette={palette} scale={3} />
              <span style={{ fontFamily: 'Silkscreen', fontSize: 22, color: palette.coinDark }}>+{c.coin}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, animation: 'gh-pop .8s ease-out .1s both' }}>
              <window.XPIcon palette={palette} scale={3} />
              <span style={{ fontFamily: 'Silkscreen', fontSize: 22, color: palette.accentB }}>+{c.xp}</span>
            </div>
          </div>
          <window.PixelButton palette={palette} onClick={() => dispatch({ type: 'CLEAR_CELEBRATE' })} style={{ width: '100%' }}>
            KEEP GOING →
          </window.PixelButton>
        </window.PixelPanel>
      </div>
    </div>
  );
}

Object.assign(window, {
  GreenhouseSky, HUD, TabBar, OnboardingScreen,
  GreenhouseScreen, TasksScreen, NewTaskScreen,
  ShopScreen, StatsScreen, ProfileScreen,
  CelebrationOverlay,
});
