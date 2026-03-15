import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getActiveChats,
    acceptDateEvent,
    declineDateEvent,
    cancelDateEvent,
    categoryEmoji,
    categoryGradient,
    formatEventDate,
} from '../../api/datingApi';
import { useAuthContext } from '../../context/AuthContext';
import BottomNav from '../../components/layout/BottomNav';
import './InvitationsPage.css';

const STATUS_LABELS = {
    PENDING:   { text: '⏳ Ожидание',  cls: 'waiting'   },
    ACCEPTED:  { text: '✅ Принято',   cls: 'accepted'  },
    DECLINED:  { text: '❌ Отклонено', cls: 'declined'  },
    CANCELLED: { text: '🚫 Отменено',  cls: 'cancelled' },
};

function EventCard({ event, isReceiver, onAccept, onDecline, onCancel, onChat }) {
    const [loading, setLoading] = useState(false);
    const bg    = categoryGradient(event.ideaCategory);
    const emoji = categoryEmoji(event.ideaCategory);
    const s     = STATUS_LABELS[event.status] || STATUS_LABELS.PENDING;

    const handleAccept = async (e) => {
        e.stopPropagation();
        setLoading(true);
        try { await onAccept(event.id); } finally { setLoading(false); }
    };
    const handleDecline = async (e) => {
        e.stopPropagation();
        setLoading(true);
        try { await onDecline(event.id); } finally { setLoading(false); }
    };
    const handleCancel = async (e) => {
        e.stopPropagation();
        setLoading(true);
        try { await onCancel(event.id); } finally { setLoading(false); }
    };

    return (
        <div className="inv-card" onClick={() => onChat(event.id)}>
            <div className="inv-card-img" style={{ background: bg }}>{emoji}</div>
            <div className="inv-card-body">
                <div className={`inv-status ${s.cls}`}>{s.text}</div>
                <div className="inv-title">{event.ideaTitle}</div>
                <div className="inv-date">{formatEventDate(event)}</div>

                {/* Получатель: PENDING → Принять / Отклонить */}
                {isReceiver && event.status === 'PENDING' && (
                    <div className="inv-actions">
                        <button className="inv-btn accept"  onClick={handleAccept}  disabled={loading}>Принять</button>
                        <button className="inv-btn decline" onClick={handleDecline} disabled={loading}>Отклонить</button>
                    </div>
                )}

                {/* Отправитель: PENDING или ACCEPTED → Отменить (cancel endpoint) */}
                {!isReceiver && (event.status === 'PENDING' || event.status === 'ACCEPTED') && (
                    <div className="inv-actions">
                        <button className="inv-btn cancel" onClick={handleCancel} disabled={loading}>Отменить</button>
                    </div>
                )}
            </div>

            <button className="inv-chat-btn" onClick={e => { e.stopPropagation(); onChat(event.id); }}>
                <svg viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </button>
        </div>
    );
}

export default function InvitationsPage() {
    const navigate      = useNavigate();
    const { userId }    = useAuthContext();
    const [events,      setEvents]   = useState([]);
    const [loading,     setLoading]  = useState(true);
    const [activeTab,   setActiveTab]= useState(0);
    const tabRefs   = useRef([]);
    const barRef    = useRef(null);
    const [indStyle, setIndStyle]    = useState({ left: 0, width: 0 });

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

    const incoming  = events.filter(e => e.receiverId === userId);
    const outgoing  = events.filter(e => e.inviterId  === userId);
    const pendingIn = incoming.filter(e => e.status === 'PENDING').length;

    const handleAccept = async (eventId) => {
        const updated = await acceptDateEvent(eventId);
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updated } : e));
    };
    const handleDecline = async (eventId) => {
        const updated = await declineDateEvent(eventId);
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updated } : e));
    };
    const handleCancel = async (eventId) => {
        const updated = await cancelDateEvent(eventId);
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updated } : e));
    };
    const goToChat = (eventId) => {
        navigate('/chats', { state: { eventId } });
    };

    const tabs = [
        { label: 'Входящие', badge: pendingIn > 0 ? pendingIn : null },
        { label: 'Отправленные' },
    ];
    const lists = [incoming, outgoing];

    return (
        <div className="inv-page">
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
                            isReceiver={event.receiverId === userId}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                            onCancel={handleCancel}
                            onChat={goToChat}
                        />
                    ))
                )}
                <div style={{ height: 16 }} />
            </div>

            <BottomNav />
        </div>
    );
}