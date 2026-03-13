import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import './LubimkaPage.css';

// ── Заглушки — потом заменим на данные с бэка ─────────────────────────────
const STUB_PARTNER = {
    name: 'Анастасия',
    emoji: '🌸',
    avatarUrl: null,
};

const STUB_MATCHES = [
    { id: 1, emoji: '🌹', title: 'Вечерний пикник на крыше',   meta: '1 800 ₽ · 2 ч',  bg: 'linear-gradient(135deg,#3D0A14,#7B1E2E)' },
    { id: 2, emoji: '⛸',  title: 'Катание на коньках',         meta: '900 ₽ · 1.5 ч',  bg: 'linear-gradient(135deg,#1A1A1A,#383838)' },
    { id: 3, emoji: '🍷', title: 'Винная дегустация',          meta: '2 500 ₽ · 2 ч',  bg: 'linear-gradient(135deg,#1C1C1C,#3A3A3A)' },
    { id: 4, emoji: '🎨', title: 'Мастер-класс по керамике',   meta: '1 800 ₽ · 3 ч',  bg: 'linear-gradient(135deg,#4A1020,#8B2535)' },
];

const STUB_CHATS = [
    { id: 1, emoji: '🌹', bg: 'linear-gradient(135deg,#3D0A14,#7B1E2E)', name: 'Вечерний пикник на крыше',  last: 'Анастасия: Что взять с собой?',              time: '20:21', unread: 2 },
    { id: 2, emoji: '🎨', bg: 'linear-gradient(135deg,#4A1020,#8B2535)', name: 'Мастер-класс по керамике', last: 'Видела эту студию — выглядит уютно',          time: 'вчера', unread: 1 },
    { id: 3, emoji: '⛸',  bg: 'linear-gradient(135deg,#1A1A1A,#383838)', name: 'Катание на коньках',        last: 'Вы: Берём горячий шоколад ☕',               time: 'пн',    unread: 0 },
];

const STUB_STATS = {
    matches: 14,
    dates: 8,
    streakNum: '3 подряд',
    streakDesc: 'каждые выходные 🔥',
    categories: [
        { label: '🌹 Романтика', pct: 82 },
        { label: '🍷 Гастро',    pct: 65 },
        { label: '🌿 Природа',   pct: 48 },
        { label: '🎨 Культура',  pct: 30 },
    ],
};

const hasPartner = true; // потом будет из API

