import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatches }  from '../../api/swipesApi';
import { categoryEmoji, categoryGradient } from '../../api/datingApi';
import BottomNav from '../../components/layout/BottomNav';
import './MatchesPage.css';

function formatPrice(p) {
    if (!p) return 'Бесплатно';
    return `от ${Number(p).toLocaleString('ru-RU')} ₽`;
}

export default function MatchesPage() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMatches()
            .then(data => { setMatches(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="mp-page">
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

            <div className="mp-header">
                <div className="mp-back-row">
                    <button className="mp-btn-back" onClick={() => navigate('/lubimka')}>
                        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <div className="mp-title">Совпа<span>дения</span></div>
                </div>
                <div className="mp-sub">Вам с партнёром понравилось</div>
            </div>

            <div className="mp-scroll">
                {loading ? (
                    <div className="mp-empty">
                        <div className="mp-empty-emoji">⏳</div>
                        <div className="mp-empty-title">Загружаем…</div>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="mp-empty">
                        <div className="mp-empty-emoji">💝</div>
                        <div className="mp-empty-title">Пока нет совпадений</div>
                        <div className="mp-empty-sub">
                            Свайпайте идеи вместе с партнёром — совпадения появятся здесь
                        </div>
                        <button className="mp-swipe-btn" onClick={() => navigate('/swipe')}>
                            Начать свайпать
                        </button>
                    </div>
                ) : (
                    matches.map(m => (
                        <div
                            key={m.id}
                            className="mp-card"
                            onClick={() => navigate(`/ideas/${m.ideaId}`)}
                        >
                            <div className="mp-card-img"
                                 style={{ background: categoryGradient(m.ideaCategory) }}>
                                {categoryEmoji(m.ideaCategory)}
                            </div>
                            <div className="mp-card-body">
                                <div className="mp-match-tag">
                                    <svg viewBox="0 0 24 24" width="10" height="10">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#7B1E2E" stroke="none"/>
                                    </svg>
                                    Совпадение
                                </div>
                                <div className="mp-card-title">{m.ideaTitle}</div>
                            </div>
                        </div>
                    ))
                )}
                <div style={{ height: 16 }} />
            </div>

            <BottomNav />
        </div>
    );
}