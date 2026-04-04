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

            <div className="ideas-search-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div className="ideas-page-title">Иде<span>и</span></div>
                    <button
                        onClick={() => navigate('/ideas/create')}
                        style={{
                            background: '#441b1b',
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
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#8d8888" strokeWidth="2" strokeLinecap="round">
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
                        style={{ animationDelay: '0s', gridColumn: '1 / -1' , background: 'radial-gradient(ellipse at 98% 2%, rgb(96, 42, 42) 0%, transparent 65%);'}}
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