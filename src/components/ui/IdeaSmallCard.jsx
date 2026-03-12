import './IdeaSmallCard.css';

const GRADIENTS = {
    ROMANTIC: 'linear-gradient(135deg, #2A0A12, #7B1E2E)',
    OUTDOOR:  'linear-gradient(135deg, #1A1A1A, #3A3A3A)',
    FOOD:     'linear-gradient(135deg, #3D1520, #5A1E2E)',
    ACTIVE:   'linear-gradient(135deg, #0A1A2A, #1E3A5A)',
    CREATIVE: 'linear-gradient(135deg, #1A0A2A, #3A1E5A)',
};

const EMOJIS = {
    ROMANTIC: '🌹', OUTDOOR: '🌲', FOOD: '🍷',
    ACTIVE: '⚡', CREATIVE: '🎨', INDOOR: '🏠',
};

const LABELS = {
    ROMANTIC: 'Романтика', OUTDOOR: 'Природа', FOOD: 'Гастро',
    ACTIVE: 'Актив', CREATIVE: 'Творчество', INDOOR: 'Дома',
    TRAVEL: 'Путешествие', WELLNESS: 'Велнес',
};

export default function IdeaSmallCard({ idea, onClick }) {
    const bg    = GRADIENTS[idea.category] || GRADIENTS.OUTDOOR;
    const emoji = EMOJIS[idea.category]   || '✨';
    const label = LABELS[idea.category]   || idea.category;

    const formatPrice = () => {
        if (!idea.priceFrom || idea.priceFrom === 0) return 'Бесплатно';
        return `от ${Number(idea.priceFrom).toLocaleString('ru')} ₽`;
    };

    const formatDuration = () => {
        if (!idea.durationMin) return null;
        const h = Math.floor(idea.durationMin / 60);
        const m = idea.durationMin % 60;
        if (h === 0) return `${m} мин`;
        return m ? `${h}.${m} ч` : `${h} ч`;
    };

    return (
        <div className="idea-small-card" onClick={onClick}>
            <div className="small-card-image" style={{ background: bg }}>
                {idea.coverPhotoUrl
                    ? <img src={idea.coverPhotoUrl} alt={idea.title} />
                    : <span>{emoji}</span>
                }
                <div className="small-card-badge">{label}</div>
                <div className="small-card-save">🤍</div>
            </div>
            <div className="small-card-body">
                <div className="small-card-title">{idea.title}</div>
                <div className="small-card-meta">
                    {formatDuration() && (
                        <div className="meta-tag">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {formatDuration()}
                        </div>
                    )}
                    {idea.location && <div className="meta-tag">📍 {idea.location}</div>}
                </div>
                <div className="small-card-footer">
                    <div className="small-card-price">
                        {formatPrice()} <span>/ раз</span>
                    </div>
                    {idea.rating > 0 && <div className="small-card-rating">{idea.rating}</div>}
                </div>
            </div>
        </div>
    );
}