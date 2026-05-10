// app-shell.jsx — main App component, web view, tweaks

const { useStore } = window;

function PhoneApp({ palette, initialTab = 'greenhouse' }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = React.useState(initialTab);
  const [newTask, setNewTask] = React.useState(false);

  const screen = newTask
    ? <window.NewTaskScreen palette={palette} onCancel={() => setNewTask(false)} onCreated={() => { setNewTask(false); setTab('tasks'); }} />
    : tab === 'greenhouse' ? <window.GreenhouseScreen palette={palette} onTab={setTab} />
    : tab === 'tasks' ? <window.TasksScreen palette={palette} onNewTask={() => setNewTask(true)} />
    : tab === 'shop' ? <window.ShopScreen palette={palette} />
    : tab === 'stats' ? <window.StatsScreen palette={palette} />
    : tab === 'profile' ? <window.ProfileScreen palette={palette} />
    : null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: palette.bgPanel, position: 'relative', overflow: 'hidden' }}>
      {screen}
      {!newTask && <window.TabBar palette={palette} current={tab} onChange={setTab} />}
      <window.CelebrationOverlay palette={palette} />
    </div>
  );
}

function IOSGreenhouse({ palette, initialTab, dark }) {
  return (
    <window.IOSDevice width={360} height={760} dark={dark}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 50, paddingBottom: 18, boxSizing: 'border-box' }}>
        <PhoneApp palette={palette} initialTab={initialTab} />
      </div>
    </window.IOSDevice>
  );
}

function OnboardingFrame({ palette }) {
  return (
    <window.IOSDevice width={360} height={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 18, boxSizing: 'border-box' }}>
        <window.OnboardingScreen palette={palette} onContinue={() => {}} />
      </div>
    </window.IOSDevice>
  );
}

function NewTaskFrame({ palette }) {
  return (
    <window.IOSDevice width={360} height={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 50, paddingBottom: 18, boxSizing: 'border-box' }}>
        <window.NewTaskScreen palette={palette} onCancel={() => {}} onCreated={() => {}} />
      </div>
    </window.IOSDevice>
  );
}

function CelebrationFrame({ palette }) {
  // Force a celebration to be visible by injecting one on mount
  const { state, dispatch } = useStore();
  React.useEffect(() => {
    if (!state.celebrate) {
      const t = state.tasks.find(x => !x.doneToday);
      if (t) dispatch({ type: 'COMPLETE_TASK', id: t.id });
    }
  }, []);
  return (
    <window.IOSDevice width={360} height={760}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 50, paddingBottom: 18, boxSizing: 'border-box' }}>
        <PhoneApp palette={palette} initialTab="greenhouse" />
      </div>
    </window.IOSDevice>
  );
}

