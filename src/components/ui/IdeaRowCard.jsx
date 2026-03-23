import './IdeaRowCard.css';

const CATEGORY_GRADIENTS = {
    ROMANTIC:      'linear-gradient(135deg, #2A0A12, #7B1E2E)',
    OUTDOOR:       'linear-gradient(135deg, #1A1A1A, #3A3A3A)',
    FOOD:          'linear-gradient(135deg, #3D1520, #5A1E2E)',
    ACTIVE:        'linear-gradient(135deg, #0A1A2A, #1E3A5A)',
    CREATIVE:      'linear-gradient(135deg, #1A0A2A, #3A1E5A)',
    INDOOR:        'linear-gradient(135deg, #1A1A0A, #3A3A1E)',
    TRAVEL:        'linear-gradient(135deg, #0A2A1A, #1E5A3A)',
    WELLNESS:      'linear-gradient(135deg, #2A1A0A, #5A3A1E)',
    ENTERTAINMENT: 'linear-gradient(135deg, #1A2A0A, #3A5A1E)',
    OTHER:         'linear-gradient(135deg, #1A1A1A, #3A3A3A)',
};

const CATEGORY_EMOJI = {
    ROMANTIC: '🌹', OUTDOOR: '🌲', FOOD: '🍷', ACTIVE: '⚡',
    CREATIVE: '🎨', INDOOR: '🏠', TRAVEL: '✈️', WELLNESS: '🧘',
    ENTERTAINMENT: '🎭', OTHER: '✨',
};

const CATEGORY_LABELS = {
    ROMANTIC: 'Романтика', OUTDOOR: 'Природа', FOOD: 'Гастро',
    ACTIVE: 'Актив', CREATIVE: 'Творчество', INDOOR: 'Дома',
    WELLNESS: 'Релакс',
    ENTERTAINMENT: 'Развлечение', OTHER: 'Другое',
};

export default function IdeaRowCard({ idea, onClick, style }) {
    const gradient = CATEGORY_GRADIENTS[idea.category] || CATEGORY_GRADIENTS.OTHER;
    const emoji    = CATEGORY_EMOJI[idea.category]    || '✨';
    const label    = CATEGORY_LABELS[idea.category]   || idea.category;

    const formatPrice = () => {
        if (!idea.priceFrom || idea.priceFrom === 0) return 'Бесплатно';
        return `от ${idea.priceFrom.toLocaleString('ru')} ₽`;
    };

    const formatDuration = () => {
        if (!idea.durationMin) return null;
        const h = Math.floor(idea.durationMin / 60);
        const m = idea.durationMin % 60;
        if (h === 0) return `${m} мин`;
        if (m === 0) return `${h} ч`;
        return `${h}.${m} ч`;
    };

    return (
        <div className="idea-row-card" onClick={onClick} style={style}>
            <div className="idea-row-img" style={{ background: gradient }}>
                {idea.coverPhotoUrl
                    ? <img src={idea.coverPhotoUrl} alt={idea.title} />
                    : <span>{emoji}</span>
                }
            </div>
            <div className="idea-row-body">
                <div className="idea-row-top">
                    <div className="idea-row-tags">
                        <span className="idea-row-tag">{label}</span>
                        {idea.tags?.[0] && <span className="idea-row-tag dark">{idea.tags[0]}</span>}
                    </div>
                    <div className="idea-row-title">{idea.title}</div>
                </div>
                <div className="idea-row-bottom">
                    <div className="idea-row-price">{formatPrice()}</div>
                    <div className="idea-row-meta">
                        {formatDuration() && <span className="idea-row-duration">⏱ {formatDuration()}</span>}
                        {idea.rating > 0 && <span className="idea-row-rating">{idea.rating}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}