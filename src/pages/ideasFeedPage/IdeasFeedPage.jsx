import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import IdeaRowCard from '../../components/ui/IdeaRowCard';
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
    { key: 'TRAVEL',      label: '✈️ Путешествие' },
];

export default function IdeasFeedPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [search,       setSearch]       = useState('');
    const [sortBy,       setSortBy]       = useState('rating');
    const [category,     setCategory]     = useState(searchParams.get('category'));
    const [ideas,        setIdeas]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [page,         setPage]         = useState(0);
    const [hasMore,      setHasMore]      = useState(true);
    const [filterOpen,   setFilterOpen]   = useState(false);
    const [filtersActive, setFiltersActive] = useState(!!searchParams.get('category'));

    const fetchIdeas = useCallback(async (reset = false) => {
        setLoading(true);
        try {
            const currentPage = reset ? 0 : page;
            const params = new URLSearchParams({
                page:   currentPage,
                size:   20,
                sortBy,
                sortDir: 'desc',
            });
            if (search)   params.set('search', search);
            if (category) params.set('category', category);

            const { data } = await api.get(`/api/ideas?${params}`);
            setIdeas(prev => reset ? data.content : [...prev, ...data.content]);
            setHasMore(!data.last);
            if (!reset) setPage(p => p + 1);
            else setPage(1);
        } catch {
            setIdeas([]);
        } finally {
            setLoading(false);
        }
    }, [search, sortBy, category, page]);

    useEffect(() => { fetchIdeas(true); }, [sortBy, category]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => fetchIdeas(true), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const categoryTitle = CATEGORY_CHIPS.find(c => c.key === category)?.label || 'Все идеи';

    return (
        <div className="feed-page">
            <div className="status-bar">
                <span>9:41</span>
                <div className="status-icons">
                    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="1" y="6" width="3" height="12" rx="1"/><rect x="6" y="9" width="3" height="9" rx="1"/><rect x="11" y="5" width="3" height="13" rx="1"/><rect x="16" y="2" width="3" height="16" rx="1"/></svg>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>
                    <svg viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M22 11v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="4" y="9" width="10" height="7" rx="1" fill="currentColor"/></svg>
                </div>
            </div>

            <div className="feed-search-header">
                <div className="feed-back-row">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <div>
                        <div className="feed-page-title">{categoryTitle.replace(/^.+\s/, '')}<span>.</span></div>
                        <div className="feed-page-subtitle">{ideas.length} идей</div>
                    </div>
                </div>

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
                        <svg viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                        {filtersActive && <div className="filter-dot" />}
                    </button>
                </div>
            </div>

            {/* SORT CHIPS */}
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

            {/* LIST */}
            <div className="feed-scroll">
                <div className="ideas-list">
                    {ideas.map((idea, i) => (
                        <IdeaRowCard
                            key={idea.id}
                            idea={idea}
                            style={{ animationDelay: `${Math.min(i, 6) * 0.04}s` }}
                            onClick={() => navigate(`/ideas/${idea.id}`)}
                        />
                    ))}
                    {loading && [1,2,3].map(i => <div key={i} className="row-card-skeleton" />)}
                    {!loading && hasMore && (
                        <div className="load-more" onClick={() => fetchIdeas(false)}>Показать ещё</div>
                    )}
                    {!loading && ideas.length === 0 && (
                        <div className="empty-state">
                            <div style={{ fontSize: 48 }}>🔍</div>
                            <p>Ничего не нашлось</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FILTER DRAWER */}
            <div className={`filter-overlay ${filterOpen ? 'open' : ''}`} onClick={() => setFilterOpen(false)}>
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
                        onClick={() => { setFilterOpen(false); setFiltersActive(!!category); fetchIdeas(true); }}
                    >
                        Применить
                    </button>
                </div>
            </div>

            <BottomNav onCreateClick={() => navigate('/ideas/create')} />
        </div>
    );
}