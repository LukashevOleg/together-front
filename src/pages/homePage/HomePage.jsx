import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import BottomNav from '../../components/layout/BottomNav';
import IdeaSmallCard from '../../components/ui/IdeaSmallCard';
import { useIdeaInteraction } from '../../hooks/useIdeaInteraction';
import api from '../../api/authApi';
import { getMyProfile } from '../../api/profilerApi';
import { saveIdea, unsaveIdea, getSaveStatus } from '../../api/ideaApi';
import './HomePage.css';

const FILTER_CHIPS = [
    { key: null,       icon: '🔥', label: 'Популярное' },
    { key: 'free',     icon: '💸', label: 'Бесплатно' },
    { key: 'OUTDOOR',  icon: '🌿', label: 'Природа' },
    { key: 'FOOD',     icon: '🍽', label: 'Гастро' },
    { key: 'ACTIVE',   icon: '⚡', label: 'Экстрим' },
    { key: 'CREATIVE', icon: '🎨', label: 'Творчество' },
];

export default function HomePage() {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const { onLike, onSkip } = useIdeaInteraction();
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        getMyProfile()
            .then(p => setAvatarUrl(p.avatarUrl))
            .catch(() => {});
    }, []);

    const [activeFilter, setActiveFilter] = useState(null);
    const [ideas,        setIdeas]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [savedMap,     setSavedMap]     = useState({});

    useEffect(() => {
        fetchIdeas();
    }, [activeFilter]);

    const fetchIdeas = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ size: 10, sortBy: 'rating' });
            if (activeFilter === 'free') params.set('priceTo', '0');
            else if (activeFilter)       params.set('category', activeFilter);

            const { data } = await api.get(`/api/ideas?${params}`);
            const list = data.content || [];
            setIdeas(list);

            // Подгружаем статусы лайков параллельно
            const statuses = await Promise.all(
                list.map(idea =>
                    getSaveStatus(idea.id)
                        .then(s => [idea.id, s.saved])
                        .catch(() => [idea.id, false])
                )
            );
            setSavedMap(Object.fromEntries(statuses));
        } catch {
            setIdeas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSave = async (idea) => {
        const newSaved = !savedMap[idea.id];
        setSavedMap(prev => ({ ...prev, [idea.id]: newSaved }));

        if (newSaved) onLike(idea.id);
        else          onSkip(idea.id);

        try {
            newSaved
                ? await saveIdea(Number(idea.id), idea.title, idea.category)
                : await unsaveIdea(Number(idea.id));
        } catch {
            setSavedMap(prev => ({ ...prev, [idea.id]: !newSaved }));
        }
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 6)  return 'Доброй ночи';
        if (h < 12) return 'Доброе утро';
        if (h < 18) return 'Добрый день';
        return 'Добрый вечер';
    };

    return (
        <div className="home-page">

            {/* HEADER */}
            <div className="home-header">
                <div className="header-left">
                    <div className="greeting">{getGreeting()} 👋</div>
                    <div className="logo">Вме<span>сте</span></div>
                </div>
                <div className="avatar" onClick={() => navigate("/profile")}>
                    {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
                        : "🌸"
                    }
                </div>
            </div>

            {/* SCROLL AREA */}
            <div className="scroll-area">

                {/* MODES */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">Что планируем?</div>
                        <span className="section-tag">выбери формат</span>
                    </div>
                    <div className="split-concept">
                        <div className="split-card sa" onClick={() => navigate('/spontaneous')}>
                            <div className="split-left">
                                <div className="split-chip">Прямо сейчас</div>
                                <div className="split-title">Спонтанное<br/>свидание</div>
                                <div className="split-sub">Идеи под погоду и настроение</div>
                            </div>
                            <div className="split-emoji">✨</div>
                            <div className="split-arrow">→</div>
                        </div>
                        <div className="split-card sb" onClick={() => navigate('/planned')}>
                            <div className="split-left">
                                <div className="split-chip">Планирую заранее</div>
                                <div className="split-title">Запланированное<br/>свидание</div>
                                <div className="split-sub">Дата, время, бронирование</div>
                            </div>
                            <div className="split-emoji">🗓</div>
                            <div className="split-arrow">→</div>
                        </div>
                    </div>
                </div>

                {/* IDEAS FOR YOU */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">Идеи для вас</div>
                        <span className="see-all" onClick={() => navigate('/ideas')}>Все →</span>
                    </div>

                    {/* FILTER CHIPS */}
                    <div className="filter-scroll">
                        {FILTER_CHIPS.map(chip => (
                            <div
                                key={chip.key}
                                className={`chip ${activeFilter === chip.key ? 'active' : ''}`}
                                onClick={() => setActiveFilter(chip.key)}
                            >
                                <span className="chip-icon">{chip.icon}</span> {chip.label}
                            </div>
                        ))}
                    </div>

                    {/* IDEA CARDS */}
                    <div className="cards-scroll">
                        {loading
                            ? [1,2,3].map(i => <div key={i} className="idea-card-skeleton" />)
                            : ideas.map((idea, i) => (
                                <IdeaSmallCard
                                    key={idea.id}
                                    idea={idea}
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                    saved={savedMap[idea.id] || false}
                                    onSave={(e) => { e.stopPropagation(); handleToggleSave(idea); }}
                                    onClick={() => navigate(`/ideas/${idea.id}`)}
                                />
                            ))
                        }
                    </div>
                </div>

                <div style={{ height: 20 }} />
            </div>

            <BottomNav onCreateClick={() => navigate('/ideas/create')} />
        </div>
    );
}