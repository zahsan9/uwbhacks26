// sprites.jsx — VitaQuest tropical sprites
// Cute blob avatar with facial expressions + tropical islands (palm/sand/volcano/etc.)

function PixelGrid({ rows, palette, scale = 4, style }) {
  const h = rows.length;
  const w = rows[0].length;
  const rects = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      if (c === '.' || c === ' ') continue;
      const fill = palette[c];
      if (!fill) continue;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    }
  }
  return (
    <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`}
         shapeRendering="crispEdges" className="vq-pixel" style={style}>
      {rects}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BLOB AVATAR — 22x20 grid, 4 states, distinct facial expressions
// A round, huggable blob. No species. Face changes with state.
// ═══════════════════════════════════════════════════════════════════

// Base body silhouette (round blob). Face chars are placeholders replaced per state.
// Chars: b=outline, B=shadow edge, w=body light, W=body mid, k=outline shadow,
//        Face region marked with F chars which each state substitutes.
//        c=cheek blush, .=transparent

function blobRows(face) {
  // face = { eyes: [rows], mouth: [rows], blush: bool }
  // We'll just switch entire inner rows based on state.
  return face;
}

// Each state provides its own body palette + face glyphs
// Grid is 22x20
// Layout:
//   row 0-1: crown dots
//   row 2-6: top half of body
//   row 7-11: face area
//   row 12-16: bottom half
//   row 17-19: feet/shadow

const BLOB_THRIVING = [
  '........bbbbbb........',
  '......bbWWWWWWbb......',
  '.....bWWWWWWWWWWb.....',
  '....bWWWWWWWWWWWWb....',
  '...bWWWWWWWWWWWWWWb...',
  '..bWWWWWWWWWWWWWWWWb..',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWkkWWWWWWWWkkWWWb.',
  '.bWWkKKkWWWWWWkKKkWWb.', // eyes: sparkly open
  '.bWWkKKkWWWWWWkKKkWWb.',
  '.bWWWkkWWccWWccWkkWWb.', // cheeks + mouth start
  '.bWWWWWWWWkkkkWWWWWWb.', // smile
  '.bWWWWWWkKKKKKKkWWWWb.', // big open smile
  '.bWWWWWWWkkkkkWWWWWWb.',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '..bWWWWWWWWWWWWWWWWb..',
  '...bWWWWWWWWWWWWWWb...',
  '....bbWWWWWWWWWWbb....',
  '......bbWWWWWWbb......',
  '........bbbbbb........',
];

const BLOB_HEALTHY = [
  '........bbbbbb........',
  '......bbWWWWWWbb......',
  '.....bWWWWWWWWWWb.....',
  '....bWWWWWWWWWWWWb....',
  '...bWWWWWWWWWWWWWWb...',
  '..bWWWWWWWWWWWWWWWWb..',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWkkWWWWWWWWkkWWWb.', // eyes: simple dots
  '.bWWWkkWWWWWWWWkkWWWb.',
  '.bWWWWWWWccWWccWWWWWb.', // cheeks
  '.bWWWWWWWWkkkkWWWWWWb.', // gentle smile
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '..bWWWWWWWWWWWWWWWWb..',
  '...bWWWWWWWWWWWWWWb...',
  '....bbWWWWWWWWWWbb....',
  '......bbWWWWWWbb......',
  '........bbbbbb........',
];

const BLOB_SICK = [
  '........bbbbbb........',
  '......bbWWWWWWbb......',
  '.....bWWWWWWWWWWb.....',
  '....bWWWWWWWWWWWWb....',
  '...bWWWWWWWWWWWWWWb...',
  '..bWWWWWWWWWWWWWWWWb..',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWkkkWWWWWWkkkWWWb.', // closed/droopy eyes
  '.bWWWkkkWWWWWWkkkWWWb.',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWWWWWWkkkkWWWWWWb.', // flat mouth
  '.bWWWWWWkkWWWWkkWWWWb.', // downturned
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '..bWWWWWWWWWWWWWWWWb..',
  '...bWWWWWWWWWWWWWWb...',
  '....bbWWWWWWWWWWbb....',
  '......bbWWWWWWbb......',
  '........bbbbbb........',
];

const BLOB_CRITICAL = [
  '........bbbbbb........',
  '......bbWWWWWWbb......',
  '.....bWWWWWWWWWWb.....',
  '....bWWWWWWWWWWWWb....',
  '...bWWWWWWWWWWWWWWb...',
  '..bWWWWWWWWWWWWWWWWb..',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWkkkWWWWWWkkkWWWb.', // x eyes
  '.bWWWkWkWWWWWWkWkWWWb.',
  '.bWWWkkkWWWWWWkkkWWWb.',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '.bWWWWWWkkkkkkWWWWWWb.', // sad wiggle mouth
  '.bWWWWWkKWWWWKkWWWWWb.',
  '.bWWWWWWkkkkkkWWWWWWb.',
  '.bWWWWWWWWWWWWWWWWWWb.',
  '..bWWWWWWWWWWWWWWWWb..',
  '...bWWWWWWWWWWWWWWb...',
  '....bbWWWWWWWWWWbb....',
  '......bbWWWWWWbb......',
  '........bbbbbb........',
];

// Using muted palette: tea/lavender/tangerine/red body fills with seashell hi-lite
const BLOB_PALETTES = {
  thriving: { b: '#1b4a43', W: '#8eb2aa', k: '#1D1D1B', K: '#EAE4DA', c: '#EAA7C7' },
  healthy:  { b: '#4a5a8a', W: '#c9cee4', k: '#1D1D1B', K: '#EAE4DA', c: '#EAA7C7' },
  sick:     { b: '#a85428', W: '#f4b494', k: '#1D1D1B', K: '#EAE4DA', c: '#EAC119' },
  critical: { b: '#7a2a2a', W: '#e79b9a', k: '#1D1D1B', K: '#d8cfc0', c: '#9a6a74' },
};

function Blob({ state = 'healthy', scale = 4, glow = false, sparkle = false, style }) {
  const rows = state === 'thriving' ? BLOB_THRIVING
    : state === 'sick' ? BLOB_SICK
    : state === 'critical' ? BLOB_CRITICAL
    : BLOB_HEALTHY;
  const palette = BLOB_PALETTES[state] || BLOB_PALETTES.healthy;
  const anim = state === 'critical' ? 'vq-bob-slow' : state === 'thriving' ? 'vq-bob-fast' : 'vq-bob';
  return (
    <div style={{
      position: 'relative', display: 'inline-block',
      animation: `${anim} ${state === 'critical' ? '3.5s' : state === 'thriving' ? '1.6s' : '2.2s'} ease-in-out infinite`,
      ...style,
    }}>
      {glow && state === 'thriving' && (
        <div style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,193,25,0.28) 0%, rgba(36,94,85,0.12) 55%, transparent 75%)',
          pointerEvents: 'none', animation: 'vq-twinkle 2s ease-in-out infinite',
        }} />
      )}
      {sparkle && state === 'thriving' && (
        <>
          <div style={{ position: 'absolute', top: -8, left: 10, fontSize: 14, color: '#EAC119', animation: 'vq-twinkle 1.5s ease-in-out infinite' }}>✦</div>
          <div style={{ position: 'absolute', top: 6, right: -6, fontSize: 10, color: '#245E55', animation: 'vq-twinkle 2s ease-in-out infinite 0.3s' }}>✦</div>
        </>
      )}
      {state === 'sick' && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
          <PixelGrid scale={3} rows={[
            '..ggggg..',
            '.gGGGGGg.',
            'gGGGGGGGg',
            '.ggggggg.',
            '...b.....',
            '..bbb....',
          ]} palette={{ g: '#8a8880', G: '#c0beb6', b: '#9ED6DF' }} />
        </div>
      )}
      <PixelGrid rows={rows} palette={palette} scale={scale} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TROPICAL ISLAND SPRITES
// Each island: sand base + water lap + habit-specific feature
// ═══════════════════════════════════════════════════════════════════

// Palm tree island — walking habit (beach walks)
const ISLAND_PALM = [
  '.................llll...........',
  '..............LLlllLLL..........',
  '.............LLLLllLLLL.........',
  '............LLLLllllLLLL........',
  '.............LLllllllLL.........',
  '..............ttlllLL...........',
  '..............tttt..............',
  '.............ttTt...............',
  '.............tTtt..............f',
  '............ttTtt............fff',
  '...........sstTtttss.........fff',
  '..........ssssttsssssss....fff..',
  '.........sssSssssSsssssss.ff....',
  '........ssssssssssssssssss......',
  '.......ssssSssssssssSssssssss...',
  '......dddssssssssssssssssssddd..',
  '.....dddddssssssssssssssdddddd..',
  '....ddddddddssssssssddddddddd...',
  '....ddddddddddddddddddddddd.....',
  '.....dddddddddddddddddddd.......',
  '.......ddddddddddddddd..........',
];

// Mountain island — sleep habit (resting mountain under night stars)
const ISLAND_MOUNTAIN = [
  '................................',
  '.............MM.................',
  '............MMMM................',
  '...........MMwwMM...............',
  '..........MMwwwwMM..............',
  '.........MMwwwwwwMM.............',
  '........MMwwwwwwwwMM............',
  '.......MMMMMMMMMMMMMM...........',
  '......MMMMMMMMMMMMMMMM..........',
  '....nnMMMMMMMMMMMMMMMMnn........',
  '...nnnnnnnMMMMMMMMnnnnnnn.......',
  '..nnnnnnnnnnnnnnnnnnnnnnnn......',
  '.ssssnnnnnnnnnnnnnnnnnnnnsss....',
  'ssssssssnnnnnnnnnnnnnnssssssss..',
  '.sssssssssssssssssssssssssss....',
  '..ddddsssssssssssssssssddd......',
  '...dddddddddddddddddddddd.......',
  '....ddddddddddddddddddd.........',
  '......dddddddddddddd............',
];

// Volcano island — screen time (overheating / eruption risk!)
const ISLAND_VOLCANO = [
  '................................',
  '..........rrr...................',
  '..........rrr...................',
  '.........rRRRr..................',
  '........rrRRRrr.................',
  '.......rRRRRRRRr................',
  '......rrRRRRRRRrr...............',
  '.....rrRRRRRRRRRRrr.............',
  '....rrRRRRRRRRRRRRrr............',
  '...vvRRRRRRRRRRRRRRvv...........',
  '..vvvvvvvvRRRRRvvvvvvvv.........',
  '.vvvvvvvvvvvvvvvvvvvvvvv........',
  '.sssvvvvvvvvvvvvvvvvssss........',
  'ssssssssvvvvvvvvvvsssssssss.....',
  '.ssssssssssssssssssssssssss.....',
  '..ddddssssssssssssssssddd.......',
  '...ddddddddddddddddddddd........',
  '.....dddddddddddddddd...........',
];

// Bamboo island — learning habit
const ISLAND_BAMBOO = [
  '.................lllll..........',
  '................lLLLLLl.........',
  '.................lllll..........',
  '..lll......lll....lll...........',
  '.lLLLl....lLLLl..lLLLl..........',
  '..lll......lll....lll...........',
  '..|||......|||....|||...........',
  '..|||......|||....|||...........',
  '..|++......|++....|++...........',
  '..|||......|||....|||...........',
  '..|||......|||....|||...........',
  '..|++......|++....|++...........',
  '..sssssssssssssssssssss.........',
  '.sssssssssssssssssssssss........',
  '.ssssssssssssssssssssssss.......',
  '..ddddsssssssssssssssddd........',
  '...dddddddddddddddddddd.........',
  '....ddddddddddddddd.............',
];

// Shrine island — quest habit (pagoda)
const ISLAND_SHRINE = [
  '................................',
  '.............rrrrr..............',
  '............rrRRRrr.............',
  '...........rrrrrrrrr............',
  '...........pppppppp.............',
  '...........pwwwwwwp.............',
  '...........pwPPPPwp.............',
  '...........pppppppp.............',
  '..........rrrrrrrrrr............',
  '..........rrrrrrrrrr............',
  '.........pppppppppppp...........',
  '.........pwwwwPwwwwwp...........',
  '.........pppppppppppp...........',
  '........ssssssssssssss..........',
  '.......sssssssssssssss..........',
  '......ssssssssssssssssss........',
  '.....ddddssssssssssssdddd.......',
  '......dddddddddddddddddd........',
  '........dddddddddddddd..........',
];

// Muted palette: tea / lavender / tangerine / red-passion families only
const ISLAND_PALETTES = {
  thriving: {
    // Sand — seashell warm
    s: '#EAE4DA', S: '#f4efe6', d: '#c8bda6',
    // Palm (tea family)
    L: '#3f8577', l: '#245E55',
    t: '#5a4a3a', T: '#2a1f15',
    f: '#EAA7C7',
    // Mountain (lavender family)
    M: '#808BC5', w: '#EAE4DA', n: '#3f8577',
    // Volcano (muted stone)
    r: '#4a3a2a', R: '#6a5a42', v: '#3f8577',
    // Bamboo
    '|': '#3f8577', '+': '#1b4a43',
    // Shrine
    p: '#C63F3E', P: '#EAE4DA',
  },
  healthy: {
    s: '#EAE4DA', S: '#f4efe6', d: '#beb29a',
    L: '#8eb2aa', l: '#3f8577',
    t: '#5a4a3a', T: '#3a2a18',
    f: '#ED773C',
    M: '#a0a9d0', w: '#d8deec', n: '#8eb2aa',
    r: '#5a4838', R: '#6a5a42', v: '#8eb2aa',
    '|': '#8eb2aa', '+': '#3f8577',
    p: '#C63F3E', P: '#EAE4DA',
  },
  sick: {
    s: '#dcd4c2', S: '#e6ded0', d: '#aa9a7e',
    L: '#b8a68a', l: '#7a6a4a',
    t: '#6a5a4a', T: '#3a2a1a',
    f: '#ED773C',
    M: '#8a90a4', w: '#b8bcca', n: '#a8a07a',
    r: '#5a4a3a', R: '#6a5a42', v: '#a8a07a',
    '|': '#a8a07a', '+': '#6a5a3a',
    p: '#a85234', P: '#d8c08a',
  },
  critical: {
    s: '#a89a7e', S: '#b8aa8a', d: '#706248',
    L: '#7a7258', l: '#4a4230',
    t: '#4a3a2a', T: '#1D1D1B',
    f: '#8a4a2a',
    M: '#6a6a7a', w: '#8a8a96', n: '#58604a',
    r: '#38281a', R: '#483828', v: '#58604a',
    '|': '#6a6850', '+': '#38342a',
    p: '#7a3a3a', P: '#a89868',
  },
};

const ISLAND_ROWS = {
  walk: ISLAND_PALM,
  sleep: ISLAND_MOUNTAIN,
  screen: ISLAND_VOLCANO,
  learn: ISLAND_BAMBOO,
  quest: ISLAND_SHRINE,
};

function IslandDecor({ state, type }) {
  if (state === 'thriving') {
    return (
      <>
        <div style={{ position: 'absolute', bottom: 10, left: '20%', animation: 'vq-twinkle 2s ease-in-out infinite' }}>
          <PixelGrid scale={2} rows={['.f.', 'fFf', '.f.']} palette={{ f: '#EAA7C7', F: '#EAE4DA' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 14, right: '22%', animation: 'vq-twinkle 2.5s ease-in-out infinite 0.5s' }}>
          <PixelGrid scale={2} rows={['.f.', 'fFf', '.f.']} palette={{ f: '#EAC119', F: '#EAE4DA' }} />
        </div>
      </>
    );
  }
  return null;
}

function Island({ type = 'walk', state = 'healthy', scale = 4, locked = false, bob = true, style }) {
  const palette = ISLAND_PALETTES[state] || ISLAND_PALETTES.healthy;
  const rows = ISLAND_ROWS[type] || ISLAND_ROWS.walk;
  const dur = 3 + (type.charCodeAt(0) % 4) * 0.3;
  const anim = bob ? { animation: `vq-bob ${dur}s ease-in-out infinite` } : {};
  return (
    <div style={{ position: 'relative', display: 'inline-block', ...anim, ...style }}>
      {/* Water ripple shadow */}
      <div style={{
        position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
        width: rows[0].length * scale * 0.65, height: 6, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(29,29,27,0.18), transparent 70%)',
      }} />
      <PixelGrid rows={rows} palette={palette} scale={scale} />
      <IslandDecor state={state} type={type} />
      {locked && (
        <div style={{
          position: 'absolute', inset: 0, top: '30%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'rgba(29,29,27,0.82)',
            padding: '5px 11px',
            borderRadius: 999,
            color: '#EAE4DA',
            fontFamily: "'Pixelify Sans', system-ui",
            fontWeight: 500,
            fontSize: 10,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}>
            locked
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ICONS — clean inline SVG (not pixel art) for UI readability
// ═══════════════════════════════════════════════════════════════════

const icon = (path, extra) => ({ size = 20, color = '#1D1D1B', fill = 'none', strokeWidth = 1.75 } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill === 'currentColor' ? color : fill}
       stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0 }}>
    {path}
    {extra}
  </svg>
);

const IconWalk = icon(<><path d="M13 4a2 2 0 1 0 0 0.1z" fill="currentColor" stroke="none"/><path d="M11 7l3 1 2 4-2 2v6"/><path d="M8 11l3-3"/><path d="M14 13l-3 4 1 3"/></>);
const IconSleep = icon(<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>);
const IconScreen = icon(<><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M9 21h6M12 17v4"/></>);
const IconHeart = icon(<><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>);
const IconFlame = icon(<><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.5 0 2.5-1 2.5-2.5 0-1-.5-1.5-1-2.5-1-1.5.5-3 .5-3 .5 2 2 3 3 4.5 1 1.5 1 4 0 5.5a5.5 5.5 0 0 1-11 0c0-1.5 0-2 .5-3.5.5 1 1.5 1.5 3 1.5z" fill="currentColor" stroke="none"/></>);
const IconStar = icon(<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="none"/></>);
const IconCamera = icon(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>);
const IconCheck = icon(<><polyline points="20 6 9 17 4 12"/></>);
const IconFriends = icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>);
const IconTrophy = icon(<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 4H4v2a3 3 0 0 0 3 3M17 4h3v2a3 3 0 0 1-3 3"/></>);
const IconBack = icon(<><polyline points="15 18 9 12 15 6"/></>);
const IconBook = icon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5v15A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/></>);
const IconSparkles = icon(<><path d="M12 2l1.5 5 5 1.5-5 1.5L12 15l-1.5-5-5-1.5 5-1.5zM5 17l.5 1.5 1.5.5-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z" fill="currentColor" stroke="none"/></>);

Object.assign(window, {
  PixelGrid, Blob, Island,
  IconWalk, IconSleep, IconScreen, IconHeart, IconFlame,
  IconStar, IconCamera, IconCheck, IconFriends, IconTrophy, IconBack, IconBook, IconSparkles,
});
