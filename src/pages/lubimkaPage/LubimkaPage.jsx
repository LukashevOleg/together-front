import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPartner, getProfileById, removePartner } from '../../api/profilerApi';
import { getMatches }     from '../../api/swipesApi';
import { getActiveChats, getDateHistory } from '../../api/datingApi';
import BottomNav from '../../components/layout/BottomNav';
import './LubimkaPage.css';

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

const TILES = [
    {
        key: 'lc0',
        style: { left: 0,   top: 0,     width: 235, height: 142, zIndex: 6  },
        clip: "path('M 0,0 L 89,0 C 89,4 85,5 85,10 C 85,20 129,20 129,10 C 129,5 125,4 125,0 L 215,0 L 215,63 C 219,63 220,55 225,55 C 235,55 235,87 225,87 C 220,87 219,79 215,79 L 215,142 L 125,142 C 125,138 129,137 129,132 C 129,122 85,122 85,132 C 85,137 89,138 89,142 L 0,142 Z')",
        grad: 'radial-gradient(ellipse at 88% 12%,rgba(123,30,46,.85) 0%,transparent 60%)',
        inner: { left: 2,  top: 23, width: 175, height: 94 },
    },
    {
        key: 'rc0',
        style: { left: 220, top: 0,     width: 155, height: 162, zIndex: 5  },
        clip: "path('M 0,0 L 59,0 C 59,4 55,5 55,10 C 55,20 99,20 99,10 C 99,5 95,4 95,0 L 155,0 L 155,142 L 85,142 C 85,146 93,147 93,152 C 93,162 61,162 61,152 C 61,147 69,146 69,142 L 0,142 L 0,89 C 4,89 5,93 10,93 C 20,93 20,49 10,49 C 5,49 4,53 0,53 Z')",
        grad: 'radial-gradient(ellipse at 15% 85%,rgba(123,30,46,.85) 0%,transparent 60%)',
        inner: { left: 23, top: 23, width: 128, height: 114 },
    },
    {
        key: 'lc1',
        style: { left: 0,   top: 127,   width: 155, height: 218, zIndex: 11 },
        clip: "path('M 0,20 L 99,20 C 99,16 91,15 91,10 C 91,0 123,0 123,10 C 123,15 115,16 115,20 L 155,20 L 155,91 C 151,91 150,87 145,87 C 135,87 135,131 145,131 C 150,127 151,127 155,127 L 155,198 L 85,198 C 85,202 93,203 93,208 C 93,218 61,218 61,208 C 61,203 69,202 69,198 L 0,198 Z')",
        grad: 'radial-gradient(ellipse at 85% 80%,rgba(123,30,46,.85) 0%,transparent 60%)',
        inner: { left: 2,  top: 23, width: 130, height: 150 },
    },
    {
        key: 'rc1',
        style: { left: 140, top: 147,   width: 255, height: 198, zIndex: 13 },
        clip: "path('M 20,0 L 139,0 C 139,4 135,5 135,10 C 135,20 179,20 179,10 C 179,5 175,4 175,0 L 235,0 L 235,81 C 239,81 240,73 245,73 C 255,73 255,105 245,105 C 240,105 239,97 235,97 L 235,178 L 145,178 C 145,174 149,173 149,168 C 149,158 105,158 105,168 C 105,173 109,174 109,178 L 20,178 L 20,97 C 16,97 15,105 10,105 C 0,105 0,73 10,73 C 15,73 16,81 20,81 Z')",
        grad: 'radial-gradient(ellipse at 12% 15%,rgba(123,30,46,.85) 0%,transparent 60%)',
        inner: { left: 23, top: 8,  width: 208, height: 165 },
    },
    {
        key: 'lc2',
        style: { left: 0,   top: 330,   width: 235, height: 148, zIndex: 4  },
        clip: "path('M 0,0 L 59,0 C 59,4 55,5 55,10 C 55,20 99,20 99,10 C 99,5 95,4 95,0 L 215,0 L 215,66 C 219,66 220,58 225,58 C 235,58 235,90 225,90 C 220,90 219,82 215,82 L 215,148 L 0,148 Z')",
        grad: 'radial-gradient(ellipse at 50% 5%,rgba(123,30,46,.85) 0%,transparent 60%)',
        inner: { left: 2,  top: 23, width: 211, height: 120 },
    },
    {
        key: 'rc2',
        style: { left: 220, top: 310,   width: 155, height: 168, zIndex: 5  },
        clip: "path('M 0,20 L 39,20 C 39,16 31,15 31,10 C 31,0 63,0 63,10 C 63,15 55,16 55,20 L 155,20 L 155,168 L 0,168 L 0,112 C 4,112 5,116 10,116 C 20,116 20,72 10,72 C 5,72 4,76 0,76 Z')",
        grad: 'radial-gradient(ellipse at 50% 95%,rgba(123,30,46,.85) 0%,transparent 60%)',
        inner: { left: 2,  top: 23, width: 150, height: 120 },
    },
];

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
                        : <span style={{ fontSize: 13, color: '#888' }}>Предпочтения не заполнены</span>
                    }
                </div>
            </div>
        </>
    );
}

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
                    <div style={{ fontSize: 56, marginBottom: 12 }}>💝</div>
                    <div style={{ fontFamily: 'Cormorant, serif', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Нет партнёра</div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>Пригласите половинку по ссылке</div>
                    <button className="lb2-invite-btn" onClick={() => navigate('/onboarding')}>Пригласить партнёра</button>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="lb2-page">
            <div className="lb2-status-bar">
                <span>9:41</span>
                <div className="lb2-status-icons">
                    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="1" y="6" width="3" height="12" rx="1"/><rect x="6" y="9" width="3" height="9" rx="1"/><rect x="11" y="5" width="3" height="13" rx="1"/><rect x="16" y="2" width="3" height="16" rx="1"/></svg>
                </div>
            </div>

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

                {/* HERO */}
                <div className="lb2-hero">
                    {partner?.avatarUrl
                        ? <img src={partner.avatarUrl} alt={partner.name} className="lb2-hero-img" />
                        : <div className="lb2-hero-fallback"><span style={{ fontSize: 88 }}>🌸</span></div>
                    }
                    <div className="lb2-hero-overlay" />
                    <div className="lb2-hero-name">{partner?.name || 'Партнёр'}</div>
                </div>

                {/* PUZZLE */}
                <div className="lb2-puzzle">

                    {/* Popup интересов */}
                    {prefsOpen && (
                        <PrefsOverlay
                            name={partner?.name || 'партнёру'}
                            interests={interests}
                            onClose={() => setPrefsOpen(false)}
                        />
                    )}

                    {/* lc0 — Совпадения → /matches */}
                    <Tile tile={TILES[0]} onClick={() => navigate('/matches')}>
                        <div className="lb2-tile-label">Ваши совпадения</div>
                        <div className="lb2-tile-num">{loading ? '…' : matchesCount}</div>
                        <div className="lb2-tile-sub">идей понравились обоим</div>
                    </Tile>

                    {/* rc0 — Приглашения → /invitations */}
                    <Tile tile={TILES[1]} onClick={() => navigate('/invitations')}>
                        <div className="lb2-tile-label">Приглашения</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                            <div className="lb2-tile-num-lg">{loading ? '…' : chats.length}</div>
                        </div>
                        {pendingChats > 0 && (
                            <div className="lb2-tile-sub">{pendingChats} новых</div>
                        )}
                    </Tile>

                    {/* lc1 — Календарь */}
                    <Tile tile={TILES[2]} onClick={() => navigate('/calendar')}>
                        <div className="lb2-tile-label">Календарь</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="90" height="90" viewBox="0 0 24 24" fill="none"
                                 stroke="rgba(0,0,0,.75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8"  y1="2" x2="8"  y2="6"/>
                                <line x1="3"  y1="10" x2="21" y2="10"/>
                                <rect x="7"  y="14" width="3" height="3" rx=".5" fill="rgba(0,0,0,.75)" stroke="none"/>
                                <rect x="11" y="14" width="3" height="3" rx=".5" fill="rgba(0,0,0,.75)" stroke="none"/>
                                <rect x="15" y="14" width="3" height="3" rx=".5" fill="rgba(0,0,0,.75)" stroke="none"/>
                            </svg>
                        </div>
                    </Tile>

                    {/* rc1 — Интересы → popup */}
                    <Tile tile={TILES[3]} onClick={() => setPrefsOpen(true)}>
                        <div>
                            <div className="lb2-tile-label">Что нравится</div>
                            <div className="lb2-tile-name">{partner?.name || 'партнёру'}</div>
                        </div>
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
                    <Tile tile={TILES[4]} onClick={() => navigate('/calendar')}>
                        <div className="lb2-tile-label">Статистика пары</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                            <div style={{ fontFamily: 'Cormorant, serif', fontSize: 56, fontWeight: 600, lineHeight: 1, color: '#111' }}>
                                {loading ? '…' : datesCount}
                            </div>
                            <div style={{ fontFamily: 'Cormorant, serif', fontSize: 22, fontWeight: 600, color: '#111' }}>
                                {datesCount === 1 ? 'свидание' : 'свиданий'}
                            </div>
                        </div>
                    </Tile>

                    {/* rc2 — История */}
                    <Tile tile={TILES[5]} onClick={() => navigate('/calendar')}>
                        <div className="lb2-tile-label" style={{ whiteSpace: 'nowrap' }}>История свиданий</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="90" height="90" viewBox="0 0 24 24" fill="none"
                                 stroke="rgba(0,0,0,.75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8"/>
                                <polyline points="3 3 3 8 8 8"/>
                                <polyline points="12 7 12 12 15 15"/>
                            </svg>
                        </div>
                    </Tile>

                </div>
                <div style={{ height: 10 }} />
            </div>

            <BottomNav />
        </div>
    );
}