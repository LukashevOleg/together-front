import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatches }  from '../../api/swipesApi';
import { getIdeaById } from '../../api/ideaApi';
import { categoryEmoji, categoryGradient } from '../../api/datingApi';
import BottomNav from '../../components/layout/BottomNav';
import './MatchesPage.css';

const CATEGORY_LABEL = {
    ROMANTIC:'Романтика', FOOD:'Гастро', OUTDOOR:'Природа',
    CULTURE:'Культура', RELAX:'Релакс', ACTIVE:'Активное',
    ENTERTAINMENT:'Развлечение', INDOOR:'Дома', WELLNESS:'Велнес',
    EXTREME:'Экстрим', NIGHTLIFE:'Ночные', CREATIVE:'Творчество', OTHER:'Другое',
};

function formatPrice(p) {
    if (!p) return 'Бесплатно';
    return `от ${Number(p).toLocaleString('ru-RU')} ₽`;
}
function formatDuration(min) {
    if (!min) return null;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
}

function MatchCard({ match, idea, onClick }) {
    const bg    = categoryGradient(match.ideaCategory);
    const emoji = categoryEmoji(match.ideaCategory);
    const label = CATEGORY_LABEL[match.ideaCategory] || '';

    const rating   = idea?.rating;
    const price    = idea?.priceFrom;
    const duration = idea?.durationMin;
    const cover    = idea?.photos?.[0]?.url || idea?.coverPhotoUrl || null;

    return (
        <div className="mp-card" onClick={onClick}>
            {/* Фото или градиент */}
            <div className="mp-card-img" style={cover ? {} : { background: bg }}>
                {cover
                    ? <img src={cover} alt={match.ideaTitle} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : emoji
                }
            </div>

            <div className="mp-card-body">
                {/* Тег категории сверху */}
                {label && (
                    <div className="mp-card-tag">
                        {emoji} {label}
                    </div>
                )}

                {/* Название */}
                <div className="mp-card-title">{match.ideaTitle}</div>

                {/* Рейтинг */}
                {rating > 0 && (
                    <div className="mp-card-rating">
                        <span className="mp-star">★</span>
                        <span className="mp-rating-val">{Number(rating).toFixed(1)}</span>
                        {idea?.reviewsCount > 0 && (
                            <span className="mp-rating-count">({idea.reviewsCount})</span>
                        )}
                    </div>
                )}

                {/* Цена и длительность снизу */}
                <div className="mp-card-meta">
                    <span>{formatPrice(price)}</span>
                    {duration && <span style={{ marginLeft:'auto' }}>⏱ {formatDuration(duration)}</span>}
                </div>
            </div>
        </div>
    );
}

export default function MatchesPage() {
    const navigate = useNavigate();
    const [matches,   setMatches]   = useState([]);
    const [ideaMap,   setIdeaMap]   = useState({}); // ideaId → idea
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        getMatches()
            .then(async data => {
                setMatches(data || []);
                setLoading(false);
                // Подгружаем детали каждой идеи параллельно
                const map = {};
                await Promise.all((data || []).map(async m => {
                    try {
                        const idea = await getIdeaById(m.ideaId);
                        map[m.ideaId] = idea;
                    } catch {}
                }));
                setIdeaMap(map);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="mp-page">

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
                        <MatchCard
                            key={m.id}
                            match={m}
                            idea={ideaMap[m.ideaId] || null}
                            onClick={() => navigate(`/ideas/${m.ideaId}`)}
                        />
                    ))
                )}
                <div style={{ height: 16 }} />
            </div>

            <BottomNav />
        </div>
    );
}