export default function LubimkaPage() {
    const navigate = useNavigate();

    return (
        <div className="lubimka-page">
            {/* STATUS BAR */}
            <div className="status-bar">
                <span>9:41</span>
                <div className="status-icons">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="1" y="6" width="3" height="12" rx="1"/>
                        <rect x="6" y="9" width="3" height="9" rx="1"/>
                        <rect x="11" y="5" width="3" height="13" rx="1"/>
                        <rect x="16" y="2" width="3" height="16" rx="1"/>
                    </svg>
                </div>
            </div>

            {/* HEADER */}
            <div className="lb-header">
                <div className="lb-header-row">
                    <div>
                        <div className="lb-greeting">Ваша половинка</div>
                        <div className="lb-title">Люби<span>мка</span></div>
                    </div>

                    {hasPartner && (
                        <div className="lb-partner-badge" onClick={() => navigate('/partner')}>
                            <div className="lb-partner-ava">
                                {STUB_PARTNER.avatarUrl
                                    ? <img src={STUB_PARTNER.avatarUrl} alt="partner" />
                                    : STUB_PARTNER.emoji
                                }
                            </div>
                            <div className="lb-partner-name">{STUB_PARTNER.name}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="lb-scroll">

                {/* Нет партнёра */}
                {!hasPartner && (
                    <div className="lb-no-partner">
                        <div className="lb-no-partner-emoji">💌</div>
                        <div className="lb-no-partner-title">Пригласите половинку</div>
                        <div className="lb-no-partner-sub">
                            Отправьте ссылку партнёру, чтобы начать свайпать идеи вместе
                        </div>
                        <button className="lb-no-partner-btn" onClick={() => navigate('/profile')}>
                            Пригласить
                        </button>
                    </div>
                )}

                {/* SWIPE HERO */}
                {hasPartner && (
                    <div className="lb-swipe-hero">
                        <div className="lb-swipe-counter">12 новых идей</div>
                        <div className="lb-swipe-cards">
                            <div className="lb-swipe-card c3">🌿</div>
                            <div className="lb-swipe-card c2">🍷</div>
                            <div className="lb-swipe-card c1">🌹</div>
                        </div>
                        <div className="lb-swipe-tag">Совместные свайпы</div>
                        <div className="lb-swipe-title">Найдите идею, которая понравится обоим</div>
                        <div className="lb-swipe-sub">Свайпайте идеи — и узнайте совпадения с {STUB_PARTNER.name}</div>
                        <button className="lb-swipe-btn">
                            Начать свайпать
                            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                )}

                {/* MATCHES */}
                {hasPartner && (
                    <div className="lb-section">
                        <div className="lb-sec-header">
                            <div className="lb-sec-title">Ваши <span>совпадения</span></div>
                            <div className="lb-sec-link">Все {STUB_STATS.matches} →</div>
                        </div>
                        {STUB_MATCHES.length > 0 ? (
                            <div className="lb-matches-scroll">
                                {STUB_MATCHES.map(m => (
                                    <div key={m.id} className="lb-match-card">
                                        <div className="lb-match-img" style={{ background: m.bg }}>{m.emoji}</div>
                                        <div className="lb-match-body">
                                            <div className="lb-match-title">{m.title}</div>
                                            <div className="lb-match-meta">{m.meta}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="lb-matches-empty">
                                Пока совпадений нет — начните свайпать вместе 💝
                            </div>
                        )}
                    </div>
                )}

                {/* CHATS */}
                {hasPartner && (
                    <div className="lb-section">
                        <div className="lb-sec-header">
                            <div className="lb-sec-title">Чаты <span>свиданий</span></div>
                            <div className="lb-sec-link" onClick={() => navigate('/chats')}>Все →</div>
                        </div>
                        <div className="lb-chat-list">
                            {STUB_CHATS.map(c => (
                                <div key={c.id} className="lb-chat-row" onClick={() => navigate('/chats')}>
                                    <div className="lb-chat-ava" style={{ background: c.bg }}>{c.emoji}</div>
                                    <div className="lb-chat-info">
                                        <div className="lb-chat-name">{c.name}</div>
                                        <div className="lb-chat-last">{c.last}</div>
                                    </div>
                                    <div className="lb-chat-right">
                                        <div className="lb-chat-time">{c.time}</div>
                                        {c.unread > 0 && (
                                            <div className="lb-chat-unread">{c.unread}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STATS */}
                {hasPartner && (
                    <div className="lb-section">
                        <div className="lb-sec-header">
                            <div className="lb-sec-title">Стати<span>стика</span></div>
                        </div>
                        <div className="lb-stats-wrap">
                            <div className="lb-stats-row">
                                <div className="lb-stat-tile dark">
                                    <div className="lb-stat-icon">💝</div>
                                    <div className="lb-stat-num">{STUB_STATS.matches}</div>
                                    <div className="lb-stat-label">мэтчей за всё время</div>
                                </div>
                                <div className="lb-stat-tile burg">
                                    <div className="lb-stat-icon">🗓</div>
                                    <div className="lb-stat-num">{STUB_STATS.dates}</div>
                                    <div className="lb-stat-label">свиданий уже было</div>
                                </div>
                            </div>

                            <div className="lb-stat-wide">
                                <div className="lb-stat-wide-title">Любимые категории</div>
                                <div className="lb-bar-list">
                                    {STUB_STATS.categories.map(cat => (
                                        <div key={cat.label} className="lb-bar-item">
                                            <div className="lb-bar-label">{cat.label}</div>
                                            <div className="lb-bar-track">
                                                <div className="lb-bar-fill" style={{ width: `${cat.pct}%` }} />
                                            </div>
                                            <div className="lb-bar-val">{cat.pct}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lb-stat-streak">
                                <div className="lb-streak-left">
                                    <div className="lb-streak-label">Серия свиданий</div>
                                    <div className="lb-streak-num">{STUB_STATS.streakNum}</div>
                                    <div className="lb-streak-desc">{STUB_STATS.streakDesc}</div>
                                </div>
                                <div className="lb-streak-emoji">✨</div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ height: 20 }} />
            </div>

            <BottomNav onCreateClick={() => navigate('/ideas/create')} />
        </div>
    );
}