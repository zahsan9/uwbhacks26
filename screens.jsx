// screens.jsx — VitaQuest tropical screens

function WorldBg({ children, style }) {
  return (
    <div className="vq vq-screen" style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', background: 'var(--vq-seashell)', ...style,
    }}>
      <div className="vq-water-bg" />
      {children}
    </div>
  );
}

// Pill status bar for state
function StatePill({ state }) {
  return <span className={`vq-chip ${state}`}>{state}</span>;
}

// ═══════════════════════════════════════════════════════════════════ ONBOARDING
function OnboardingSignup() {
  return (
    <WorldBg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '80px 28px 36px', zIndex: 2 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Blob state="thriving" scale={5} glow sparkle />
          <div style={{ fontFamily: "'Pixelify Sans', system-ui", fontWeight: 700, fontSize: 32, letterSpacing: 1, marginTop: 20, color: 'var(--vq-ink)' }}>VitaQuest</div>
          <div className="vq-body" style={{ marginTop: 4, color: 'var(--vq-ink-soft)' }}>one world. every habit.</div>
        </div>
        <div>
          <button className="vq-btn oauth-apple" style={{ width: '100%', marginBottom: 8 }}>Continue with Apple</button>
          <button className="vq-btn oauth-google" style={{ width: '100%', marginBottom: 8 }}>Continue with Google</button>
          <button className="vq-btn ghost" style={{ width: '100%' }}>Sign up with email</button>
        </div>
      </div>
    </WorldBg>
  );
}

function OnboardingHealth() {
  return (
    <WorldBg>
      <div style={{ padding: '76px 28px 0', position: 'relative', zIndex: 2 }}>
        <div className="vq-eyebrow" style={{ marginBottom: 12 }}>02 / 04</div>
        <div className="vq-h1" style={{ marginBottom: 10 }}>Connect Apple Health</div>
        <div className="vq-body" style={{ marginBottom: 28 }}>We read health data silently — no logging.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { Icon: IconWalk, t: 'Steps & walks' },
            { Icon: IconSleep, t: 'Sleep' },
            { Icon: IconHeart, t: 'Activity' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--vq-border)' }}>
              <r.Icon size={20} color="var(--vq-ink)" />
              <div className="vq-h3" style={{ flex: 1 }}>{r.t}</div>
              <IconCheck size={18} color="var(--vq-tea)" />
            </div>
          ))}
        </div>
        <button className="vq-btn" style={{ width: '100%', marginTop: 32 }}>Allow HealthKit access</button>
        <button className="vq-btn ghost" style={{ width: '100%', marginTop: 8, background: 'transparent', boxShadow: 'none' }}>Maybe later</button>
      </div>
    </WorldBg>
  );
}

const AVATARS = [
  { name: 'Mochi' },
  { name: 'Pebble' },
  { name: 'Puff' },
  { name: 'Dew' },
];

function OnboardingAvatar({ selected = 0 }) {
  return (
    <WorldBg>
      <div style={{ padding: '76px 28px 0', position: 'relative', zIndex: 2 }}>
        <div className="vq-eyebrow" style={{ marginBottom: 12 }}>03 / 04</div>
        <div className="vq-h1" style={{ marginBottom: 28 }}>Meet your companion</div>
        <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
          <Blob state={['thriving','healthy','healthy','healthy'][selected]} scale={6} glow={selected === 0} sparkle={selected === 0} />
          <div className="vq-h2" style={{ marginTop: 18 }}>{AVATARS[selected].name}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 20, marginBottom: 32 }}>
          {AVATARS.map((a, i) => (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 4,
              background: i === selected ? 'var(--vq-ink)' : 'transparent',
              border: i === selected ? '2px solid var(--vq-ink)' : '2px solid var(--vq-border-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ transform: 'scale(0.42)', filter: i === selected ? 'none' : 'none' }}>
                <Blob state={['thriving','healthy','healthy','healthy'][i]} scale={4} />
              </div>
            </div>
          ))}
        </div>
        <button className="vq-btn" style={{ width: '100%' }}>Continue</button>
      </div>
    </WorldBg>
  );
}

