import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import './DateModePage.css';

// ── Заглушки — потом заменим на API ──────────────────────────────────────────
// Совпадения: GET /api/partner/matches (ещё нет на бэке)
const STUB_MATCHES = [
    { id: 101, emoji: '🌹', bg: 'linear-gradient(135deg,#3D0A14,#7B1E2E)', title: 'Вечерний пикник на крыше с видом на город', meta: '1 800 ₽ · 2 часа' },
    { id: 102, emoji: '🌿', bg: 'linear-gradient(135deg,#0A1A0A,#1E3820)',  title: 'Прогулка в ботаническом саду',             meta: 'Бесплатно · 2 часа' },
    { id: 103, emoji: '🎨', bg: 'linear-gradient(135deg,#4A1020,#8B2535)',  title: 'Мастер-класс по керамике вдвоём',          meta: '1 800 ₽ · 3 часа' },
];

// Сохранённое: GET /api/ideas?savedByUser=true (ещё нет на бэке)
const STUB_SAVED = [
    { id: 104, emoji: '⛸',  bg: 'linear-gradient(135deg,#1C1C1C,#383838)', title: 'Катание на коньках в Парке Горького',       meta: '900 ₽ · 1.5 часа' },
    { id: 105, emoji: '🍷', bg: 'linear-gradient(135deg,#111,#2A2A2A)',    title: 'Винная дегустация в баре на Патриарших',   meta: '2 500 ₽ · 2 часа' },
    { id: 106, emoji: '🕯',  bg: 'linear-gradient(135deg,#1A0A0A,#3A1520)', title: 'Ужин при свечах с мастер-классом повара',  meta: '3 200 ₽ · 2.5 часа' },
];

// Ваши идеи: GET /api/ideas?isUserCreated=true
const STUB_MY_IDEAS = [
    { id: 107, emoji: '🌁', bg: 'linear-gradient(135deg,#1A1A1A,#383838)', title: 'Прогулка по крышам с термосом чая',        meta: 'Бесплатно · 1.5 часа' },
    { id: 108, emoji: '🔭', bg: 'linear-gradient(135deg,#0A0A1A,#1A1A38)', title: 'Ночная экскурсия в планетарий',             meta: '600 ₽ · 2 часа' },
];

// ── Хелперы ───────────────────────────────────────────────────────────────────
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

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

const TABS = [
    { key: 'matches', label: 'Совпадения', badge: 2 },
    { key: 'saved',   label: 'Сохранённое' },
    { key: 'mine',    label: 'Ваши идеи' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function DateModePage({ mode }) {
    const navigate   = useNavigate();
    const isSpontan  = mode === 'spontaneous';

    // Planned: selected date
    const [selectedDate, setSelectedDate] = useState(todayISO);

    // Tabs
    const [activeTab, setActiveTab] = useState(0);
    const tabRefs    = useRef([]);
    const barRef     = useRef(null);
    const trackRef   = useRef(null);
    const [indStyle, setIndStyle] = useState({ left: 0, width: 0 });

    // Update indicator position
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

    // Slide track
    useEffect(() => {
        if (!trackRef.current) return;
        trackRef.current.style.transition = 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)';
        trackRef.current.style.transform  = `translateX(${-activeTab * 100}%)`;
    }, [activeTab]);

    // Touch swipe
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

    // Card click → detail, passing source context
    const goToIdea = (id) => navigate(`/ideas/${id}`, {
        state: {
            source: isSpontan ? 'spontaneous' : 'planned',
            date:   isSpontan ? new Date().toISOString().split('T')[0] : selectedDate,
        }
    });

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="date-mode-page">
            {/* STATUS BAR */}
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

            {/* HERO CARD */}
            <div className="dm-hero" onClick={() => navigate('/ideas/feed')}>
                {isSpontan ? (
                    <>
                        <div className="dm-hero-emoji">✨</div>
                        <div className="dm-hero-sub">Быстрые идеи, которые можно начать в ближайшие часы</div>
                        <button className="dm-hero-btn" onClick={e => { e.stopPropagation(); navigate('/ideas/feed'); }}>
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
                        {tab.badge && <span className="dm-tab-badge">{tab.badge}</span>}
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
                        {STUB_MATCHES.length > 0 ? (
                            <>
                                {STUB_MATCHES.map(m => (
                                    <div key={m.id} className="dm-match-card" onClick={() => goToIdea(m.id)}>
                                        <div className="dm-card-img" style={{ background: m.bg }}>{m.emoji}</div>
                                        <div className="dm-card-body">
                                            <div className="dm-card-title">{m.title}</div>
                                            <div className="dm-card-meta">{m.meta}</div>
                                        </div>
                                    </div>
                                ))}
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
                        <div className="dm-pane-sub">Идеи, которые вы сохранили</div>
                        {STUB_SAVED.length > 0 ? (
                            <>
                                {STUB_SAVED.map(s => (
                                    <div key={s.id} className="dm-idea-card" onClick={() => goToIdea(s.id)}>
                                        <div className="dm-card-img" style={{ background: s.bg }}>{s.emoji}</div>
                                        <div className="dm-card-body">
                                            <div className="dm-card-title">{s.title}</div>
                                            <div className="dm-card-meta">{s.meta}</div>
                                        </div>
                                    </div>
                                ))}
                                <button className="dm-see-all" onClick={() => navigate('/ideas/feed')}>
                                    Всё сохранённое
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
                        {STUB_MY_IDEAS.length > 0 ? (
                            <>
                                {STUB_MY_IDEAS.map(m => (
                                    <div key={m.id} className="dm-idea-card" onClick={() => goToIdea(m.id)}>
                                        <div className="dm-card-img" style={{ background: m.bg }}>{m.emoji}</div>
                                        <div className="dm-card-body">
                                            <div className="dm-card-title">{m.title}</div>
                                            <div className="dm-card-meta">{m.meta}</div>
                                        </div>
                                    </div>
                                ))}
                                <button className="dm-see-all" onClick={() => navigate('/ideas/create')}>
                                    + Создать идею
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