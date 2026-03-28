import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getActiveChats,
    categoryEmoji,
    categoryGradient,
    formatEventDate,
} from '../../api/datingApi';
import { useAuthContext } from '../../context/AuthContext';
import { getEventTitle, getEventCoverUrl } from '../../utils/surpriseHelper';
import BottomNav from '../../components/layout/BottomNav';
import './InvitationsPage.css';

function EventCard({ event, isReceiver, onClick }) {
    const bg       = categoryGradient(event.ideaCategory);
    const emoji    = categoryEmoji(event.ideaCategory);
    const title    = getEventTitle(event, isReceiver ? event.receiverId : null);
    const coverUrl = getEventCoverUrl(event, isReceiver ? event.receiverId : null);

    return (
        <div className="inv-card" onClick={onClick}>
            <div className="inv-card-img" style={{
                background: coverUrl ? 'none' : bg,
                overflow: 'hidden',
            }}>
                {coverUrl
                    ? <img src={coverUrl} alt="сюрприз" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : emoji
                }
            </div>
            <div className="inv-card-body">
                <div className="inv-title">{title}</div>
                <div className="inv-date">{formatEventDate(event)}</div>
                <div className="inv-hint">
                    {isReceiver ? 'Нажмите чтобы принять или отклонить' : 'Нажмите чтобы посмотреть или отменить'}
                </div>
            </div>
            <div className="inv-arrow">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </div>
        </div>
    );
}

export default function InvitationsPage() {
    const navigate   = useNavigate();
    const { userId } = useAuthContext();
    const [events,    setEvents]   = useState([]);
    const [loading,   setLoading]  = useState(true);
    const [activeTab, setActiveTab]= useState(0);
    const tabRefs  = useRef([]);
    const barRef   = useRef(null);
    const [indStyle, setIndStyle]  = useState({ left: 0, width: 0 });

    const updateIndicator = useCallback((idx) => {
        const tab = tabRefs.current[idx];
        const bar = barRef.current;
        if (!tab || !bar) return;
        const tr = tab.getBoundingClientRect();
        const br = bar.getBoundingClientRect();
        setIndStyle({ left: tr.left - br.left, width: tr.width });
    }, []);

    useLayoutEffect(() => {
        const id = setTimeout(() => updateIndicator(activeTab), 50);
        return () => clearTimeout(id);
    }, [activeTab, updateIndicator]);

    useEffect(() => {
        setLoading(true);
        getActiveChats()
            .then(data => { setEvents(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Показываем только PENDING
    const incoming = events.filter(e => e.receiverId === userId && e.status === 'PENDING');
    const outgoing = events.filter(e => e.inviterId  === userId && e.status === 'PENDING');

    const handleCardClick = (event) => {
        navigate('/chats', { state: { eventId: event.id, from: 'invitations' } });
    };

    const tabs = [
        { label: 'Входящие',    badge: incoming.length > 0 ? incoming.length : null },
        { label: 'Отправленные' },
    ];
    const lists = [incoming, outgoing];

    return (
        <div className="inv-page">

            <div className="inv-header">
                <button className="inv-btn-back" onClick={() => navigate('/lubimka')}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="inv-title">Приглаше<span>ния</span></div>
            </div>

            <div className="inv-tab-bar" ref={barRef}>
                {tabs.map((t, i) => (
                    <div
                        key={i}
                        className={`inv-tab ${activeTab === i ? 'active' : ''}`}
                        ref={el => tabRefs.current[i] = el}
                        onClick={() => setActiveTab(i)}
                    >
                        {t.label}
                        {t.badge && <span className="inv-tab-badge">{t.badge}</span>}
                    </div>
                ))}
                <div className="inv-tab-indicator" style={indStyle} />
            </div>

            <div className="inv-scroll">
                {loading ? (
                    <div className="inv-empty"><div style={{ fontSize: 40 }}>⏳</div><div>Загружаем…</div></div>
                ) : lists[activeTab].length === 0 ? (
                    <div className="inv-empty">
                        <div style={{ fontSize: 40 }}>{activeTab === 0 ? '💌' : '📤'}</div>
                        <div className="inv-empty-title">
                            {activeTab === 0 ? 'Нет входящих приглашений' : 'Нет отправленных'}
                        </div>
                        <div className="inv-empty-sub">
                            {activeTab === 0
                                ? 'Как только партнёр пригласит вас — они появятся здесь'
                                : 'Откройте карточку идеи и пригласите партнёра на свидание'}
                        </div>
                    </div>
                ) : (
                    lists[activeTab].map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            isReceiver={activeTab === 0}
                            onClick={() => handleCardClick(event)}
                        />
                    ))
                )}
                <div style={{ height: 16 }} />
            </div>

            <BottomNav />
        </div>
    );
}