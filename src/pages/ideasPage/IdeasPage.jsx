import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import IdeaRowCard from '../../components/ui/IdeaRowCard';
import { getMyProfile } from '../../api/profilerApi';
import { useIdeaInteraction } from '../../hooks/useIdeaInteraction';
import { useCitySearch } from '../../hooks/useCitySearch';
import api from '../../api/authApi';
import './IdeasPage.css';

const CATEGORIES = [
    { key: 'ROMANTIC',      emoji: '🌹', label: 'Романтика'      },
    { key: 'OUTDOOR',       emoji: '🌲', label: 'На природе'     },
    { key: 'FOOD',          emoji: '🍷', label: 'Гастро'         },
    { key: 'ACTIVE',        emoji: '⚡', label: 'Активный отдых' },
    { key: 'CREATIVE',      emoji: '🎨', label: 'Творчество'     },
    { key: 'INDOOR',        emoji: '🏠', label: 'Дома'           },
    { key: 'WELLNESS',      emoji: '🧘', label: 'Релакс'         },
    { key: 'ENTERTAINMENT', emoji: '🎭', label: 'Развлечение'    },
];

export default function IdeasPage() {
    const navigate = useNavigate();

    const [search,      setSearch]      = useState('');
    const [catOpen,     setCatOpen]     = useState(false);
    const [cityEditing, setCityEditing] = useState(false);
    const [profileCity, setProfileCity] = useState('');   // строка из профиля — фолбэк для фильтра
    const [ideas,       setIdeas]       = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [page,        setPage]        = useState(0);
    const [hasMore,     setHasMore]     = useState(true);

    const cityInputRef = useRef(null);

    const { onView, stopView } = useIdeaInteraction();

    const {
        query:       cityQuery,
        suggestions: citySugs,
        selected:    citySelected,
        loading:     cityLoading,
        search:      citySearch,
        pick:        cityPick,
    } = useCitySearch();

    // Активный город для фильтрации:
    // если пользователь выбрал из автодополнения — берём его,
    // иначе — город из профиля
    const effectiveCity = citySelected?.name || profileCity;

    /* ── Загружаем город из профиля ── */
    useEffect(() => {
        getMyProfile()
            .then(p => { if (p?.city) setProfileCity(p.city); })
            .catch(() => {});
    }, []);

    // Ref чтобы fetchIdeas всегда видел актуальный город без пересоздания
    const effectiveCityRef = useRef(effectiveCity);
    useEffect(() => { effectiveCityRef.current = effectiveCity; }, [effectiveCity]);

    /* ── fetch ── */
    const fetchIdeas = useCallback(async (reset = false) => {
        setLoading(true);
        try {
            const currentPage = reset ? 0 : page;
            const params = new URLSearchParams({
                page: currentPage, size: 20, sortBy: 'rating', sortDir: 'desc',
            });
            if (search)                    params.set('search',   search);
            if (effectiveCityRef.current)  params.set('location', effectiveCityRef.current);

            const { data } = await api.get(`/api/ideas?${params}`);
            const content  = data?.content ?? [];
            const isLast   = data?.last    ?? true;
            setIdeas(prev => reset ? content : [...prev, ...content]);
            setHasMore(!isLast);
            if (!reset) setPage(p => p + 1);
            else        setPage(1);
        } catch (e) {
            console.error(e);
            setIdeas([]);
        } finally {
            setLoading(false);
        }
    }, [search, page]); // eslint-disable-line

    // Один эффект на все фильтры — search и город
    // При смене города — мгновенно, при смене поиска — с дебаунсом
    useEffect(() => {
        const delay = search ? 400 : 0;
        const t = setTimeout(() => fetchIdeas(true), delay);
        return () => clearTimeout(t);
    }, [search, effectiveCity]); // eslint-disable-line

    /* ── Открыть режим редактирования города ── */
    const startCityEdit = () => {
        setCityEditing(true);
        // Предзаполняем инпут текущим городом чтобы сразу видеть что ищем
        if (effectiveCity) citySearch(effectiveCity);
        setTimeout(() => cityInputRef.current?.focus(), 50);
    };

    /* ── Выбор города из подсказок ── */
    const handleCityPick = (c) => {
        cityPick(c);
        setCityEditing(false);
    };

    /* ── Закрыть автодополнение без выбора ── */
    const handleCityBlur = () => {
        // Небольшая задержка, чтобы успел сработать onClick на подсказке
        setTimeout(() => setCityEditing(false), 200);
    };

    const handleCardClick = (idea) => {
        stopView(idea.id);
        navigate(`/ideas/${idea.id}`);
    };

    const goCategory = (key) => {
        setCatOpen(false);
        navigate(`/ideas/feed?category=${key}${effectiveCity ? '&city=' + encodeURIComponent(effectiveCity) : ''}`);
    };

    return (
        <div className="ideas-page">

            {/* ══ HEADER ══ */}
            <div className="ideas-search-header">
                <div className="ideas-header-top">
                    <div className="ideas-page-title">Идеи</div>
                    <button className="ideas-create-btn" onClick={() => navigate('/ideas/create')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5"  x2="12" y2="19"/>
                            <line x1="5"  y1="12" x2="19" y2="12"/>
                        </svg>
                        Создать
                    </button>
                </div>

                {/* ── Город ── */}
                <div className="ideas-city-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8d8888" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5"/>
                    </svg>

                    {cityEditing ? (
                        <div className="ideas-city-autocomplete">
                            <div className="ideas-city-input-wrap">
                                <input
                                    ref={cityInputRef}
                                    className="ideas-city-search-input"
                                    placeholder="Введите город…"
                                    value={cityQuery}
                                    onChange={e => citySearch(e.target.value)}
                                    onBlur={handleCityBlur}
                                    autoComplete="off"
                                />
                                {cityLoading && (
                                    <span className="ideas-city-spinner">•••</span>
                                )}
                                {citySelected && !cityLoading && (
                                    <svg className="ideas-city-check" viewBox="0 0 24 24" fill="none"
                                         stroke="#2D8C4E" strokeWidth="2.5" strokeLinecap="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                )}
                            </div>
                            {citySugs.length > 0 && (
                                <div className="ideas-city-suggestions">
                                    {citySugs.map((c, i) => (
                                        <div
                                            key={i}
                                            className="ideas-city-sug-item"
                                            onMouseDown={() => handleCityPick(c)}  // mouseDown срабатывает до blur
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="#888"
                                                 strokeWidth="2" strokeLinecap="round">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                            <span>{c.name}</span>
                                            {c.country && (
                                                <span className="ideas-city-sug-country">{c.country}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {cityQuery.length >= 2 && !cityLoading && citySugs.length === 0 && !citySelected && (
                                <div className="ideas-city-not-found">Город не найден — попробуйте иначе</div>
                            )}
                        </div>
                    ) : (
                        <span
                            className={`city-label ${!effectiveCity ? 'city-label--empty' : ''}`}
                            onClick={startCityEdit}
                        >
                            {effectiveCity || 'Укажите город'}
                        </span>
                    )}
                </div>

                <div className="search-bar-wrap">
                    <div className="search-input-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#441b1b" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                        </svg>
                        <input
                            className="search-input"
                            placeholder="Поиск идей…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="filter-btn" onClick={() => navigate('/ideas/feed')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#441b1b" strokeWidth="2" strokeLinecap="round">
                            <line x1="4"  y1="6"  x2="20" y2="6"/>
                            <line x1="8"  y1="12" x2="16" y2="12"/>
                            <line x1="11" y1="18" x2="13" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* ══ BODY ══ */}
            <div className="ideas-scroll">

                <div className="cat-pill-row">
                    <button
                        className={`cat-pill ${catOpen ? 'open' : ''}`}
                        onClick={() => setCatOpen(o => !o)}
                    >
                        <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="2"  y="2"  width="8" height="8" rx="1.5"/>
                            <rect x="12" y="2"  width="8" height="8" rx="1.5"/>
                            <rect x="2"  y="12" width="8" height="8" rx="1.5"/>
                            <rect x="12" y="12" width="8" height="8" rx="1.5"/>
                        </svg>
                        Категории
                        <svg className="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                </div>

                <div className={`categories-section ${catOpen ? 'open' : ''}`}>
                    <div className="categories-grid">
                        {CATEGORIES.map((cat, i) => (
                            <div
                                key={cat.key}
                                className="category-card"
                                style={{ animationDelay: `${i * 0.04}s` }}
                                onClick={() => goCategory(cat.key)}
                            >
                                <div className="category-emoji">{cat.emoji}</div>
                                <div className="category-label">{cat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="feed-divider">
                    <span>
                        {effectiveCity ? `Идеи · ${effectiveCity}` : 'Все идеи'}
                    </span>
                    <div className="feed-divider-line" />
                </div>

                <div className="ideas-list">
                    {ideas.map((idea, i) => (
                        <IdeaRowCard
                            key={idea.id}
                            idea={idea}
                            style={{ animationDelay: `${Math.min(i, 6) * 0.04}s` }}
                            onClick={() => handleCardClick(idea)}
                            onMouseEnter={() => onView(idea.id)}
                        />
                    ))}

                    {loading && [1, 2, 3].map(i => (
                        <div key={i} className="row-card-skeleton" />
                    ))}

                    {!loading && hasMore && (
                        <div className="load-more" onClick={() => fetchIdeas(false)}>
                            Показать ещё
                        </div>
                    )}

                    {!loading && ideas.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-emoji">🔍</div>
                            <p>
                                {effectiveCity
                                    ? `Ничего не нашлось в городе «${effectiveCity}»`
                                    : 'Ничего не нашлось'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}