import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPartner, getProfileById, removePartner } from '../../api/profilerApi';
import { getMatches }     from '../../api/swipesApi';
import { getActiveChats, getDateHistory } from '../../api/datingApi';
import BottomNav from '../../components/layout/BottomNav';
import './LubimkaPage.css';
import { TILES, makeHeroPath, PUZZLE_CFG } from '../../utils/puzzleUtils';

const INTEREST_META = {
    ROMANTIC:  { emoji: '🌹', label: 'Романтика' },
    FOOD:      { emoji: '🍷', label: 'Гастро'    },
    NATURE:    { emoji: '🌿', label: 'Природа'   },
    CULTURE:   { emoji: '🎨', label: 'Культура'  },
    EXTREME:   { emoji: '⚡', label: 'Экстрим'   },
    RELAX:     { emoji: '🧖', label: 'Релакс'    },
    ACTIVE:    { emoji: '🏃', label: 'Активное'  },
    NIGHTLIFE: { emoji: '🌙', label: 'Ночные'    },
};

function daysSince(iso) {
    if (!iso) return null;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function PrefsOverlay({ name, interests, onClose }) {
    const liked = Object.keys(INTEREST_META).filter(k => interests.includes(k));
    return (
        <>
            <div className="lb2-pref-bg" onClick={onClose} />
            <div className="lb2-pref-overlay">
                <div className="lb2-pref-grad" />
                <div className="lb2-pref-chips">
                    {liked.length > 0
                        ? liked.map(key => {
                            const meta = INTEREST_META[key];
                            return (
                                <span key={key} className="lb2-pref-chip">
                                    {meta.emoji} {meta.label}
                                </span>
                            );
                        })
                        : <span className="lb2-pref-no-data">Предпочтения не заполнены</span>
                    }
                </div>
            </div>
        </>
    );
}

function Tile({ tile, onClick, children }) {
    const { style, clip, grad, inner } = tile;
    return (
        <div
            className="lb2-tile"
            style={{
                position: 'absolute',
                left: style.left, top: style.top,
                width: style.width, height: style.height,
                zIndex: style.zIndex,
                clipPath: clip,
                cursor: 'pointer',
            }}
            onClick={onClick}
        >
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: grad, zIndex: 0 }} />
            <div style={{
                position: 'absolute',
                left: inner.left, top: inner.top,
                width: inner.width, height: inner.height,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                padding: '10px 10px 8px', zIndex: 1,
            }}>
                {children}
            </div>
        </div>
    );
}

// Базовая ширина паззла (под неё рассчитаны все координаты в puzzleUtils.js)
const PUZZLE_BASE_W = 375;
const PUZZLE_BASE_H = 503;
const HERO_H = 240;

