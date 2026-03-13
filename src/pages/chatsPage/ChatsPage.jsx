import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import {
    getUpcomingDates,
    getChatHistory,
    markChatRead,
    getUnreadCount,
    formatEventDate,
    categoryEmoji,
    categoryGradient,
} from '../../api/datingApi';
import { createChatSocket } from '../../api/chatSocket';
import './ChatsPage.css';

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'вчера';
    const days = ['вс','пн','вт','ср','чт','пт','сб'];
    if (diffDays < 7) return days[d.getDay()];
    return `${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}`;
}

// ── ChatScreen ─────────────────────────────────────────────────────────────
function ChatScreen({ event, userId, onClose }) {
    const [messages,   setMessages]   = useState([]);
    const [inputText,  setInputText]  = useState('');
    const [connected,  setConnected]  = useState(false);
    const [loading,    setLoading]    = useState(true);
    const clientRef    = useRef(null);
    const bottomRef    = useRef(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }, []);

    // 1. Загрузить историю REST
    useEffect(() => {
        setLoading(true);
        getChatHistory(event.id)
            .then(history => {
                setMessages(history);
                setLoading(false);
                scrollToBottom();
            })
            .catch(() => setLoading(false));
    }, [event.id, scrollToBottom]);

    // 2. Подключить WebSocket
    useEffect(() => {
        const client = createChatSocket({
            eventId: event.id,
            userId,
            onMessage: (msg) => {
                setMessages(prev => {
                    // Не дублировать — оптимистичные сообщения уже добавлены
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
            },
            onSystemEvent: (evt) => {
                setMessages(prev => [...prev, {
                    id: `sys-${Date.now()}`,
                    senderId: 0,
                    content: evt.text,
                    type: 'SYSTEM',
                    createdAt: evt.createdAt,
                }]);
                scrollToBottom();
            },
            onConnect:    () => setConnected(true),
            onDisconnect: () => setConnected(false),
        });
        client.activate();
        clientRef.current = client;

        return () => { client.deactivate(); };
    }, [event.id, userId, scrollToBottom]);

    const sendMsg = () => {
        const text = inputText.trim();
        if (!text || !connected) return;

        // Оптимистично добавляем в UI
        const optimistic = {
            id: `opt-${Date.now()}`,
            dateEventId: event.id,
            senderId: userId,
            content: text,
            type: 'TEXT',
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setInputText('');
        scrollToBottom();

        clientRef.current?.sendText(text);
    };

    const bg = categoryGradient(event.ideaCategory);
    const emoji = categoryEmoji(event.ideaCategory);

    return (
        <div className={`ch-screen open`}>
            <div className="ch-screen-status">
                <span>9:41</span>
            </div>

            <div className="ch-topbar">
                <button className="ch-btn-back" onClick={onClose}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="ch-topbar-ava" style={{ background: bg }}>{emoji}</div>
                <div className="ch-topbar-info">
                    <div className="ch-topbar-title">{event.ideaTitle}</div>
                    <div className="ch-topbar-sub">
                        {formatEventDate(event)}
                        {!connected && <span style={{ color: '#888' }}> · подключение…</span>}
                    </div>
                </div>
            </div>

            <div className="ch-messages">
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, paddingTop: 32 }}>
                        Загружаем историю…
                    </div>
                ) : (
                    <>
                        {/* Системный комментарий при создании (hint) */}
                        {event.hint && (
                            <div className="ch-sys-msg">
                                <div className="ch-sys-label">💝 Комментарий при приглашении</div>
                                <div className="ch-sys-text">{event.hint}</div>
                            </div>
                        )}

                        {messages.map((msg, i) => {
                            if (msg.type === 'SYSTEM' || msg.senderId === 0) {
                                return (
                                    <div key={msg.id ?? i} className="ch-sys-msg">
                                        <div className="ch-sys-text">{msg.content}</div>
                                    </div>
                                );
                            }
                            const mine = msg.senderId === userId;
                            return (
                                <div key={msg.id ?? i} className={`ch-bubble-row ${mine ? 'mine' : ''}`}>
                                    <div className={`ch-b-ava ${mine ? 'me' : 'her'}`}>
                                        {mine ? '🐻' : '🌸'}
                                    </div>
                                    <div>
                                        <div className={`ch-bubble ${mine ? 'mine' : 'theirs'}`}>
                                            {msg.content}
                                        </div>
                                        <div className="ch-b-time">{fmtTime(msg.createdAt)}</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            <div className="ch-input-row">
                <input
                    className="ch-input"
                    placeholder="Сообщение…"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMsg()}
                />
                <button className="ch-send" onClick={sendMsg} disabled={!connected}>
                    <svg viewBox="0 0 24 24">
                        <path d="M22 2L11 13"/>
                        <path d="M22 2L15 22l-4-9-9-4 20-7z" fill="white" stroke="none"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ── ChatsPage ──────────────────────────────────────────────────────────────
export default function ChatsPage() {
    const navigate          = useNavigate();
    const { state }         = useLocation();
    const { userId }        = useAuthContext();

    const [events,      setEvents]      = useState([]);
    const [unreadMap,   setUnreadMap]   = useState({});  // eventId → count
    const [loading,     setLoading]     = useState(true);
    const [activeEvent, setActiveEvent] = useState(null);

    // Загружаем список свиданий (ACCEPTED, будущие + недавние)
    useEffect(() => {
        setLoading(true);
        getUpcomingDates()
            .then(data => {
                setEvents(data);
                setLoading(false);
                // Загружаем кол-во непрочитанных для каждого
                data.forEach(ev => {
                    getUnreadCount(ev.id)
                        .then(count => setUnreadMap(prev => ({ ...prev, [ev.id]: count })))
                        .catch(() => {});
                });
            })
            .catch(() => setLoading(false));
    }, []);

    // Если открываем с state.eventId — сразу открываем чат
    useEffect(() => {
        if (state?.eventId && events.length > 0) {
            const ev = events.find(e => e.id === state.eventId);
            if (ev) setActiveEvent(ev);
        }
    }, [state, events]);

    const openChat = (event) => {
        setActiveEvent(event);
        // Сбрасываем badge
        setUnreadMap(prev => ({ ...prev, [event.id]: 0 }));
        markChatRead(event.id).catch(() => {});
    };

    const lastMsgPreview = (event) => {
        // TODO: когда появится last_message в DTO — подставить
        return formatEventDate(event);
    };

    return (
        <div className="chats-page">
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

            <div className="ch-top-bar">
                <button className="ch-btn-back" onClick={() => navigate(-1)}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="ch-top-title">Чаты <span>свиданий</span></div>
                <div style={{ width: 34 }} />
            </div>

            <div className="ch-scroll">
                {loading ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: '#888', fontSize: 14 }}>
                        Загружаем…
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                        <div style={{ fontFamily: 'Cormorant, serif', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                            Нет чатов
                        </div>
                        <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                            Чаты появятся когда партнёр примет приглашение на свидание
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="ch-date-label">Свидания</div>
                        {events.map(event => {
                            const unread = unreadMap[event.id] || 0;
                            const bg     = categoryGradient(event.ideaCategory);
                            const emoji  = categoryEmoji(event.ideaCategory);
                            return (
                                <div key={event.id} className="ch-row" onClick={() => openChat(event)}>
                                    <div className="ch-ava" style={{ background: bg }}>{emoji}</div>
                                    <div className="ch-info">
                                        <div className="ch-name">{event.ideaTitle}</div>
                                        <div className={`ch-preview ${unread > 0 ? 'unread' : ''}`}>
                                            {lastMsgPreview(event)}
                                        </div>
                                    </div>
                                    <div className="ch-right">
                                        <div className="ch-time">{fmtTime(event.updatedAt)}</div>
                                        {unread > 0 && <div className="ch-badge">{unread}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Chat screen (slide in) */}
            {activeEvent && (
                <ChatScreen
                    event={activeEvent}
                    userId={userId}
                    onClose={() => setActiveEvent(null)}
                />
            )}
        </div>
    );
}