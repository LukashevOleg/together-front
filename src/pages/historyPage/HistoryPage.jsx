import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDateHistory, categoryEmoji, categoryGradient } from '../../api/datingApi';
import BottomNav from '../../components/layout/BottomNav';
import './HistoryPage.css';

const CATEGORY_LABEL = {
    ROMANTIC:      'Романтика',
    FOOD:          'Гастро',
    OUTDOOR:       'Природа',
    CULTURE:       'Культура',
    RELAX:         'Релакс',
    ACTIVE:        'Активное',
    ENTERTAINMENT: 'Развлечение',
    INDOOR:        'Дома',
    WELLNESS:      'Велнес',
    OTHER:         'Другое',
};

const MONTHS_RU = [
    'Январь','Февраль','Март','Апрель','Май','Июнь',
    'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];

function formatCardDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
}

function monthKey(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
    if (!key) return '';
    const [year, month] = key.split('-');
    return `${MONTHS_RU[parseInt(month) - 1]} ${year}`;
}

// Группируем события по месяцам
function groupByMonth(events) {
    const groups = {};
    events.forEach(e => {
        const key = monthKey(e.scheduledDate);
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
    });
    // Сортируем месяцы от новых к старым
    return Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a));
}

export default function HistoryPage() {
    const navigate = useNavigate();
    const [events,  setEvents]  = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDateHistory()
            .then(data => { setEvents(data || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const totalDates = events.length;

    // Средний рейтинг — пока заглушка 0, когда подключим рейтинги обновим
    const avgRating  = 0;

    const groups = groupByMonth(events);

    return (
        <div className="history-page">
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
            <div className="history-header">
                <button className="history-btn-back" onClick={() => navigate('/lubimka')}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="history-title">История <span>свиданий</span></div>
            </div>

            <div className="history-scroll">
                {loading ? (
                    <div className="history-loading">
                        <div className="history-skeleton summary" />
                        <div className="history-skeleton card" />
                        <div className="history-skeleton card" />
                        <div className="history-skeleton card" />
                    </div>
                ) : (
                    <>
                        {/* SUMMARY */}
                        <div className="history-summary">
                            <div className="sum-tile">
                                <div className="sum-num">{totalDates}</div>
                                <div className="sum-lbl">всего</div>
                            </div>
                            <div className="sum-tile">
                                <div className="sum-num burgundy">
                                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                                </div>
                                <div className="sum-lbl">средний рейтинг</div>
                            </div>
                        </div>

                        {/* GROUPED BY MONTH */}
                        {groups.length === 0 ? (
                            <div className="history-empty">
                                <div style={{ fontSize: 44 }}>🗓</div>
                                <div className="history-empty-title">Пока нет свиданий</div>
                                <div className="history-empty-sub">
                                    Принимайте приглашения — история появится здесь
                                </div>
                            </div>
                        ) : (
                            groups.map(([key, monthEvents]) => (
                                <div key={key}>
                                    <div className="history-month-lbl">
                                        {monthLabel(key)}
                                    </div>
                                    {monthEvents.map(event => {
                                        const bg    = categoryGradient(event.ideaCategory);
                                        const emoji = categoryEmoji(event.ideaCategory);
                                        const catLabel = CATEGORY_LABEL[event.ideaCategory] || '';
                                        return (
                                            <div
                                                key={event.id}
                                                className="history-card"
                                                onClick={() => navigate('/chats', { state: { eventId: event.id } })}
                                            >
                                                <div className="hc-img" style={{ background: bg }}>
                                                    {emoji}
                                                </div>
                                                <div className="hc-body">
                                                    <div className="hc-title">{event.ideaTitle}</div>
                                                    <div className="hc-meta">
                                                        {formatCardDate(event.scheduledDate)}
                                                        {event.scheduledTime && ` · ${event.scheduledTime.slice(0, 5)}`}
                                                    </div>
                                                    <div className="hc-footer">
                                                        {catLabel && (
                                                            <span className="hc-tag">{catLabel}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    );
}