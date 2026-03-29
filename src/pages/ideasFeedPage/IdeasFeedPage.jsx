import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import IdeaRowCard from '../../components/ui/IdeaRowCard';
import { fetchTodayIdeas, fetchSmartFeed } from '../../api/smartFeedApi';
import { useIdeaInteraction } from '../../hooks/useIdeaInteraction';
import api from '../../api/authApi';
import './IdeasFeedPage.css';

const SORT_CHIPS = [
    { key: 'rating',    label: '★ Рейтинг' },
    { key: 'createdAt', label: '🕐 Новые' },
    { key: 'priceFrom', label: '💸 Цена' },
];

const CATEGORY_CHIPS = [
    { key: null,          label: 'Все' },
    { key: 'ROMANTIC',    label: '🌹 Романтика' },
    { key: 'OUTDOOR',     label: '🌲 Природа' },
    { key: 'FOOD',        label: '🍷 Гастро' },
    { key: 'ACTIVE',      label: '⚡ Актив' },
    { key: 'CREATIVE',    label: '🎨 Творчество' },
    { key: 'INDOOR',      label: '🏠 Дома' },
];

// mode=today  → /api/ideas/today (спонтанный, учитывает погоду)
// mode=smart  → /api/ideas/smart (персональный)
// mode=null   → /api/ideas       (обычная лента с фильтрами)
function getModeLabel(mode) {
    if (mode === 'today') return { title: 'На сегодня', sub: 'С учётом погоды и времени' };
    if (mode === 'smart') return { title: 'Для вас',    sub: 'Персональная подборка' };
    return null;
}