export default function LubimkaPage() {
    const navigate = useNavigate();

    const [partner,     setPartner]     = useState(null);
    const [profile,     setProfile]     = useState(null);
    const [matches,     setMatches]     = useState([]);
    const [chats,       setChats]       = useState([]);
    const [history,     setHistory]     = useState([]);
    const [menuOpen,    setMenuOpen]    = useState(false);
    const [prefsOpen,   setPrefsOpen]   = useState(false);
    const [loading,     setLoading]     = useState(true);

    // Ширина экрана — нужна для масштабирования паззла и clip-path героя
    const [vw, setVw] = useState(() => Math.min(window.innerWidth, 430));
    useEffect(() => {
        const update = () => setVw(Math.min(window.innerWidth, 430));
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Масштаб паззла относительно базовой ширины 375px
    const puzzleScale = vw / PUZZLE_BASE_W;
    // Реальная высота контейнера после масштабирования
    const puzzleWrapH = Math.round(PUZZLE_BASE_H * puzzleScale);
    // Высота hero масштабируется вместе с паззлом чтобы не было зазора
    const heroH = Math.round(HERO_H * puzzleScale);
    // Глубина зуба после масштабирования — паззл заходит под hero на это значение
    const toothDepth = Math.round(PUZZLE_CFG.depth * puzzleScale);

    // Конфиг для hero path — все параметры пропорционально масштабированы,
    // чтобы зубчики героя совпадали с пазами тайлов паззла
    const scaledCfg = {
        depth: PUZZLE_CFG.depth * puzzleScale,
        hst:   PUZZLE_CFG.hst   * puzzleScale,
        hsp:   PUZZLE_CFG.hsp   * puzzleScale,
        n:     PUZZLE_CFG.n     * puzzleScale,
        n2t:   PUZZLE_CFG.n2t   * puzzleScale,
        n2p:   PUZZLE_CFG.n2p   * puzzleScale,
        m:     PUZZLE_CFG.m     * puzzleScale,
    };

    // Hero clip-path: ширина = реальная ширина экрана, конфиг масштабирован
    const heroClip = makeHeroPath(vw, heroH, scaledCfg);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getPartner().catch(() => null),
            getMatches().catch(() => []),
            getActiveChats().catch(() => []),
            getDateHistory().catch(() => []),
        ]).then(([partnerData, matchesData, chatsData, historyData]) => {
            if (cancelled) return;
            setPartner(partnerData);
            setMatches(matchesData);
            setChats(chatsData);
            setHistory(historyData);
            setLoading(false);
            if (partnerData?.id) {
                getProfileById(partnerData.id).then(p => {
                    if (!cancelled) setProfile(p);
                }).catch(() => {});
            }
        });
        return () => { cancelled = true; };
    }, []);

    const handleRemovePartner = async () => {
        setMenuOpen(false);
        if (!window.confirm(`Удалить ${partner?.name || 'партнёра'} из партнёров?\nВся история свиданий и чаты будут сохранены.`)) return;
        try { await removePartner(); navigate('/lubimka'); }
        catch { alert('Ошибка. Попробуйте ещё раз.'); }
    };

    const matchesCount  = matches.length;
    const pendingChats  = chats.filter(c => c.status === 'PENDING').length;
    const datesCount    = history.length;
    const interests     = profile?.interests || [];

    if (!loading && !partner) {
        return (
            <div className="lb2-page">
                <div className="lb2-empty">
                    <div className="lb2-empty-emoji">💝</div>
                    <div className="lb2-empty-title">Нет партнёра</div>
                    <div className="lb2-empty-sub">Пригласите половинку по ссылке</div>
                    <button className="lb2-invite-btn" onClick={() => navigate('/onboarding')}>
                        Пригласить партнёра
                    </button>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="lb2-page">
            <div className="lb2-scroll">

                {/* HEADER */}
                <div className="lb2-header">
                    <div className="lb2-title">Люби<span>мка</span></div>
                    <div style={{ position: 'relative' }}>
                        <button className="lb2-dots-btn" onClick={() => setMenuOpen(o => !o)}>
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <circle cx="12" cy="5"  r="1.5" fill="#111"/>
                                <circle cx="12" cy="12" r="1.5" fill="#111"/>
                                <circle cx="12" cy="19" r="1.5" fill="#111"/>
                            </svg>
                        </button>
                        {menuOpen && (
                            <>
                                <div className="lb2-menu-overlay" onClick={() => setMenuOpen(false)} />
                                <div className="lb2-dots-menu">
                                    <div className="lb2-menu-item danger" onClick={handleRemovePartner}>
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#C0392B" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                            <path d="M10 11v6"/><path d="M14 11v6"/>
                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                        </svg>
                                        Удалить партнёра
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* HERO:
                    - внешний div: логическая высота heroH (для layout потока)
                    - внутренние img/fallback: heroH + toothDepth (пиксели есть в зоне зубьев)
                    - clipPath на внутренних элементах, а не на div
                    - overflow: visible на внешнем div → зубья выходят вниз */}
                <div className="lb2-hero" style={{ height: heroH }}>
                    {partner?.avatarUrl
                        ? <img
                            src={partner.avatarUrl}
                            alt={partner.name}
                            className="lb2-hero-img"
                            style={{ height: heroH + toothDepth, clipPath: heroClip }}
                        />
                        : <div
                            className="lb2-hero-fallback"
                            style={{ height: heroH + toothDepth, clipPath: heroClip }}
                        >
                            <span className="lb2-fallback-emoji">🌸</span>
                        </div>
                    }
                    <div
                        className="lb2-hero-overlay"
                        style={{ height: heroH + toothDepth, clipPath: heroClip }}
                    />
                    <div className="lb2-hero-name">{partner?.name || 'Партнёр'}</div>
                </div>

                {/* PUZZLE — начинается сразу после lb2-hero (marginTop: 0).
                    Зубья hero выходят вниз за heroH через overflow:visible
                    и перекрывают верх паззла (z-index hero 15 > puzzle 10) */}
                <div
                    className="lb2-puzzle-wrap"
                    style={{ height: puzzleWrapH }}
                >
                    <div
                        className="lb2-puzzle"
                        style={{
                            transform: `scale(${puzzleScale})`,
                            transformOrigin: 'top left',
                        }}
                    >
                        {prefsOpen && (
                            <PrefsOverlay
                                name={partner?.name || 'партнёру'}
                                interests={interests}
                                onClose={() => setPrefsOpen(false)}
                            />
                        )}

                        {/* lc0 — Совпадения */}
                        <Tile tile={TILES[0]} onClick={() => navigate('/matches')}>
                            <div className="lb2-tile-label">Ваши совпадения</div>
                            <div className="lb2-tile-num">{loading ? '…' : matchesCount}</div>
                            <div className="lb2-tile-sub">идей понравились обоим</div>
                        </Tile>

                        {/* rc0 — Приглашения */}
                        <Tile tile={TILES[1]} onClick={() => navigate('/invitations')}>
                            <div className="lb2-tile-label">Приглашения</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                                <div className="lb2-tile-num-lg">{loading ? '...' : pendingChats}</div>
                            </div>
                            <div className="lb2-tile-sub">новых</div>
                        </Tile>

                        {/* lc1 — Календарь */}
                        <Tile tile={TILES[2]} onClick={() => navigate('/calendar')}>
                            <div className="lb2-tile-label">Календарь</div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="90" height="90" viewBox="0 0 24 24" fill="none"
                                     stroke="rgba(255,255,255,.65)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8"  y1="2" x2="8"  y2="6"/>
                                    <line x1="3"  y1="10" x2="21" y2="10"/>
                                    <rect x="7"  y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.65)" stroke="none"/>
                                    <rect x="11" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.65)" stroke="none"/>
                                    <rect x="15" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.65)" stroke="none"/>
                                </svg>
                            </div>
                        </Tile>

                        {/* rc1 — Интересы */}
                        <Tile tile={TILES[3]} onClick={() => setPrefsOpen(true)}>
                            <div className="lb2-tile-label">Что нравится</div>
                            <div className="lb2-tile-name">{partner?.name || 'партнёру'}</div>
                            <div className="lb2-chips">
                                {interests.length > 0
                                    ? interests.slice(0, 5).map(k => {
                                        const m = INTEREST_META[k];
                                        return m ? <span key={k} className="lb2-chip">{m.emoji} {m.label}</span> : null;
                                    })
                                    : <span className="lb2-chip-empty">Не заполнено</span>
                                }
                            </div>
                        </Tile>

                        {/* lc2 — Статистика */}
                        <Tile tile={TILES[4]} onClick={() => navigate('/stats')}>
                            <div className="lb2-tile-label">Статистика пары</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                                <div style={{ fontFamily: 'Cormorant, serif', fontSize: 56, fontWeight: 600, lineHeight: 1, color: '#fff' }}>
                                    {loading ? '…' : datesCount}
                                </div>
                                <div style={{ fontFamily: 'Cormorant, serif', fontSize: 22, fontWeight: 600, color: '#fff' }}>
                                    {datesCount === 1 ? 'свидание' : 'свиданий'}
                                </div>
                            </div>
                        </Tile>

                        {/* rc2 — История */}
                        <Tile tile={TILES[5]} onClick={() => navigate('/history')}>
                            <div className="lb2-tile-label" style={{ whiteSpace: 'nowrap' }}>История свиданий</div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="90" height="90" viewBox="0 0 24 24" fill="none"
                                     stroke="rgba(255,255,255,.65)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8"/>
                                    <polyline points="3 3 3 8 8 8"/>
                                    <polyline points="12 7 12 12 15 15"/>
                                </svg>
                            </div>
                        </Tile>
                    </div>
                </div>

            </div>
            <BottomNav />
        </div>
    );
}