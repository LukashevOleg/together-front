import { useState, useEffect, useMemo } from 'react';
import { useNavigate }   from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { getActiveChats, getDateHistory, categoryEmoji, categoryGradient, formatEventDate } from '../../api/datingApi';
import { getEventTitle, getEventCoverUrl } from '../../utils/surpriseHelper';
import BottomNav from '../../components/layout/BottomNav';
import './CalendarPage.css';

// ── Helpers ────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTH_GEN   = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const WD_SHORT    = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WD_LONG     = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];

function toISO(y, m, d) {
    return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function todayISO() {
    const d = new Date();
    return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}
function fmtDayLabel(isoDate) {
    const d = new Date(isoDate + 'T00:00:00');
    const wd = WD_LONG[d.getDay()];
    return `${d.getDate()} ${MONTH_GEN[d.getMonth()]} · ${wd.charAt(0).toUpperCase() + wd.slice(1)}`;
}
function eventDateISO(event) {
    return event.scheduledDate; // 'YYYY-MM-DD'
}

// ── EventCard ─────────────────────────────────────────────────────────────
function EventCard({ event, onChatClick, userId }) {
    const confirmed = event.status === 'ACCEPTED';
    const bg        = categoryGradient(event.ideaCategory);
    const emoji     = categoryEmoji(event.ideaCategory);
    const time      = event.scheduledTime ? event.scheduledTime.slice(0, 5) : null;
    const title     = getEventTitle(event, userId);
    const coverUrl  = getEventCoverUrl(event, userId);

    return (
        <div className={`cal-event-card ${confirmed ? 'confirmed' : ''}`}>
            <div className="cal-event-img" style={{
                background: coverUrl ? 'none' : bg,
                overflow: 'hidden',
            }}>
                {coverUrl
                    ? <img src={coverUrl} alt="сюрприз" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    : emoji
                }
            </div>
            <div className="cal-event-body">
                <div>
                    <div className="cal-event-title">{title}</div>
                    <div className="cal-event-time">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {time ? time : 'Время не указано'}
                    </div>
                </div>
                <div className={`cal-event-status ${confirmed ? 'confirmed' : 'pending'}`}>
                    {confirmed ? '💝 Согласовано' : '⏳ Ждёт ответа'}
                </div>
            </div>

            <button
                className="cal-event-chat-btn"
                onClick={e => { e.stopPropagation(); onChatClick(event); }}
                title="Открыть чат"
            >
                <svg viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {event.status === 'PENDING' && <div className="cal-event-chat-dot" />}
            </button>
        </div>
    );
}

// ── MonthGrid ─────────────────────────────────────────────────────────────
function MonthGrid({ year, month, today, selectedDate, eventDates, onSelect }) {
    const firstDay   = new Date(year, month, 1);
    const lastDay    = new Date(year, month + 1, 0);
    const startDow   = (firstDay.getDay() + 6) % 7; // 0=Mon

    const cells = [];
    // Leading days from prev month
    for (let i = startDow - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        cells.push({ iso: toISO(d.getFullYear(), d.getMonth(), d.getDate()), num: d.getDate(), other: true });
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        cells.push({ iso: toISO(year, month, d), num: d, other: false });
    }
    // Trailing days
    const rem = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let d = 1; d <= rem; d++) {
        const nd = new Date(year, month + 1, d);
        cells.push({ iso: toISO(nd.getFullYear(), nd.getMonth(), nd.getDate()), num: d, other: true });
    }

    return (
        <div className="cal-grid-wrap">
            <div className="cal-weekdays">
                {WD_SHORT.map((wd, i) => (
                    <div key={wd} className={`cal-wd ${i >= 5 ? 'weekend' : ''}`}>{wd}</div>
                ))}
            </div>
            <div className="cal-grid">
                {cells.map((cell, i) => {
                    const marker = eventDates[cell.iso]; // 'confirmed' | 'pending' | undefined
                    return (
                        <div
                            key={i}
                            className={[
                                'cal-day',
                                cell.other   ? 'other-month' : '',
                                cell.iso === today        ? 'today'    : '',
                                cell.iso === selectedDate ? 'selected' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => !cell.other && onSelect(cell.iso)}
                        >
                            <div className="cal-day-num">{cell.num}</div>
                            {marker && !cell.other && (
                                <div className="cal-day-marker">
                                    {marker === 'confirmed' ? '💝' : '🤍'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── CalendarPage ──────────────────────────────────────────────────────────
export default function CalendarPage() {
    const navigate = useNavigate();
    const { userId } = useAuthContext();
    const today    = useMemo(() => todayISO(), []);

    const [view,       setView]       = useState('month');
    const [viewDate,   setViewDate]   = useState(() => {
        const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
    });
    const [selectedDate, setSelectedDate] = useState(today);
    const [events,     setEvents]     = useState([]);   // все активные (PENDING + ACCEPTED)
    const [history,    setHistory]    = useState([]);   // прошедшие
    const [loading,    setLoading]    = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getActiveChats().catch(() => []),
            getDateHistory().catch(() => []),
        ]).then(([active, hist]) => {
            if (cancelled) return;
            setEvents(active);
            setHistory(hist);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    // Все события (активные + история) для маркеров на календаре
    const allEvents = useMemo(() => [...events, ...history], [events, history]);

    // Карта дата → тип маркера
    const eventDates = useMemo(() => {
        const map = {};
        allEvents.forEach(e => {
            const iso = eventDateISO(e);
            if (!iso) return;
            // confirmed перетирает pending
            if (map[iso] !== 'confirmed') {
                map[iso] = e.status === 'ACCEPTED' ? 'confirmed' : 'pending';
            }
        });
        return map;
    }, [allEvents]);

    // События выбранного дня (для месячного вида)
    const selectedDayEvents = useMemo(() =>
            allEvents.filter(e => eventDateISO(e) === selectedDate),
        [allEvents, selectedDate]
    );

    // Предстоящие события (для списка)
    const upcomingEvents = useMemo(() =>
            allEvents
                .filter(e => eventDateISO(e) >= today)
                .sort((a, b) => eventDateISO(a).localeCompare(eventDateISO(b))),
        [allEvents, today]
    );

    // Группировка по дате для списка
    const upcomingGrouped = useMemo(() => {
        const groups = [];
        const seen   = new Set();
        upcomingEvents.forEach(e => {
            const iso = eventDateISO(e);
            if (!seen.has(iso)) { seen.add(iso); groups.push(iso); }
        });
        return groups.map(iso => ({
            iso,
            label: fmtDayLabel(iso),
            events: upcomingEvents.filter(e => eventDateISO(e) === iso),
        }));
    }, [upcomingEvents]);

    const shiftMonth = (dir) => {
        setViewDate(prev => {
            let m = prev.month + dir;
            let y = prev.year;
            if (m > 11) { m = 0;  y++; }
            if (m <  0) { m = 11; y--; }
            return { year: y, month: m };
        });
    };

    const openChat = (event) => {
        navigate('/chats', { state: { eventId: event.id } });
    };

    return (
        <div className="calendar-page">

            {/* HEADER */}
            <div className="cal-header">
                <div className="cal-back-row">
                    <button className="cal-btn-back" onClick={() => navigate('/lubimka')}>
                        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                </div>
                <div className="cal-header-row">
                    <div className="cal-month-label">
                        {MONTH_NAMES[viewDate.month]} {viewDate.year}
                    </div>
                    <div className="cal-month-nav">
                        <button className="cal-nav-arrow" onClick={() => shiftMonth(-1)}>
                            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button className="cal-nav-arrow" onClick={() => shiftMonth(1)}>
                            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                </div>

                <div className="cal-view-toggle">
                    <button
                        className={`cal-view-btn ${view === 'month' ? 'active' : ''}`}
                        onClick={() => setView('month')}
                    >
                        <svg viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="3" y1="9" x2="21" y2="9"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                        </svg>
                        Месяц
                    </button>
                    <button
                        className={`cal-view-btn ${view === 'list' ? 'active' : ''}`}
                        onClick={() => setView('list')}
                    >
                        <svg viewBox="0 0 24 24">
                            <line x1="9" y1="6"  x2="20" y2="6"/>
                            <line x1="9" y1="12" x2="20" y2="12"/>
                            <line x1="9" y1="18" x2="20" y2="18"/>
                            <circle cx="4" cy="6"  r="1.5" fill="currentColor" stroke="none"/>
                            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
                        </svg>
                        Список
                    </button>
                </div>
            </div>

            <div className="cal-scroll">

                {/* ── MONTH VIEW ────────────────────────────────────────────────── */}
                {view === 'month' && (
                    <>
                        <MonthGrid
                            year={viewDate.year}
                            month={viewDate.month}
                            today={today}
                            selectedDate={selectedDate}
                            eventDates={eventDates}
                            onSelect={setSelectedDate}
                        />

                        <div className="cal-day-detail">
                            <div className="cal-date-label">{fmtDayLabel(selectedDate)}</div>

                            {loading ? (
                                <div className="cal-no-events">
                                    <span className="cal-no-events-emoji">⏳</span>
                                    Загружаем…
                                </div>
                            ) : selectedDayEvents.length > 0 ? (
                                selectedDayEvents.map(event => (
                                    <EventCard key={event.id} event={event} onChatClick={openChat} userId={userId} />
                                ))
                            ) : (
                                <>
                                    <div className="cal-no-events">
                                        <span className="cal-no-events-emoji">🗓</span>
                                        На этот день ничего не запланировано
                                    </div>
                                    <button className="cal-add-btn" onClick={() => navigate('/planned')}>
                                        <svg viewBox="0 0 24 24">
                                            <line x1="12" y1="5" x2="12" y2="19"/>
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                        Запланировать свидание
                                    </button>
                                </>
                            )}
                        </div>
                        <div style={{ height: 20 }} />
                    </>
                )}

                {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
                {view === 'list' && (
                    <div className="cal-list-wrap">
                        <div className="cal-list-title">Ближайшие свидания</div>

                        {loading ? (
                            <div className="cal-no-events">
                                <span className="cal-no-events-emoji">⏳</span>
                                Загружаем…
                            </div>
                        ) : upcomingGrouped.length === 0 ? (
                            <div className="cal-no-events">
                                <span className="cal-no-events-emoji">🗓</span>
                                Пока ничего не запланировано
                            </div>
                        ) : (
                            upcomingGrouped.map(group => (
                                <div key={group.iso}>
                                    <div className="cal-list-date-label">{group.label}</div>
                                    {group.events.map(event => (
                                        <EventCard key={event.id} event={event} onChatClick={openChat} userId={userId} />
                                    ))}
                                </div>
                            ))
                        )}

                        <button
                            className="cal-add-btn"
                            style={{ marginTop: 16 }}
                            onClick={() => navigate('/planned')}
                        >
                            <svg viewBox="0 0 24 24">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Запланировать свидание
                        </button>
                        <div style={{ height: 20 }} />
                    </div>
                )}

            </div>

            <BottomNav />
        </div>
    );
}