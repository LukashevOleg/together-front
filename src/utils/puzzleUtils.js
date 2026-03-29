// ─────────────────────────────────────────────────────────────────────────────
// PUZZLE CONFIG — меняй здесь, изменится форма ВСЕХ коннекторов
// ─────────────────────────────────────────────────────────────────────────────
export const PUZZLE_CFG = {
    depth:   20,  // глубина выступа/углубления
    hst:      8,  // полуширина TAB  (выступ — узкий)
    hsp:     13,  // полуширина POCKET (углубление — широкое, чтобы tab входил)
    n:        2,  // плечо у основания (вертикальный сдвиг)
    n2t:      8,  // горизонтальное сужение TAB (широкая «шейка»)
    n2p:      6,  // горизонтальное сужение POCKET (узкая «шейка»)
    m:        4,  // промежуточная контрольная точка
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATOR
//
// Аргументы:
//   W, H     — размер тайла
//   edges    — объект с ключами top / right / bottom / left
//              каждый: { type: 'tab' | 'pocket', center: 0..1 }
//              center — позиция центра коннектора (доля стороны)
//              Если ключа нет — сторона плоская (не пишешь)
//   hEff     — (опц.) эффективная высота для нижнего коннектора, если
//              стиль height > видимая высота path (пример: rc1)
//
// Правило стыковки соседних тайлов:
//   A.right = tab  →  B.left  = pocket  (и наоборот)
//   Глобальные координаты центров должны совпадать:
//     A.x + center_A * H_A  ===  B.x + center_B * H_B   (для right/left)
//     A.y + center_A * W_A  ===  B.y + center_B * W_B   (для top/bottom)
// ─────────────────────────────────────────────────────────────────────────────
export function makePuzzlePath(W, H, edges = {}, cfg = PUZZLE_CFG, hEff) {
    const { depth: D, hst: HST, hsp: HSP, n: N, n2t: N2T, n2p: N2P, m: M } = cfg;
    const Heff = hEff ?? H;

    const p  = v => String(Math.round(v * 10) / 10);
    const hs  = t => t === 'tab' ? HST : HSP;
    const n2  = t => t === 'tab' ? N2T : N2P;

    // ── top (left → right) ───────────────────────────────────────────────
    function topConn(e) {
        const at = e.center * W;
        const h  = hs(e.type), k = n2(e.type);
        const y  = e.type === 'tab' ? D : 0;
        const s  = e.type === 'tab' ? -1 : 1;
        return [
            `L ${p(at-h)},${p(y)}`,
            `C ${p(at-h)},${p(y+s*N)} ${p(at-h-k)},${p(y+s*M)} ${p(at-h-k)},${p(y+s*D/2)}`,
            `C ${p(at-h-k)},${p(y+s*D)} ${p(at+h+k)},${p(y+s*D)} ${p(at+h+k)},${p(y+s*D/2)}`,
            `C ${p(at+h+k)},${p(y+s*M)} ${p(at+h)},${p(y+s*N)} ${p(at+h)},${p(y)}`,
        ].join(' ');
    }

    // ── right (top → bottom) ─────────────────────────────────────────────
    function rightConn(e) {
        const at = e.center * Heff;
        const h  = hs(e.type), k = n2(e.type);
        const x  = e.type === 'tab' ? W - D : W;
        const s  = e.type === 'tab' ? 1 : -1;
        return [
            `L ${p(x)},${p(at-h)}`,
            `C ${p(x+s*N)},${p(at-h)} ${p(x+s*M)},${p(at-h-k)} ${p(x+s*D/2)},${p(at-h-k)}`,
            `C ${p(x+s*D)},${p(at-h-k)} ${p(x+s*D)},${p(at+h+k)} ${p(x+s*D/2)},${p(at+h+k)}`,
            `C ${p(x+s*M)},${p(at+h+k)} ${p(x+s*N)},${p(at+h)} ${p(x)},${p(at+h)}`,
        ].join(' ');
    }

    // ── bottom (right → left) ────────────────────────────────────────────
    function bottomConn(e) {
        const at = e.center * W;
        const h  = hs(e.type), k = n2(e.type);
        const y  = e.type === 'tab' ? Heff - D : Heff;
        const s  = e.type === 'tab' ? 1 : -1;
        return [
            `L ${p(at+h)},${p(y)}`,
            `C ${p(at+h)},${p(y+s*N)} ${p(at+h+k)},${p(y+s*M)} ${p(at+h+k)},${p(y+s*D/2)}`,
            `C ${p(at+h+k)},${p(y+s*D)} ${p(at-h-k)},${p(y+s*D)} ${p(at-h-k)},${p(y+s*D/2)}`,
            `C ${p(at-h-k)},${p(y+s*M)} ${p(at-h)},${p(y+s*N)} ${p(at-h)},${p(y)}`,
        ].join(' ');
    }

    // ── left (bottom → top) ──────────────────────────────────────────────
    function leftConn(e) {
        const at = e.center * Heff;
        const h  = hs(e.type), k = n2(e.type);
        const x  = e.type === 'tab' ? D : 0;
        const s  = e.type === 'tab' ? -1 : 1;
        return [
            `L ${p(x)},${p(at+h)}`,
            `C ${p(x+s*N)},${p(at+h)} ${p(x+s*M)},${p(at+h+k)} ${p(x+s*D/2)},${p(at+h+k)}`,
            `C ${p(x+s*D)},${p(at+h+k)} ${p(x+s*D)},${p(at-h-k)} ${p(x+s*D/2)},${p(at-h-k)}`,
            `C ${p(x+s*M)},${p(at-h-k)} ${p(x+s*N)},${p(at-h)} ${p(x)},${p(at-h)}`,
        ].join(' ');
    }

    const topY    = edges.top?.type    === 'tab' ? D : 0;
    const rightX  = edges.right?.type  === 'tab' ? W - D : W;
    const bottomY = edges.bottom?.type === 'tab' ? Heff - D : Heff;
    const leftX   = edges.left?.type   === 'tab' ? D : 0;

    const parts = [`M ${leftX},${topY}`];

    if (edges.top)    parts.push(topConn(edges.top));
    parts.push(`L ${rightX},${topY}`);

    if (edges.right)  parts.push(rightConn(edges.right));
    parts.push(`L ${rightX},${bottomY}`);

    if (edges.bottom) parts.push(bottomConn(edges.bottom));
    parts.push(`L ${leftX},${bottomY}`);

    if (edges.left)   parts.push(leftConn(edges.left));

    parts.push('Z');
    return `path('${parts.join(' ')}')`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TILES — декларативный список, clip генерируется из edges
//
// center — позиция центра коннектора как доля длины стороны:
//   top/bottom  → fraction of W
//   right/left  → fraction of H (или hEff если задан)
//
// Глобальное выравнивание (для справки):
//   lc0.right tab   global-y = 0   + 71  = 71
//   rc0.left pocket global-y = 0   + 71  = 71  ✓
//   lc0.bottom pkt  global-x = 0   + 107 = 107
//   lc1.top tab     global-x = 0   + 107 = 107 ✓
//   rc0.bottom tab  global-x = 220 + 77  = 297
//   rc1.top pocket  global-x = 140 + 157 = 297 ✓
//   lc1.right pkt   global-y = 127 + 109 = 236
//   rc1.left tab    global-y = 147 + 89  = 236 ✓
//   lc1.bottom tab  global-x = 0   + 77  = 77
//   lc2.top pocket  global-x = 0   + 77  = 77  ✓
//   lc2.right tab   global-y = 330 + 74  = 404
//   rc2.left pocket global-y = 310 + 94  = 404 ✓
// ─────────────────────────────────────────────────────────────────────────────
const RAW = [
    {   // lc0 — Совпадения
        x:0,   y:0,   w:235, h:142, z:6,
        inner: { left:2,  top:23, width:175, height:94  },
        grad:  'radial-gradient(ellipse at 88% 12%,rgb(96, 42, 42) 0%,transparent 75%)',
        edges: {
            top:    { type:'pocket', center: 0.448 },  // no stitch (верх страницы)
            right:  { type:'tab',    center: 71/142  },  // ↔ rc0.left  pocket
            bottom: { type:'pocket', center: 107/235 },  // ↔ lc1.top   tab
        },
    },
    {   // rc0 — Приглашения
        x:216, y:0,   w:167, h:162, z:5,
        inner: { left:23, top:23, width:128, height:114 },
        grad:  'radial-gradient(ellipse at 15% 85%,rgb(96, 42, 42) 0%,transparent 75%)',
        edges: {
            top:    { type:'pocket', center: 0.48  },  // no stitch
            left:   { type:'pocket', center: 71/162  },  // ↔ lc0.right  tab
            bottom: { type:'tab',    center: 77/155  },  // ↔ rc1.top    pocket
        },
    },
    {   // lc1 — Календарь
        x:0,   y:123, w:155, h:218, z:11,
        inner: { left:2,  top:23, width:130, height:150 },
        grad:  'radial-gradient(ellipse at 85% 80%,rgb(96, 42, 42) 0%,transparent 75%)',
        edges: {
            top:    { type:'tab',    center: 107/155  },  // ↔ lc0.bottom pocket
            right:  { type:'pocket', center: 109/218  },  // ↔ rc1.left   tab
            bottom: { type:'tab',    center: 77/155   },  // ↔ lc2.top    pocket
        },
    },
    {   // rc1 — Что нравится  (hEff=178 — видимая высота пути < style height)
        x:136, y:143, w:265, h:198, z:13,
        inner: { left:23, top:8,  width:208, height:165 },
        grad:  'radial-gradient(ellipse at 12% 15%,rgb(96, 42, 42) 0%,transparent 75%)',
        hEff:  178,
        edges: {
            top:    { type:'pocket', center: 157/255 },  // ↔ rc0.bottom tab
            right:  { type:'tab',    center: 89/178  },  // no stitch
            bottom: { type:'pocket', center: 127/255 },  // no stitch (декоративный)
            left:   { type:'tab',    center: 89/178  },  // ↔ lc1.right  pocket
        },
    },
    {   // lc2 — Статистика пары
        x:0,   y:322, w:235, h:148, z:4,
        inner: { left:2,  top:23, width:211, height:120 },
        grad:  'radial-gradient(ellipse at 50% 5%,rgb(96, 42, 42) 0%,transparent 75%)',
        edges: {
            top:   { type:'pocket', center: 77/235  },  // ↔ lc1.bottom tab
            right: { type:'tab',    center: 74/148  },  // ↔ rc2.left   pocket
        },
    },
    {   // rc2 — История свиданий
        x:216, y:302, w:171, h:168, z:5,
        inner: { left:2,  top:23, width:150, height:120 },
        grad:  'radial-gradient(ellipse at 0% 0%,rgb(96, 42, 42) 0%,transparent 75%)',
        edges: {
            top:  { type:'tab',    center: 47/155  },  // no stitch
            left: { type:'pocket', center: 94/168  },  // ↔ lc2.right  tab
        },
    },
];

export const TILES = RAW.map(({ x, y, w, h, z, inner, grad, edges, hEff }) => ({
    style: { left: x, top: y, width: w, height: h, zIndex: z },
    clip:  makePuzzlePath(w, h, edges, PUZZLE_CFG, hEff),
    grad,
    inner,
}));

export function makeHeroPath(W, H, cfg = PUZZLE_CFG) {
    const { depth: D, hst: HST, n: N, n2t: N2T, m: M } = cfg;

    const p = v => String(Math.round(v * 10) / 10);

    // два “зуба” — примерно как у тебя сейчас
    const centers = [0.28, 0.79];

    function bottomTab(at) {
        const h = HST;
        const k = N2T;

        return [
            `L ${p(at+h)},${p(H)}`,
            `C ${p(at+h)},${p(H+N)} ${p(at+h+k)},${p(H+M)} ${p(at+h+k)},${p(H+D/2)}`,
            `C ${p(at+h+k)},${p(H+D)} ${p(at-h-k)},${p(H+D)} ${p(at-h-k)},${p(H+D/2)}`,
            `C ${p(at-h-k)},${p(H+M)} ${p(at-h)},${p(H+N)} ${p(at-h)},${p(H)}`,
        ].join(' ');
    }

    const parts = [
        `M 0,0`,
        `L ${p(W)},0`,
        `L ${p(W)},${p(H)}`,
    ];

    // добавляем зубцы
    centers
        .map(c => c * W)
        .sort((a, b) => b - a) // справа налево
        .forEach(at => parts.push(bottomTab(at)));

    parts.push(`L 0,${p(H)}`);
    parts.push('Z');

    return `path('${parts.join(' ')}')`;
}