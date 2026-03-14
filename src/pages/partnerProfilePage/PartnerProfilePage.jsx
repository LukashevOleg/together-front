import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPartner, getProfileById, removePartner } from '../../api/profilerApi';
import { getMatches }     from '../../api/swipesApi';
import { getDateHistory } from '../../api/datingApi';
import { categoryEmoji, categoryGradient } from '../../api/datingApi';
import './PartnerProfilePage.css';

// ── Helpers ────────────────────────────────────────────────────────────────
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

function daysSince(isoDate) {
    if (!isoDate) return null;
    const diff = Date.now() - new Date(isoDate).getTime();
    return Math.floor(diff / 86400000);
}

function formatDateMeta(event) {
    if (!event?.scheduledDate) return '';
    const d = new Date(event.scheduledDate);
    const months = ['января','февраля','марта','апреля','мая','июня',
        'июля','августа','сентября','октября','ноября','декабря'];
    let s = `${d.getDate()} ${months[d.getMonth()]}`;
    if (event.scheduledTime) s += ` · ${event.scheduledTime.slice(0,5)}`;
    return s;
}

export default function PartnerProfilePage() {
    const navigate  = useNavigate();

    const [loading,  setLoading]  = useState(true);
    const [partner,  setPartner]  = useState(null);  // из getPartner() — id, name, avatarUrl, connectedAt
    const [profile,  setProfile]  = useState(null);  // из getProfileById() — интересы, город, возраст
    const [matches,  setMatches]  = useState([]);     // из getMatches()
    const [history,  setHistory]  = useState([]);     // из getDateHistory()
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        // Сначала получаем партнёра чтобы узнать его userId
        getPartner()
            .then(async (partnerData) => {
                if (cancelled || !partnerData) return;
                setPartner(partnerData);

                // Параллельно грузим профиль партнёра, матчи и историю
                const [profileData, matchesData, historyData] = await Promise.all([
                    getProfileById(partnerData.id).catch(() => null),
                    getMatches().catch(() => []),
                    getDateHistory().catch(() => []),
                ]);

                if (cancelled) return;
                setProfile(profileData);
                setMatches(matchesData);
                setHistory(historyData);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, []);

    const handleRemovePartner = async () => {
        setMenuOpen(false);
        const name = partner?.name || 'партнёра';
        if (!window.confirm(`Удалить ${name} из партнёров?\nВся история свиданий и чаты будут сохранены.`)) return;
        try {
            await removePartner();
            navigate('/lubimka', { replace: true });
        } catch {
            alert('Не удалось удалить партнёра. Попробуйте ещё раз.');
        }
    };

    if (loading) {
        return (
            <div className="partner-profile-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#888', fontSize: 14 }}>Загружаем профиль…</div>
            </div>
        );
    }

    if (!partner) {
        return (
            <div className="partner-profile-page" style={{ alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💔</div>
                <div style={{ fontFamily: 'Cormorant, serif', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Нет партнёра</div>
                <div style={{ fontSize: 14, color: '#888' }}>Пригласите половинку в разделе Любимка</div>
                <button onClick={() => navigate('/lubimka')}
                        style={{ marginTop: 16, background: '#7B1E2E', color: '#fff', border: 'none',
                            borderRadius: 14, padding: '12px 24px', fontSize: 14, cursor: 'pointer' }}>
                    Любимка
                </button>
            </div>
        );
    }

    // Данные для отображения
    const name         = partner.name || 'Партнёр';
    const avatarUrl    = partner.avatarUrl || null;
    const together     = daysSince(partner.connectedAt);
    const datesCount   = history.length;
    const matchesCount = matches.length;
    const interests    = profile?.interests || [];

    // Прошлые свидания (история, до 3 штук)
    const pastDates = history.slice(0, 3);

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
                    {avatarUrl
                        ? <img className="pp-hero-photo" src={avatarUrl} alt={name} />
                        : <div className="pp-hero-emoji">
                            {name[0]?.toUpperCase() || '🌸'}
                        </div>
                    }
                    <div className="pp-hero-overlay" />
                    <div className="pp-sparkles">✨</div>

                    {/* Назад */}
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
                    <div className={`pp-menu-overlay ${menuOpen ? 'open' : ''}`}
                         onClick={() => setMenuOpen(false)} />
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
                        <div className="pp-name">{name}</div>
                        {profile?.city && (
                            <div className="pp-online">
                                <div className="pp-online-label" style={{ opacity: 0.7 }}>
                                    📍 {profile.city}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* STATS STRIP */}
                <div className="pp-stats-strip">
                    <div className="pp-stat">
                        <div className="pp-stat-num">{matchesCount}</div>
                        <div className="pp-stat-label">совпадений</div>
                    </div>
                    <div className="pp-stat">
                        <div className="pp-stat-num">{datesCount}</div>
                        <div className="pp-stat-label">свиданий</div>
                    </div>
                    <div className="pp-stat">
                        <div className="pp-stat-num">{together ?? '—'}</div>
                        <div className="pp-stat-label">дней вместе</div>
                    </div>
                </div>

                <div className="pp-content">
                    <div style={{ height: 20 }} />

                    {/* INVITE CARD */}
                    <div className="pp-invite-card" onClick={() => navigate('/planned')}>
                        <div className="pp-invite-left">
                            <div className="pp-invite-label">Позвать на свидание</div>
                            <div className="pp-invite-title">Запланировать<br/>свидание</div>
                        </div>
                        <div className="pp-invite-emoji">💌</div>
                    </div>

                    {/* INTERESTS */}
                    {interests.length > 0 && (
                        <>
                            <div className="pp-section-title">
                                Что <span>нравится</span> {name}
                            </div>
                            <div className="pp-pref-grid">
                                {Object.keys(INTEREST_META).map(key => {
                                    const meta  = INTEREST_META[key];
                                    const liked = interests.includes(key);
                                    return (
                                        <div key={key} className={`pp-pref-chip ${liked ? 'liked' : ''}`}>
                                            {meta.emoji} {meta.label}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* PAST DATES */}
                    {pastDates.length > 0 && (
                        <>
                            <div className="pp-section-title" style={{ marginBottom: 12 }}>
                                Прошлые <span>свидания</span>
                            </div>
                            {pastDates.map(event => (
                                <div key={event.id} className="pp-date-item"
                                     onClick={() => navigate('/chats', { state: { eventId: event.id } })}>
                                    <div className="pp-date-ava"
                                         style={{ background: categoryGradient(event.ideaCategory) }}>
                                        {categoryEmoji(event.ideaCategory)}
                                    </div>
                                    <div className="pp-date-info">
                                        <div className="pp-date-title">{event.ideaTitle}</div>
                                        <div className="pp-date-meta">{formatDateMeta(event)}</div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Заглушка если нет ни интересов ни свиданий */}
                    {interests.length === 0 && pastDates.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#888', fontSize: 14 }}>
                            {name} ещё не заполнил(а) профиль
                        </div>
                    )}

                    <div style={{ height: 20 }} />
                </div>
            </div>
        </div>
    );
}