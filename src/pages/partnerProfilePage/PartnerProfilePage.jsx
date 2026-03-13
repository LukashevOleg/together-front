import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PartnerProfilePage.css';

// ── Заглушки ───────────────────────────────────────────────────────────────
const STUB_PARTNER = {
    name: 'Анастасия',
    emoji: '🌸',
    avatarUrl: null,
    isOnline: true,
    matches: 14,
    dates: 8,
    together: 42, // дней вместе
};

const ALL_INTERESTS = [
    { key: 'ROMANTIC',  emoji: '🌹', label: 'Романтика', liked: true },
    { key: 'FOOD',      emoji: '🍷', label: 'Гастро',    liked: true },
    { key: 'NATURE',    emoji: '🌿', label: 'Природа',   liked: true },
    { key: 'CULTURE',   emoji: '🎨', label: 'Культура',  liked: false },
    { key: 'EXTREME',   emoji: '⚡', label: 'Экстрим',   liked: false },
    { key: 'RELAX',     emoji: '🧖', label: 'Релакс',    liked: true },
    { key: 'ACTIVE',    emoji: '🏃', label: 'Активное',  liked: false },
    { key: 'NIGHTLIFE', emoji: '🌙', label: 'Ночные',    liked: true },
];

const STUB_DATES = [
    { id: 1, emoji: '🌹', bg: 'linear-gradient(135deg,#3D0A14,#7B1E2E)', title: 'Вечерний пикник на крыше', meta: '15 февраля · 2 часа',  rating: '5.0' },
    { id: 2, emoji: '⛸',  bg: 'linear-gradient(135deg,#1A1A1A,#383838)', title: 'Катание на коньках',       meta: '2 февраля · 1.5 часа', rating: '4.8' },
    { id: 3, emoji: '🍷', bg: 'linear-gradient(135deg,#1C1C1C,#3A3A3A)', title: 'Винная дегустация',        meta: '20 января · 2 часа',   rating: '4.9' },
];

export default function PartnerProfilePage() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleRemovePartner = () => {
        setMenuOpen(false);
        if (window.confirm(`Удалить ${STUB_PARTNER.name} из партнёров?\nВся история свиданий и чаты будут сохранены.`)) {
            // TODO: вызвать removePartner() из profilerApi
            navigate('/lubimka', { replace: true });
        }
    };

    return (
        <div className="partner-profile-page">
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

            <div className="pp-scroll">
                {/* HERO */}
                <div className="pp-hero">
                    {STUB_PARTNER.avatarUrl
                        ? <img className="pp-hero-photo" src={STUB_PARTNER.avatarUrl} alt="partner" />
                        : <div className="pp-hero-emoji">{STUB_PARTNER.emoji}</div>
                    }
                    <div className="pp-hero-overlay" />
                    <div className="pp-sparkles">✨</div>

                    {/* Кнопка назад */}
                    <button className="pp-btn-back" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>

                    {/* Три точки */}
                    <button className="pp-btn-dots" onClick={() => setMenuOpen(o => !o)}>
                        <svg viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="5"  r="1" fill="#fff" stroke="none"/>
                            <circle cx="12" cy="12" r="1" fill="#fff" stroke="none"/>
                            <circle cx="12" cy="19" r="1" fill="#fff" stroke="none"/>
                        </svg>
                    </button>
                    <div className={`pp-menu-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
                    <div className={`pp-dots-menu ${menuOpen ? 'open' : ''}`}>
                        <div className="pp-dots-menu-item" onClick={handleRemovePartner}>
                            <svg viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                            Удалить партнёра
                        </div>
                    </div>

                    {/* Имя */}
                    <div className="pp-name-block">
                        <div className="pp-name">{STUB_PARTNER.name}</div>
                        <div className="pp-online">
                            {STUB_PARTNER.isOnline && <div className="pp-online-dot" />}
                            <div className="pp-online-label">
                                {STUB_PARTNER.isOnline ? 'Онлайн сейчас' : 'Была недавно'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* STATS STRIP */}
                <div className="pp-stats-strip">
                    <div className="pp-stat">
                        <div className="pp-stat-num">{STUB_PARTNER.matches}</div>
                        <div className="pp-stat-label">совпадений</div>
                    </div>
                    <div className="pp-stat">
                        <div className="pp-stat-num">{STUB_PARTNER.dates}</div>
                        <div className="pp-stat-label">свиданий</div>
                    </div>
                    <div className="pp-stat">
                        <div className="pp-stat-num">{STUB_PARTNER.together}</div>
                        <div className="pp-stat-label">дней вместе</div>
                    </div>
                </div>

                <div className="pp-content">
                    <div style={{ height: 20 }} />

                    {/* INVITE CARD */}
                    <div className="pp-invite-card">
                        <div className="pp-invite-left">
                            <div className="pp-invite-label">Позвать на свидание</div>
                            <div className="pp-invite-title">Отправить<br/>приглашение</div>
                        </div>
                        <div className="pp-invite-emoji">💌</div>
                    </div>

                    {/* INTERESTS */}
                    <div className="pp-section-title">
                        Что <span>нравится</span> {STUB_PARTNER.name}
                    </div>
                    <div className="pp-pref-grid">
                        {ALL_INTERESTS.map(i => (
                            <div key={i.key} className={`pp-pref-chip ${i.liked ? 'liked' : ''}`}>
                                {i.emoji} {i.label}
                            </div>
                        ))}
                    </div>

                    {/* PAST DATES */}
                    <div className="pp-section-title" style={{ marginBottom: 12 }}>
                        Прошлые <span>свидания</span>
                    </div>
                    {STUB_DATES.map(d => (
                        <div key={d.id} className="pp-date-item">
                            <div className="pp-date-ava" style={{ background: d.bg }}>{d.emoji}</div>
                            <div className="pp-date-info">
                                <div className="pp-date-title">{d.title}</div>
                                <div className="pp-date-meta">{d.meta}</div>
                            </div>
                            <div className="pp-date-rating">⭐ {d.rating}</div>
                        </div>
                    ))}

                    <div style={{ height: 20 }} />
                </div>
            </div>
        </div>
    );
}