const STARTER_HABITS = [
  { id: 'sleep', label: 'Sleep', hint: 'Auto · HealthKit', Icon: IconSleep },
  { id: 'steps', label: 'Steps', hint: 'Auto · HealthKit', Icon: IconWalk },
  { id: 'screen', label: 'Screen time', hint: 'Auto · Screen Time', Icon: IconScreen },
  { id: 'gym', label: 'Workout', hint: 'Photo verified', Icon: IconHeart },
  { id: 'read', label: 'Read', hint: 'Photo verified', Icon: IconBook },
  { id: 'meditate', label: 'Meditate', hint: 'Photo verified', Icon: IconSparkles },
];

function OnboardingHabits({ selected = ['sleep','steps','screen'] }) {
  return (
    <WorldBg>
      <div style={{ padding: '76px 28px 0', position: 'relative', zIndex: 2 }}>
        <div className="vq-eyebrow" style={{ marginBottom: 12 }}>04 / 04</div>
        <div className="vq-h1" style={{ marginBottom: 10 }}>Pick your islands</div>
        <div className="vq-body" style={{ marginBottom: 24 }}>Each habit grows its own island.</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {STARTER_HABITS.map(h => {
            const isSel = selected.includes(h.id);
            return (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0', borderBottom: '1px solid var(--vq-border)',
              }}>
                <h.Icon size={20} color={isSel ? 'var(--vq-ink)' : 'var(--vq-ink-dim)'} />
                <div style={{ flex: 1 }}>
                  <div className="vq-h3" style={{ color: isSel ? 'var(--vq-ink)' : 'var(--vq-ink-soft)' }}>{h.label}</div>
                  <div className="vq-small">{h.hint}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 3,
                  background: isSel ? 'var(--vq-ink)' : 'transparent',
                  border: isSel ? '2px solid var(--vq-ink)' : '2px solid var(--vq-border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSel && <IconCheck size={13} color="var(--vq-seashell)" strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>
        <button className="vq-btn" style={{ width: '100%', marginTop: 28 }}>Begin quest · {selected.length}</button>
      </div>
    </WorldBg>
  );
}

// ═══════════════════════════════════════════════════════════════════ LANDING
function LandingScreen({ avatarState = 'healthy' }) {
  const msg = {
    thriving: 'All my islands are thriving.',
    healthy: 'Doing okay — volcano runs warm.',
    sick: 'My volcano needs help…',
    critical: "I don't feel so good.",
  }[avatarState];

  return (
    <WorldBg>
      <div style={{ position: 'absolute', top: 60, left: 24, right: 24, zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div className="vq-eyebrow">Day 12</div>
          <div className="vq-h2" style={{ marginTop: 4 }}>Hi, Zainab</div>
        </div>
        <div className="vq-small">Lv 4</div>
      </div>

      <div style={{ position: 'absolute', top: 170, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
        <Blob state={avatarState} scale={6} glow={avatarState === 'thriving'} sparkle={avatarState === 'thriving'} />
        <div style={{ marginTop: 16, maxWidth: 260, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Pixelify Sans', system-ui", fontWeight: 400, fontSize: 16, lineHeight: 1.4, letterSpacing: 0.2, color: 'var(--vq-ink)' }}>
            “{msg}”
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 130, left: 24, right: 24, zIndex: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div className="vq-eyebrow">Your world</div>
          <div className="vq-small">3 islands</div>
        </div>
        <div className="vq-rule" />
        {[
          { key: 'walk', label: 'Walk', streak: 12, Icon: IconWalk, state: 'thriving' },
          { key: 'sleep', label: 'Sleep', streak: 7, Icon: IconSleep, state: 'healthy' },
          { key: 'screen', label: 'Screen', streak: 2, Icon: IconScreen, state: 'sick' },
        ].map(h => (
          <div key={h.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--vq-border)' }}>
            <h.Icon size={18} color="var(--vq-ink)" />
            <div className="vq-h3" style={{ flex: 1 }}>{h.label}</div>
            <div className="vq-dashes" style={{ width: 70 }}>
              {[0,1,2,3,4,5,6].map(i => {
                const cls = h.state === 'thriving' ? 'on'
                  : h.state === 'healthy' ? (i < 5 ? 'on' : '')
                  : h.state === 'sick' ? (i < 2 ? 'partial' : '')
                  : (i < 1 ? 'miss' : '');
                return <div key={i} className={`vq-dash ${cls}`} />;
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 32, justifyContent: 'flex-end' }}>
              <span className="vq-streak-num" style={{ fontSize: 18 }}>{h.streak}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 5 }}>
        <button className="vq-btn">Open world map</button>
      </div>
    </WorldBg>
  );
}

// ─── Water background for map screen ───────────────────────────────
function WaterBg({ children }) {
  return (
    <div className="vq vq-screen" style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #1e5a68 0%, #2b7485 30%, #3d8c96 60%, #4ea3ad 100%)',
    }}>
      {/* Animated pixel wave stripes */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wv1" x="0" y="0" width="90" height="22" patternUnits="userSpaceOnUse">
            <polyline points="0,11 15,5 30,11 45,17 60,11 75,5 90,11"
              stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" strokeLinejoin="round"/>
          </pattern>
          <pattern id="wv2" x="0" y="0" width="130" height="32" patternUnits="userSpaceOnUse">
            <polyline points="0,16 22,8 44,16 66,24 88,16 110,8 130,16"
              stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wv1)"
          style={{ animation: 'vq-drift-a 9s linear infinite' }} />
        <rect width="100%" height="100%" fill="url(#wv2)"
          style={{ animation: 'vq-drift-b 14s linear infinite' }} />
      </svg>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════ MAP
function MapScreen({ layout = 'scattered', islandStates = {}, avatarPos = { island: 'home' } }) {
  const defaults = { walk: 'thriving', sleep: 'healthy', screen: 'sick', learn: 'locked', quest: 'locked' };
  const states = { ...defaults, ...islandStates };
  const positions = layout === 'scattered' ? {
    home:   { top: 340, left: 130, scale: 3 },
    walk:   { top: 180, left: 210, scale: 2.4 },
    sleep:  { top: 220, left: 20,  scale: 2.2 },
    screen: { top: 500, left: 220, scale: 2.1 },
    learn:  { top: 520, left: 30,  scale: 2.1 },
    quest:  { top: 100, left: 120, scale: 2 },
  } : {
    home:   { top: 340, left: 140, scale: 2.8 },
    walk:   { top: 200, left: 140, scale: 2.2 },
    sleep:  { top: 270, left: 140, scale: 2.2 },
    screen: { top: 460, left: 140, scale: 2.2 },
    learn:  { top: 530, left: 140, scale: 2.1 },
    quest:  { top: 120, left: 140, scale: 2 },
  };
  const from = positions.home, to = positions[avatarPos.island] || from;

  // Island center for connecting lines (half of 32-col × ~21-row sprite)
  const cx = (key) => positions[key].left + positions[key].scale * 16;
  const cy = (key) => positions[key].top  + positions[key].scale * 10;
  const SATELLITES = ['walk', 'sleep', 'screen', 'learn', 'quest'];

  return (
    <WaterBg>
      {/* Header */}
      <div style={{ position: 'absolute', top: 56, left: 24, right: 24, zIndex: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="vq-eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>Your world</div>
          <div className="vq-h2" style={{ marginTop: 4, color: '#fff' }}>{layout === 'scattered' ? 'Archipelago' : 'Linear'}</div>
        </div>
        <button style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 4, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <IconFriends size={16} color="rgba(255,255,255,0.9)" />
        </button>
      </div>

      {/* Connecting lines + swim trail */}
      <svg style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }} width="100%" height="100%">
        {SATELLITES.map(key => (
          <line key={key}
            x1={cx('home')} y1={cy('home')} x2={cx(key)} y2={cy(key)}
            stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"
            strokeDasharray="6 5" strokeLinecap="round" />
        ))}
        {avatarPos.island !== 'home' && [0.25, 0.5, 0.75].map((t, i) => (
          <circle key={i}
            cx={cx('home') + (cx(avatarPos.island) - cx('home')) * t}
            cy={cy('home') + (cy(avatarPos.island) - cy('home')) * t}
            r="3" fill="rgba(255,255,255,0.75)">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* Satellite islands */}
      {SATELLITES.map(key => {
        const pos = positions[key];
        const state = states[key];
        const locked = state === 'locked';
        return (
          <div key={key} style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 3 }}>
            <Island type={key} state={locked ? 'sick' : state} scale={pos.scale} locked={locked} />
            <div style={{
              position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
              fontFamily: "'Pixelify Sans', system-ui", fontWeight: 500, fontSize: 10,
              color: locked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
              letterSpacing: 0.4, textTransform: 'lowercase', whiteSpace: 'nowrap',
            }}>{key}</div>
          </div>
        );
      })}

      {/* Home island */}
      <div style={{ position: 'absolute', top: positions.home.top, left: positions.home.left, zIndex: 4 }}>
        {avatarPos.island === 'home' && (
          <div style={{ position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)' }}>
            <Blob state="healthy" scale={2.4} />
          </div>
        )}
        <Island type="walk" state="thriving" scale={positions.home.scale} />
        <div style={{
          position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Pixelify Sans', system-ui", fontWeight: 500, fontSize: 10,
          color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4, whiteSpace: 'nowrap',
        }}>home</div>
      </div>

      {/* Swimming avatar */}
      {avatarPos.island !== 'home' && (
        <div style={{
          position: 'absolute',
          top:  from.top  + (to.top  - from.top)  * 0.5 + 18,
          left: from.left + (to.left - from.left) * 0.5 + 26,
          zIndex: 5,
        }}>
          <Blob state="healthy" scale={2.2} />
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 40, left: 24, right: 24, zIndex: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="vq-small" style={{ color: 'rgba(255,255,255,0.55)' }}>Tap an island to visit</div>
        <div className="vq-small" style={{ color: 'rgba(255,255,255,0.55)' }}>Health 78</div>
      </div>
    </WaterBg>
  );
}

// ═══════════════════════════════════════════════════════════════════ ISLAND DETAIL
function IslandDetail({ islandKey = 'walk', state = 'thriving' }) {
  const meta = {
    walk: { name: 'Palm Cove', stat: '8,240', unit: 'steps today', goal: '10,000', streak: 12, Icon: IconWalk, type: 'walk' },
    sleep: { name: 'Mountain', stat: '7h 42m', unit: 'last night', goal: '8h', streak: 7, Icon: IconSleep, type: 'sleep' },
    screen: { name: 'Volcano', stat: '4h 18m', unit: 'today', goal: 'under 3h', streak: 2, Icon: IconScreen, type: 'screen' },
  }[islandKey];

  const today = 25, daysBack = 30;
  const pattern = Array.from({ length: daysBack }, (_, i) => {
    if (i > today) return 'future';
    if (i === today) return 'today';
    if (islandKey === 'walk') return (i % 7 === 3 && i < 15) ? 'missed' : 'hit';
    if (islandKey === 'sleep') return (i < 18 && i % 5 === 2) ? 'partial' : 'hit';
    return (i < 20 && i % 3 !== 0) ? 'missed' : 'hit';
  });

  return (
    <WorldBg>
      <div style={{ position: 'absolute', top: 54, left: 14, right: 14, zIndex: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ background: 'var(--vq-surface)', border: '2px solid var(--vq-border-strong)', borderRadius: 4, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(29,29,27,0.2)' }}>
          <IconBack size={18} color="#1f3a4a" />
        </button>
        <div className="vq-h3" style={{ flex: 1 }}>{meta.name}</div>
        <StatePill state={state} />
      </div>
      {/* Island hero */}
      <div style={{ position: 'absolute', top: 110, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 2 }}>
        <Island type={meta.type} state={state} scale={4} />
      </div>
      {/* Info sheet */}
      <div style={{
        position: 'absolute', top: 300, left: 0, right: 0, bottom: 0,
        background: 'var(--vq-seashell-soft)',
        borderTopLeftRadius: 10, borderTopRightRadius: 10,
        boxShadow: '0 -3px 0 var(--vq-border-strong)',
        padding: '18px 18px 44px',
        overflow: 'auto',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 0, background: 'rgba(29,29,27,0.15)', margin: '0 auto 14px' }} />

        <div className="vq-card warm" style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: "'Pixelify Sans', system-ui", fontWeight: 700, fontSize: 34, color: 'var(--vq-ink)', lineHeight: 1 }}>{meta.stat}</div>
          <div className="vq-small" style={{ marginTop: 4 }}>{meta.unit} · goal {meta.goal}</div>
        </div>

        <div className="vq-card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <IconFlame size={18} color="#e56042" />
            <div className="vq-h3" style={{ flex: 1 }}>{meta.streak} day streak</div>
            <div className="vq-small">last 30 days</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
            {pattern.map((p, i) => {
              const bg = p === 'hit' ? '#6ed4a3'
                : p === 'partial' ? '#ffc260'
                : p === 'missed' ? '#d76060'
                : p === 'today' ? '#ff8b6a'
                : 'rgba(31,58,74,0.1)';
              return <div key={i} style={{ aspectRatio: '1', background: bg, borderRadius: 1, boxShadow: p === 'today' ? '0 0 0 2px #fff, 0 0 0 3px #ff8b6a' : 'none' }} />;
            })}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            <span className="vq-small" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#6ed4a3', borderRadius: 0 }}/>hit</span>
            <span className="vq-small" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#ffc260', borderRadius: 0 }}/>partial</span>
            <span className="vq-small" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#d76060', borderRadius: 0 }}/>missed</span>
          </div>
        </div>

        <div className="vq-card soft" style={{ marginBottom: 10 }}>
          <div className="vq-eyebrow" style={{ marginBottom: 6 }}>today's log</div>
          <div className="vq-h3">
            {state === 'thriving' && '✓ pulled from HealthKit · 82% of goal'}
            {state === 'healthy' && 'pulled from HealthKit · 68% of goal'}
            {state === 'sick' && 'missed yesterday — a short walk recovers you'}
            {state === 'critical' && '3 days missed — your island is wilting'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div className="vq-card" style={{ flex: 1, padding: 10, textAlign: 'center' }}>
            <IconStar size={18} color="#ffc260" />
            <div className="vq-h3" style={{ marginTop: 4 }}>+24 xp</div>
            <div className="vq-small">today</div>
          </div>
          <div className="vq-card" style={{ flex: 1, padding: 10, textAlign: 'center' }}>
            <IconTrophy size={18} color="#ffc260" />
            <div className="vq-h3" style={{ marginTop: 4 }}>Lvl 4</div>
            <div className="vq-small">next: 120 xp</div>
          </div>
          <div className="vq-card" style={{ flex: 1, padding: 10, textAlign: 'center' }}>
            <IconHeart size={18} color="#ff5a8a" />
            <div className="vq-h3" style={{ marginTop: 4 }}>78/100</div>
            <div className="vq-small">health</div>
          </div>
        </div>
      </div>
    </WorldBg>
  );
}

// ═══════════════════════════════════════════════════════════════════ FRIENDS
const FRIENDS = [
  { id: 'a', name: 'Ayaan', level: 6, state: 'thriving', streak: 18 },
  { id: 'f', name: 'Flop', level: 4, state: 'healthy', streak: 9 },
  { id: 'y', name: 'Yatharth', level: 3, state: 'sick', streak: 1 },
  { id: 'm', name: 'Mira', level: 8, state: 'thriving', streak: 24 },
  { id: 'k', name: 'Kai', level: 2, state: 'critical', streak: 0 },
];

function FriendsScreen({ nudged = [] }) {
  return (
    <WorldBg>
      <div style={{ position: 'absolute', top: 60, left: 16, right: 16, zIndex: 3 }}>
        <div className="vq-h1" style={{ marginBottom: 4 }}>Friends</div>
        <div className="vq-body" style={{ marginBottom: 16 }}>5 companions · 2 need a nudge</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FRIENDS.map(f => {
            const needs = f.state === 'sick' || f.state === 'critical';
            const did = nudged.includes(f.id);
            return (
              <div key={f.id} className="vq-card" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                borderLeft: needs ? '4px solid var(--vq-coral)' : '4px solid transparent',
              }}>
                <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', bottom: -2, opacity: 0.8, transform: 'scale(0.7)' }}>
                    <Island type="walk" state={f.state === 'critical' ? 'critical' : f.state === 'sick' ? 'sick' : 'healthy'} scale={1.3} bob={false} />
                  </div>
                  <div style={{ position: 'absolute', top: 2 }}>
                    <Blob state={f.state} scale={1.8} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="vq-h3">{f.name}</div>
                    <div className="vq-small">Lvl {f.level}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <IconFlame size={12} color="#e56042" />
                      <span className="vq-streak-num" style={{ fontSize: 16 }}>{f.streak}</span>
                    </span>
                    <StatePill state={f.state} />
                  </div>
                </div>
                <button className="vq-btn" style={{
                  padding: '8px 14px', fontSize: 13,
                  background: did ? '#6ed4a3' : needs ? 'var(--vq-coral)' : 'var(--vq-water-2)',
                  color: did ? '#1a3a2a' : '#fff',
                  boxShadow: did ? '0 3px 0 #4aa882' : needs ? '0 3px 0 var(--vq-coral-deep)' : '0 3px 0 var(--vq-water-3)',
                }}>
                  {did ? 'sent ✓' : needs ? 'nudge' : 'visit'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </WorldBg>
  );
}

function FriendVisitScreen({ friend = FRIENDS[2] }) {
  return (
    <WorldBg>
      <div style={{ position: 'absolute', top: 56, left: 16, right: 16, zIndex: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ background: 'var(--vq-surface)', border: '2px solid var(--vq-border-strong)', borderRadius: 4, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(29,29,27,0.2)' }}>
          <IconBack size={18} color="#1f3a4a" />
        </button>
        <div style={{ flex: 1 }}>
          <div className="vq-h3">{friend.name}'s world</div>
          <div className="vq-small">Lvl {friend.level} · {friend.state}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 150, left: 40 }}>
        <Island type="sleep" state={friend.state === 'critical' ? 'critical' : 'healthy'} scale={2.2} />
      </div>
      <div style={{ position: 'absolute', top: 130, right: 30 }}>
        <Island type="walk" state={friend.state === 'critical' ? 'sick' : 'healthy'} scale={2.2} />
      </div>
      <div style={{ position: 'absolute', top: 300, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Blob state={friend.state} scale={3} />
          <div style={{ marginTop: -10 }}>
            <Island type="quest" state={friend.state === 'critical' ? 'critical' : 'sick'} scale={2.8} />
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 540, left: 40 }}>
        <Island type="screen" state={friend.state === 'critical' ? 'critical' : 'sick'} scale={2} />
      </div>
      <div style={{ position: 'absolute', top: 520, right: 30 }}>
        <Island type="learn" state="sick" scale={2} locked />
      </div>

      <div style={{ position: 'absolute', bottom: 44, left: 16, right: 16, zIndex: 6 }}>
        <div className="vq-bubble" style={{ marginBottom: 10 }}>
          <div className="vq-h3">
            {friend.state === 'critical' && "\"i haven't done my habits in days...\""}
            {friend.state === 'sick' && '"volcano has been rough this week."'}
            {friend.state === 'healthy' && '"doing okay — want to trade habits?"'}
            {friend.state === 'thriving' && '"everything feels great! you?"'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="vq-btn" style={{ flex: 2 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <IconHeart size={16} color="#fff" fill="currentColor" /> Send nudge
            </span>
          </button>
          <button className="vq-btn ghost" style={{ flex: 1 }}>Message</button>
        </div>
      </div>
    </WorldBg>
  );
}

Object.assign(window, {
  WorldBg, WaterBg, OnboardingSignup, OnboardingHealth, OnboardingAvatar, OnboardingHabits,
  LandingScreen, MapScreen, IslandDetail, FriendsScreen, FriendVisitScreen, FRIENDS,
});