function WebGreenhouseView({ palette }) {
  const { state, dispatch } = useStore();
  return (
    <window.ChromeWindow width={1000} height={620} url="greenhouse.app/garden">
      <div style={{ height: '100%', background: `linear-gradient(${palette.bgWall}, ${palette.bgFloor})`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <window.GreenhouseSky palette={palette} time={state.timeOfDay} height={170} />
        <div style={{ position: 'relative', zIndex: 5, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 22, color: palette.ink, textShadow: `2px 2px 0 ${palette.bgPanel}88` }}>🌿 GREENHOUSE</div>
          <nav style={{ display: 'flex', gap: 8, marginLeft: 24 }}>
            {['Garden','Tasks','Shop','Stats'].map((n, i) => (
              <button key={n} style={{
                padding: '6px 14px', appearance: 'none', cursor: 'pointer',
                border: `2px solid ${palette.ink}`, background: i === 0 ? palette.accent : palette.bgPanel,
                color: i === 0 ? '#fff' : palette.ink, fontFamily: 'Pixelify Sans', fontSize: 13, fontWeight: 600,
                boxShadow: i === 0 ? `0 3px 0 0 ${palette.ink}` : `0 2px 0 0 ${palette.line}`,
              }}>{n}</button>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <window.HUD palette={palette} state={state} />
        </div>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 130, background:
            `repeating-linear-gradient(90deg, ${palette.bgFloor} 0 50px, ${palette.bgFloor}cc 50px 52px),
             linear-gradient(${palette.bgFloor}, ${palette.soilL})`,
            borderTop: `3px solid ${palette.line}`,
          }} />
          <div style={{
            position: 'relative', display: 'grid',
            gridTemplateColumns: `repeat(${state.gridCols}, 84px)`,
            gridTemplateRows: `repeat(${state.gridRows}, 88px)`,
            marginBottom: 38, marginRight: 280,
          }}>
            {Array.from({ length: state.gridRows * state.gridCols }).map((_, i) => {
              const col = i % state.gridCols, row = Math.floor(i / state.gridCols);
              const p = state.plants.find(x => x.slot.col === col && x.slot.row === row);
              return (
                <div key={i} style={{ border: `1px dashed ${palette.line}55`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
                  {p && <window.Plant type={p.type} stage={p.stage} palette={palette} scale={3.5} />}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 90, right: 18, width: 250, zIndex: 5 }}>
          <window.PixelPanel palette={palette} pad={12}>
            <div style={{ fontFamily: 'Silkscreen, monospace', fontSize: 12, color: palette.inkSoft, marginBottom: 8 }}>TODAY · {state.tasks.filter(t => t.freq === 'daily' && t.doneToday).length}/{state.tasks.filter(t => t.freq === 'daily').length}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflow: 'auto' }}>
              {state.tasks.filter(t => t.freq === 'daily').map(t => {
                const plant = state.plants.find(p => p.id === t.plantId);
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: t.doneToday ? palette.bgPanel2 : palette.bgPanel, border: `1.5px solid ${palette.ink}`, opacity: t.doneToday ? 0.65 : 1 }}>
                    <button onClick={() => dispatch({ type: t.doneToday ? 'UNCOMPLETE_TASK' : 'COMPLETE_TASK', id: t.id })} style={{
                      width: 22, height: 22, padding: 0, cursor: 'pointer',
                      border: `1.5px solid ${palette.ink}`, background: t.doneToday ? palette.leafL : palette.bgPanel,
                      color: '#fff', fontFamily: 'Silkscreen', fontSize: 12,
                    }}>{t.doneToday ? '✓' : ''}</button>
                    <span style={{ flex: 1, fontFamily: 'Pixelify Sans', fontSize: 13, color: palette.ink, textDecoration: t.doneToday ? 'line-through' : 'none' }}>{t.icon} {t.name}</span>
                    {plant && <window.Plant type={plant.type} stage={plant.stage} palette={palette} scale={1.5} />}
                  </div>
                );
              })}
            </div>
          </window.PixelPanel>
        </div>
        <window.CelebrationOverlay palette={palette} />
      </div>
    </window.ChromeWindow>
  );
}

// ── Tweaks panel — TweaksPanel handles host protocol itself
function GreenhouseTweaks() {
  const { state, dispatch } = useStore();
  return (
    <window.TweaksPanel title="Greenhouse Tweaks">
      <window.TweakSection label="THEME" />
      <window.TweakRadio label="Palette" value={state.paletteKey}
        options={['terracotta','twilight','pastel']}
        onChange={(v) => dispatch({ type: 'SET_PALETTE', key: v })} />
      <window.TweakRadio label="Time of day" value={state.timeOfDay}
        options={['day','dusk','night']}
        onChange={(v) => dispatch({ type: 'SET_TIME', value: v })} />

      <window.TweakSection label="GREENHOUSE" />
      <window.TweakRadio label="Grid"
        value={`${state.gridCols}x${state.gridRows}`}
        options={['4x3','6x4','8x5']}
        onChange={(v) => { const [c,r] = v.split('x').map(Number); dispatch({ type: 'SET_GRID', cols: c, rows: r }); }} />

      <window.TweakSection label="DEMO" />
      <window.TweakButton label="+ Complete a task" onClick={() => {
        const undone = state.tasks.find(t => !t.doneToday);
        if (undone) dispatch({ type: 'COMPLETE_TASK', id: undone.id });
      }} />
      <window.TweakButton label="Skip a day (decay)" onClick={() => dispatch({ type: 'DEMO_DECAY' })} />
      <window.TweakButton label="Reset state" secondary onClick={() => dispatch({ type: 'DEMO_RESET' })} />

      <window.TweakSection label="MOCK DATA" />
      <window.TweakSlider label="Coins" value={state.coins} min={0} max={2000} step={10}
        onChange={(v) => dispatch({ type: 'PATCH', patch: { coins: v } })} />
      <window.TweakSlider label="Streak" value={state.streak} min={0} max={365} step={1} unit="d"
        onChange={(v) => dispatch({ type: 'PATCH', patch: { streak: v } })} />
    </window.TweaksPanel>
  );
}

Object.assign(window, { PhoneApp, IOSGreenhouse, OnboardingFrame, NewTaskFrame, CelebrationFrame, WebGreenhouseView, GreenhouseTweaks });
