import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import './IdeasPage.css';

const CATEGORIES = [
    { key: 'ROMANTIC',      emoji: '🌹', label: 'Романтика',     count: 24 },
    { key: 'OUTDOOR',       emoji: '🌲', label: 'На природе',     count: 18 },
    { key: 'FOOD',          emoji: '🍷', label: 'Гастро',         count: 31 },
    { key: 'ACTIVE',        emoji: '⚡', label: 'Активный отдых', count: 15 },
    { key: 'CREATIVE',      emoji: '🎨', label: 'Творчество',     count: 12 },
    { key: 'INDOOR',        emoji: '🏠', label: 'Дома',           count: 20 },
    { key: 'TRAVEL',        emoji: '✈️', label: 'Путешествие',    count: 9  },
    { key: 'WELLNESS',      emoji: '🧘', label: 'Велнес',         count: 8  },
    { key: 'ENTERTAINMENT', emoji: '🎭', label: 'Развлечение',    count: 22 },
    { key: 'OTHER',         emoji: '✨', label: 'Другое',         count: 7  },
];

export default function IdeasPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const filtered = CATEGORIES.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="ideas-page">

            <div className="ideas-search-header">
                <div className="ideas-page-title">Иде<span>и</span></div>
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

            <BottomNav onCreateClick={() => navigate('/ideas/create')} />
        </div>
    );
}