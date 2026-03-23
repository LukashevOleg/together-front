import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import { getMyProfile } from '../../api/profilerApi';
import './IdeasPage.css';

const CATEGORIES = [
    { key: 'ROMANTIC',      emoji: '🌹', label: 'Романтика',     count: 24 },
    { key: 'OUTDOOR',       emoji: '🌲', label: 'На природе',     count: 18 },
    { key: 'FOOD',          emoji: '🍷', label: 'Гастро',         count: 31 },
    { key: 'ACTIVE',        emoji: '⚡', label: 'Активный отдых', count: 15 },
    { key: 'CREATIVE',      emoji: '🎨', label: 'Творчество',     count: 12 },
    { key: 'INDOOR',        emoji: '🏠', label: 'Дома',           count: 20 },
    { key: 'WELLNESS',      emoji: '🧘', label: 'Релакс',         count: 8  },
    { key: 'ENTERTAINMENT', emoji: '🎭', label: 'Развлечение',    count: 22 },
];

export default function IdeasPage() {
    const navigate = useNavigate();
    const [search,   setSearch]   = useState('');
    const [city,     setCity]     = useState('');
    const [editCity, setEditCity] = useState(false);

    useEffect(() => {
        getMyProfile()
            .then(p => { if (p?.city) setCity(p.city); })
            .catch(() => {});
    }, []);

    const filtered = CATEGORIES.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="ideas-page">
            <div className="status-bar">
                <span>9:41</span>
                <div className="status-icons">
                    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="1" y="6" width="3" height="12" rx="1"/><rect x="6" y="9" width="3" height="9" rx="1"/><rect x="11" y="5" width="3" height="13" rx="1"/><rect x="16" y="2" width="3" height="16" rx="1"/></svg>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>
                    <svg viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M22 11v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="4" y="9" width="10" height="7" rx="1" fill="currentColor"/></svg>
                </div>
            </div>

            <div className="ideas-search-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div className="ideas-page-title">Иде<span>и</span></div>
                    <button
                        onClick={() => navigate('/ideas/create')}
                        style={{
                            background: '#7B1E2E',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 14,
                            padding: '8px 16px',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Создать
                    </button>
                </div>
                {/* Город */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    {editCity ? (
                        <input
                            autoFocus
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            onBlur={() => setEditCity(false)}
                            onKeyDown={e => e.key === 'Enter' && setEditCity(false)}
                            style={{
                                border: 'none', borderBottom: '1.5px solid #7B1E2E',
                                outline: 'none', fontSize: 13, color: '#111',
                                fontFamily: "'DM Sans', sans-serif",
                                background: 'transparent', width: 120, padding: '1px 0',
                            }}
                        />
                    ) : (
                        <span
                            onClick={() => setEditCity(true)}
                            style={{ fontSize: 13, color: '#555', cursor: 'pointer', borderBottom: '1px dashed #bbb' }}
                        >
                            {city || 'Укажите город'}
                        </span>
                    )}
                </div>

                <div className="search-bar-wrap">
                    <div className="search-input-box">
                        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input
                            className="search-input"
                            placeholder="Поиск идей…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="filter-btn" onClick={() => navigate('/ideas/feed')}>
                        <svg viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                    </button>
                </div>
            </div>

            <div className="ideas-scroll">
                <div className="categories-grid">
                    <div
                        className="category-card"
                        style={{ animationDelay: '0s', gridColumn: '1 / -1' }}
                        onClick={() => navigate(`/ideas/feed${city ? '?city=' + encodeURIComponent(city) : ''}`)}
                    >
                        <div className="category-emoji">🗂️</div>
                        <div className="category-label">Смотреть все идеи</div>
                    </div>
                    {filtered.map((cat, i) => (
                        <div
                            key={cat.key}
                            className="category-card"
                            style={{ animationDelay: `${i * 0.05}s` }}
                            onClick={() => navigate(`/ideas/feed?category=${cat.key}`)}
                        >
                            <div className="category-emoji">{cat.emoji}</div>
                            <div className="category-label">{cat.label}</div>
                            <div className="category-count">{cat.count} идей</div>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}