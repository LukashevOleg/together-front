import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatches }  from '../../api/swipesApi';
import { getMyIdeas, getSavedIdeas, getIdeaById } from '../../api/ideaApi';
import { categoryEmoji, categoryGradient } from '../../api/datingApi';
import BottomNav from '../../components/layout/BottomNav';
import './DateModePage.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(p) {
    if (!p) return 'Бесплатно';
    return `от ${Number(p).toLocaleString('ru-RU')} ₽`;
}
function formatDuration(min) {
    if (!min) return null;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
}
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['января','февраля','марта','апреля','мая','июня',
        'июля','августа','сентября','октября','ноября','декабря'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
}
function formatWeekday(dateStr) {
    if (!dateStr) return '';
    const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
    return days[new Date(dateStr).getDay()];
}

const CATEGORY_LABEL = {
    ROMANTIC:'Романтика', FOOD:'Гастро', OUTDOOR:'Природа',
    CULTURE:'Культура', RELAX:'Релакс', ACTIVE:'Активное',
    ENTERTAINMENT:'Развлечение', INDOOR:'Дома', WELLNESS:'Велнес',
    EXTREME:'Экстрим', NIGHTLIFE:'Ночные', CREATIVE:'Творчество', OTHER:'Другое',
};

function DmCard({ category, title, price, duration, rating, reviewsCount, coverUrl, variant = 'match', onClick }) {
    const bg    = categoryGradient(category);
    const emoji = categoryEmoji(category);
    const label = CATEGORY_LABEL[category] || '';
    const cls   = variant === 'match' ? 'dm-match-card' : 'dm-idea-card';

    return (
        <div className={cls} onClick={onClick}>
            <div className="dm-card-img" style={coverUrl ? {} : { background: bg }}>
                {coverUrl
                    ? <img src={coverUrl} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : emoji
                }
            </div>
            <div className="dm-card-body">
                {label && (
                    <div className="dm-card-tag">
                        {emoji} {label}
                    </div>
                )}
                <div className="dm-card-title">{title}</div>
                {rating > 0 && (
                    <div className="dm-card-rating">
                        <span className="dm-star">★</span>
                        <span className="dm-rating-val">{Number(rating).toFixed(1)}</span>
                        {reviewsCount > 0 && <span className="dm-rating-count">({reviewsCount})</span>}
                    </div>
                )}
                <div className="dm-card-meta">
                    <span>{price ? formatPrice(price) : 'Бесплатно'}</span>
                    {duration && <span style={{ marginLeft: 'auto' }}>⏱ {formatDuration(duration)}</span>}
                </div>
            </div>
        </div>
    );
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

const TABS = [
    { key: 'matches', label: 'Совпадения' },
    { key: 'saved',   label: 'Сохранённое' },
    { key: 'mine',    label: 'Ваши идеи' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function DateModePage({ mode }) {
    const navigate   = useNavigate();
    const isSpontan  = mode === 'spontaneous';

    const [selectedDate, setSelectedDate] = useState(todayISO);

    const [matches,      setMatches]      = useState([]);
    const [matchIdeaMap, setMatchIdeaMap] = useState({});
    const [savedIdeas,   setSavedIdeas]   = useState([]);
    const [myIdeas,      setMyIdeas]      = useState([]);
    const [dataLoading,  setDataLoading]  = useState(true);

    useEffect(() => {
        let cancelled = false;
        setDataLoading(true);
        Promise.all([
            getMatches().catch(() => []),
            getSavedIdeas().catch(() => []),
            getMyIdeas({ size: 20 }).catch(() => ({ content: [] })),
        ]).then(([matchesData, savedData, myIdeasPage]) => {
            if (cancelled) return;
            setMatches(matchesData);
            setSavedIdeas(savedData);
            setMyIdeas(myIdeasPage.content || []);
            setDataLoading(false);
            const map = {};
            Promise.all((matchesData || []).map(async m => {
                try { map[m.ideaId] = await getIdeaById(m.ideaId); } catch {}
            })).then(() => { if (!cancelled) setMatchIdeaMap({ ...map }); });
        });
        return () => { cancelled = true; };
    }, []);

    const [activeTab, setActiveTab] = useState(0);
    const tabRefs    = useRef([]);
    const barRef     = useRef(null);
    const trackRef   = useRef(null);
    const [indStyle, setIndStyle] = useState({ left: 0, width: 0 });

    const updateIndicator = useCallback((idx) => {
        const tab = tabRefs.current[idx];
        const bar = barRef.current;
        if (!tab || !bar) return;
        const tRect = tab.getBoundingClientRect();
        const bRect = bar.getBoundingClientRect();
        setIndStyle({ left: tRect.left - bRect.left, width: tRect.width });
    }, []);

    useLayoutEffect(() => {
        const id = setTimeout(() => updateIndicator(activeTab), 60);
        return () => clearTimeout(id);
    }, [activeTab, updateIndicator]);

    useEffect(() => {
        if (!trackRef.current) return;
        trackRef.current.style.transition = 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)';
        trackRef.current.style.transform  = `translateX(${-activeTab * 100}%)`;
    }, [activeTab]);

    const touchState = useRef({ startX: 0, startY: 0, diffX: 0, lock: null });

    const onTouchStart = (e) => {
        const t = touchState.current;
        t.startX = e.touches[0].clientX;
        t.startY = e.touches[0].clientY;
        t.diffX  = 0;
        t.lock   = null;
        if (trackRef.current) trackRef.current.style.transition = 'none';
    };
    const onTouchMove = (e) => {
        const t = touchState.current;
        const dx = e.touches[0].clientX - t.startX;
        const dy = e.touches[0].clientY - t.startY;
        if (!t.lock) t.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (t.lock === 'y') return;
        e.preventDefault();
        t.diffX = dx;
        const resist = (dx > 0 && activeTab === 0) || (dx < 0 && activeTab === TABS.length - 1);
        if (trackRef.current) {
            trackRef.current.style.transform =
                `translateX(calc(${-activeTab * 100}% + ${dx * (resist ? 0.2 : 1)}px))`;
        }
    };
    const onTouchEnd = () => {
        const t = touchState.current;
        if (t.lock === 'y') return;
        if (t.diffX < -50 && activeTab < TABS.length - 1) setActiveTab(a => a + 1);
        else if (t.diffX > 50 && activeTab > 0)           setActiveTab(a => a - 1);
        else {
            if (trackRef.current) {
                trackRef.current.style.transition = 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)';
                trackRef.current.style.transform  = `translateX(${-activeTab * 100}%)`;
            }
        }
        t.lock = null;
    };

    const goToIdea = (id) => navigate(`/ideas/${id}`, {
        state: {
            source: isSpontan ? 'spontaneous' : 'planned',
            date:   isSpontan ? new Date().toISOString().split('T')[0] : selectedDate,
        }
    });

    return (
        <div className="date-mode-page">

            {/* HEADER */}
            <div className="dm-header">
                <div className="dm-back-row">
                    <button className="dm-btn-back" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                </div>

                {isSpontan ? (
                    <>
                        <div className="dm-title">Спонтанное <span>свидание</span></div>
                        <div className="dm-sub-row">
                            <div className="dm-now-pill">
                                <div className="dm-now-dot" />
                                Прямо сейчас
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="dm-title">
                            {formatDate(selectedDate)
                                ? <>{formatDate(selectedDate).split(' ')[0]} <span>{formatDate(selectedDate).split(' ')[1]}</span></>
                                : <>Запланировать <span>свидание</span></>
                            }
                        </div>
                        <div className="dm-sub-row">
                            <div className="dm-date-pill">
                                <svg viewBox="0 0 24 24">
                                    <rect x="3" y="5" width="18" height="16" rx="3"/>
                                    <path d="M3 10h18"/>
                                    <line x1="8" y1="3" x2="8" y2="7"/>
                                    <line x1="16" y1="3" x2="16" y2="7"/>
                                </svg>
                                {formatWeekday(selectedDate)}
                                <input
                                    className="dm-date-input"
                                    type="date"
                                    value={selectedDate}
                                    min={todayISO()}
                                    onChange={e => setSelectedDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* HERO CARD
                ↓ ЕДИНСТВЕННОЕ ИЗМЕНЕНИЕ — navigate с ?mode=today / ?mode=smart
            */}
            <div
                className="dm-hero"
                onClick={() => navigate(isSpontan ? '/ideas/feed?mode=today' : '/ideas/feed?mode=smart')}
            >
                {isSpontan ? (
                    <>
                        <div className="dm-hero-emoji">✨</div>
                        <div className="dm-hero-sub">Быстрые идеи, которые можно начать в ближайшие часы</div>
                        <button
                            className="dm-hero-btn"
                            onClick={e => { e.stopPropagation(); navigate('/ideas/feed?mode=today'); }}
                        >
                            Идеи на сегодня
                            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </>
                ) : (
                    <div className="dm-hero-find">
                        <div className="dm-hero-find-left">
                            <div className="dm-hero-find-label">Найти новые идеи</div>
                        </div>
                        <div className="dm-hero-find-arrow">
                            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                    </div>
                )}
            </div>

            {/* TAB BAR */}
            <div className="dm-tab-bar" ref={barRef}>
                {TABS.map((tab, i) => (
                    <div
                        key={tab.key}
                        ref={el => tabRefs.current[i] = el}
                        className={`dm-tab ${activeTab === i ? 'active' : ''}`}
                        onClick={() => setActiveTab(i)}
                    >
                        {tab.label}
                        {tab.key === 'matches' && matches.length > 0 && (
                            <span className="dm-tab-badge">{matches.length}</span>
                        )}
                    </div>
                ))}
                <div className="dm-tab-indicator" style={indStyle} />
            </div>

            {/* SWIPEABLE PANES */}
            <div
                className="dm-swipe-container"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="dm-swipe-track" ref={trackRef}>

                    {/* PANE 0 — Совпадения */}
                    <div className="dm-swipe-pane">
                        <div className="dm-pane-sub">Вам с партнёром понравилось</div>
                        {dataLoading ? (
                            <div className="dm-empty">
                                <div className="dm-empty-emoji">⏳</div>
                                <div className="dm-empty-title">Загружаем…</div>
                            </div>
                        ) : matches.length > 0 ? (
                            <>
                                {matches.map(m => {
                                    const idea = matchIdeaMap[m.ideaId];
                                    return (
                                        <DmCard
                                            key={m.id}
                                            category={m.ideaCategory}
                                            title={m.ideaTitle}
                                            price={idea?.priceFrom}
                                            duration={idea?.durationMin}
                                            rating={idea?.rating}
                                            reviewsCount={idea?.reviewsCount}
                                            coverUrl={idea?.photos?.[0]?.url}
                                            variant="match"
                                            onClick={() => goToIdea(m.ideaId)}
                                        />
                                    );
                                })}
                                <button className="dm-see-all" onClick={() => navigate('/lubimka')}>
                                    Все совпадения
                                    <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                            </>
                        ) : (
                            <div className="dm-empty">
                                <div className="dm-empty-emoji">💝</div>
                                <div className="dm-empty-title">Пока нет совпадений</div>
                                <div className="dm-empty-sub">Свайпайте идеи вместе с партнёром в разделе Любимка</div>
                            </div>
                        )}
                    </div>

                    {/* PANE 1 — Сохранённое */}
                    <div className="dm-swipe-pane">
                        <div className="dm-pane-sub">Идеи, которые вам понравились</div>
                        {dataLoading ? (
                            <div className="dm-empty">
                                <div className="dm-empty-emoji">⏳</div>
                                <div className="dm-empty-title">Загружаем…</div>
                            </div>
                        ) : savedIdeas.length > 0 ? (
                            <>
                                {savedIdeas.map(idea => (
                                    <DmCard
                                        key={idea.id}
                                        category={idea.category}
                                        title={idea.title}
                                        price={idea.priceFrom}
                                        duration={idea.durationMin}
                                        rating={idea.rating}
                                        reviewsCount={idea.reviewsCount}
                                        coverUrl={idea.photos?.[0]?.url}
                                        variant="idea"
                                        onClick={() => goToIdea(idea.id)}
                                    />
                                ))}
                                <button className="dm-see-all" onClick={() => navigate('/ideas/feed')}>
                                    Все сохранённые
                                    <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                            </>
                        ) : (
                            <div className="dm-empty">
                                <div className="dm-empty-emoji">🔖</div>
                                <div className="dm-empty-title">Ничего не сохранено</div>
                                <div className="dm-empty-sub">Нажмите ♡ на карточке идеи, чтобы сохранить её</div>
                            </div>
                        )}
                    </div>

                    {/* PANE 2 — Ваши идеи */}
                    <div className="dm-swipe-pane">
                        <div className="dm-pane-sub">Идеи, которые вы создали</div>
                        {dataLoading ? (
                            <div className="dm-empty">
                                <div className="dm-empty-emoji">⏳</div>
                                <div className="dm-empty-title">Загружаем…</div>
                            </div>
                        ) : myIdeas.length > 0 ? (
                            <>
                                {myIdeas.map(idea => (
                                    <DmCard
                                        key={idea.id}
                                        category={idea.category}
                                        title={idea.title}
                                        price={idea.priceFrom}
                                        duration={idea.durationMin}
                                        rating={idea.rating}
                                        reviewsCount={idea.reviewsCount}
                                        coverUrl={idea.photos?.[0]?.url}
                                        variant="idea"
                                        onClick={() => goToIdea(idea.id)}
                                    />
                                ))}
                                <button className="dm-see-all" onClick={() => navigate('/ideas/feed')}>
                                    Все ваши идеи
                                    <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                            </>
                        ) : (
                            <div className="dm-empty">
                                <div className="dm-empty-emoji">✏️</div>
                                <div className="dm-empty-title">Нет своих идей</div>
                                <div className="dm-empty-sub">Создайте первую идею для свидания</div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <BottomNav onCreateClick={() => navigate('/ideas/create')} />
        </div>
    );
}