export default function IdeasFeedPage() {
    const navigate      = useNavigate();
    const [searchParams] = useSearchParams();

    // mode=today | mode=smart | (пусто = обычная лента)
    const mode     = searchParams.get('mode');     // 'today' | 'smart' | null
    const initCat  = searchParams.get('category') || null;
    const initCity = searchParams.get('city')     || '';

    const [search,        setSearch]        = useState('');
    const [sortBy,        setSortBy]        = useState('rating');
    const [category,      setCategory]      = useState(initCat);
    const [ideas,         setIdeas]         = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [page,          setPage]          = useState(0);
    const [hasMore,       setHasMore]       = useState(true);
    const [filterOpen,    setFilterOpen]    = useState(false);
    const [filtersActive, setFiltersActive] = useState(!!initCat);

    const { onView, stopView } = useIdeaInteraction();

    const modeLabel = getModeLabel(mode);

    const fetchIdeas = useCallback(async (reset = false) => {
        setLoading(true);
        try {
            const currentPage = reset ? 0 : page;
            let data;

            if (mode === 'today') {
                data = await fetchTodayIdeas({ city: initCity, page: currentPage, size: 20 });
            } else if (mode === 'smart') {
                data = await fetchSmartFeed({ city: initCity, page: currentPage, size: 20 });
            } else {
                const params = new URLSearchParams({
                    page: currentPage, size: 20, sortBy, sortDir: 'desc',
                });
                if (search)   params.set('search', search);
                if (category) params.set('category', category);
                const { data: d } = await api.get(`/api/ideas?${params}`);
                data = d;
            }

            // ↓ вот эта строка — data может быть массивом или объектом с .content
            const content = Array.isArray(data) ? data : (data?.content ?? []);
            const isLast  = Array.isArray(data) ? true  : (data?.last ?? true);

            setIdeas(prev => reset ? content : [...prev, ...content]);
            setHasMore(!isLast);
            if (!reset) setPage(p => p + 1);
            else        setPage(1);
        } catch (e) {
            console.error('Failed to load ideas:', e);
            setIdeas([]);
        } finally {
            setLoading(false);
        }
    }, [search, sortBy, category, page, mode, initCity]);

    // Сброс при смене фильтров
    useEffect(() => { fetchIdeas(true); }, [sortBy, category]); // eslint-disable-line

    // Debounced поиск
    useEffect(() => {
        if (mode) return; // в умных режимах поиск не используется
        const timer = setTimeout(() => fetchIdeas(true), 400);
        return () => clearTimeout(timer);
    }, [search]); // eslint-disable-line

    // Первая загрузка для умных режимов
    useEffect(() => {
        if (mode) fetchIdeas(true);
    }, []); // eslint-disable-line

    const handleCardClick = (idea) => {
        stopView(idea.id);
        navigate(`/ideas/${idea.id}`);
    };

    // Заголовок страницы
    const pageTitle = modeLabel?.title
        || CATEGORY_CHIPS.find(c => c.key === category)?.label?.replace(/^.+\s/, '')
        || 'Все идеи';

    const pageSubtitle = modeLabel?.sub
        || `${ideas.length} идей`;

    return (
        <div className="feed-page">

            <div className="feed-search-header">
                <div className="feed-back-row">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <div>
                        <div className="feed-page-title">
                            {pageTitle}
                        </div>
                        <div className="feed-page-subtitle">{pageSubtitle}</div>
                    </div>
                </div>

                {/* Поиск — только в обычном режиме */}
                {!mode && (
                    <div className="search-bar-wrap">
                        <div className="search-input-box">
                            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            <input
                                className="search-input"
                                placeholder="Поиск…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            className={`filter-btn ${filtersActive ? 'active' : ''}`}
                            onClick={() => setFilterOpen(true)}
                        >
                            <svg viewBox="0 0 24 24">
                                <line x1="4"  y1="6"  x2="20" y2="6"/>
                                <line x1="8"  y1="12" x2="16" y2="12"/>
                                <line x1="11" y1="18" x2="13" y2="18"/>
                            </svg>
                            {filtersActive && <div className="filter-dot" />}
                        </button>
                    </div>
                )}

                {/* Бейдж режима для /today и /smart */}
                {mode && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: mode === 'today' ? '#E8F5E9' : '#F2E8EA',
                        color:      mode === 'today' ? '#2E7D32' : '#7B1E2E',
                        borderRadius: 20,
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        marginTop: 6,
                    }}>
                        {mode === 'today' ? '🌤 Подобрано по погоде' : '✨ Персональная лента'}
                    </div>
                )}
            </div>

            {/* Сортировка — только в обычном режиме */}
            {!mode && (
                <div className="sort-scroll">
                    {SORT_CHIPS.map(chip => (
                        <div
                            key={chip.key}
                            className={`sort-chip ${sortBy === chip.key ? 'active' : ''}`}
                            onClick={() => setSortBy(chip.key)}
                        >
                            {chip.label}
                        </div>
                    ))}
                </div>
            )}

            {/* Список идей */}
            <div className="feed-scroll">
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

                    {loading && [1,2,3].map(i => (
                        <div key={i} className="row-card-skeleton" />
                    ))}

                    {!loading && hasMore && (
                        <div className="load-more" onClick={() => fetchIdeas(false)}>
                            Показать ещё
                        </div>
                    )}

                    {!loading && ideas.length === 0 && (
                        <div className="empty-state">
                            <div style={{ fontSize: 48 }}>
                                {mode === 'today' ? '🌧️' : '🔍'}
                            </div>
                            <p>
                                {mode === 'today'
                                    ? 'Сегодня мало подходящих идей'
                                    : 'Ничего не нашлось'}
                            </p>
                            {mode === 'today' && (
                                <p style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
                                    Попробуйте режим «Для вас» — там больше вариантов
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter drawer — только в обычном режиме */}
            {!mode && (
                <div
                    className={`filter-overlay ${filterOpen ? 'open' : ''}`}
                    onClick={() => setFilterOpen(false)}
                >
                    <div className="filter-drawer" onClick={e => e.stopPropagation()}>
                        <div className="drawer-handle" />
                        <div className="drawer-title">Фильтры</div>

                        <div className="filter-group">
                            <div className="filter-group-label">Категория</div>
                            <div className="filter-chips-row">
                                {CATEGORY_CHIPS.map(c => (
                                    <div
                                        key={String(c.key)}
                                        className={`f-chip ${category === c.key ? 'on' : ''}`}
                                        onClick={() => setCategory(c.key)}
                                    >
                                        {c.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="drawer-apply"
                            onClick={() => {
                                setFilterOpen(false);
                                setFiltersActive(!!category);
                                fetchIdeas(true);
                            }}
                        >
                            Применить
                        </button>
                    </div>
                </div>
            )}

            <BottomNav onCreateClick={() => navigate('/ideas/create')} />
        </div>
    );
}