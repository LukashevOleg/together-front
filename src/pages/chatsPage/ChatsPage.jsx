import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import {
    getActiveChats,
    getChatHistory,
    markChatRead,
    getUnreadCount,
    acceptDateEvent,
    declineDateEvent,
    formatEventDate,
    categoryEmoji,
    categoryGradient,
} from '../../api/datingApi';
import { createChatSocket } from '../../api/chatSocket';
import BottomNav from '../../components/layout/BottomNav';
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

// ── InviteBanner ───────────────────────────────────────────────────────────
// Баннер в чате для получателя приглашения — принять или отклонить
function InviteBanner({ event, userId, onStatusChange }) {
    const [loading, setLoading] = useState(false); // ← хук всегда первым, до любых return

    const isReceiver = event.receiverId === userId;
    if (!isReceiver || event.status !== 'PENDING') return null;

    const handleAccept = async () => {
        setLoading(true);
        try {
            const updated = await acceptDateEvent(event.id);
            onStatusChange(updated);
        } catch (e) {
            console.error('Accept failed', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        setLoading(true);
        try {
            const updated = await declineDateEvent(event.id);
            onStatusChange(updated);
        } catch (e) {
            console.error('Decline failed', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ch-invite-banner">
            <div className="ch-invite-banner-text">
                <div className="ch-invite-banner-title">💌 Приглашение на свидание</div>
                <div className="ch-invite-banner-meta">{formatEventDate(event)}</div>
                {event.isSurprise && (
                    <div className="ch-invite-banner-surprise">🎁 Свидание-сюрприз — место откроется при встрече</div>
                )}
                {event.hint && (
                    <div className="ch-invite-banner-hint">💬 {event.hint}</div>
                )}
            </div>
            <div className="ch-invite-banner-actions">
                <button
                    className="ch-invite-btn accept"
                    onClick={handleAccept}
                    disabled={loading}
                >
                    Принять
                </button>
                <button
                    className="ch-invite-btn decline"
                    onClick={handleDecline}
                    disabled={loading}
                >
                    Отклонить
                </button>
            </div>
        </div>
    );
}

// ── PendingBanner ──────────────────────────────────────────────────────────
// Баннер для отправителя — ожидание ответа
function PendingBanner({ event, userId }) {
    const isInviter = event.inviterId === userId;
    if (!isInviter || event.status !== 'PENDING') return null;

    return (
        <div className="ch-pending-banner">
            <div className="ch-pending-icon">⏳</div>
            <div className="ch-pending-text">
                <div className="ch-pending-title">Ожидаем ответа</div>
                <div className="ch-pending-meta">{formatEventDate(event)}</div>
            </div>
        </div>
    );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        PENDING:   { text: '⏳ Ожидает ответа',  cls: 'pending'   },
        ACCEPTED:  { text: '✅ Идём!',            cls: 'accepted'  },
        DECLINED:  { text: '❌ Отклонено',        cls: 'declined'  },
        CANCELLED: { text: '🚫 Отменено',         cls: 'cancelled' },
        COMPLETED: { text: '🎉 Состоялось',       cls: 'completed' },
    };
    const s = map[status] || map.PENDING;
    return <span className={`ch-status-badge ch-status-badge--${s.cls}`}>{s.text}</span>;
}

// ── ChatScreen ─────────────────────────────────────────────────────────────
function ChatScreen({ event: initialEvent, userId, onClose, from }) {
    const navigate = useNavigate();

    const [event,       setEvent]      = useState(initialEvent);
    const [messages,    setMessages]   = useState([]);
    const [inputText,   setInputText]  = useState('');
    const [connected,   setConnected]  = useState(false);
    const [loading,     setLoading]    = useState(true);
    const [editingId,   setEditingId]  = useState(null); // id редактируемого сообщения
    const [editText,    setEditText]   = useState('');
    const clientRef   = useRef(null);
    const bottomRef   = useRef(null);
    const setEventRef = useRef(setEvent);
    useEffect(() => { setEventRef.current = setEvent; }, [setEvent]);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }, []);

    // Загрузить историю
    useEffect(() => {
        setLoading(true);
        getChatHistory(event.id)
            .then(history => { setMessages(history); setLoading(false); scrollToBottom(); })
            .catch(() => setLoading(false));
    }, [event.id, scrollToBottom]);

    // WebSocket
    useEffect(() => {
        const client = createChatSocket({
            eventId: event.id,
            userId,
            onMessage: (msg) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    const optIdx = prev.findIndex(
                        m => String(m.id).startsWith('opt-')
                            && m.senderId === msg.senderId
                            && m.content  === msg.content
                    );
                    if (optIdx !== -1) {
                        const next = [...prev]; next[optIdx] = msg; return next;
                    }
                    return [...prev, msg];
                });
                scrollToBottom();
            },
            onSystemEvent: (evt) => {
                if (evt.eventType) setEventRef.current(prev => ({ ...prev, status: evt.eventType }));
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.type === 'SYSTEM' && last?.content === evt.text) return prev;
                    return [...prev, { id: `sys-${Date.now()}`, senderId: 0, content: evt.text, type: 'SYSTEM', createdAt: evt.createdAt }];
                });
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
        const optimistic = {
            id: `opt-${Date.now()}`, dateEventId: event.id,
            senderId: userId, content: text, type: 'TEXT',
            isRead: false, createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setInputText('');
        scrollToBottom();
        clientRef.current?.sendText(text);
    };

    // Редактирование — локально (TODO: добавить WS-событие edit на бэке)
    const startEdit = (msg) => {
        if (msg.senderId !== userId) return;
        setEditingId(msg.id);
        setEditText(msg.content);
    };
    const confirmEdit = () => {
        if (!editText.trim()) return;
        setMessages(prev => prev.map(m =>
            m.id === editingId ? { ...m, content: editText.trim(), edited: true } : m
        ));
        setEditingId(null);
        setEditText('');
    };
    const cancelEdit = () => { setEditingId(null); setEditText(''); };

    // Кнопка назад — если пришли из Lubimka, возвращаемся туда
    const handleBack = () => {
        if (from === 'lubimka') { navigate('/lubimka'); }
        else { onClose(); }
    };

    const bg    = categoryGradient(event.ideaCategory);
    const emoji = categoryEmoji(event.ideaCategory);
    // Hint — подсказка при сюрпризе
    const hint  = event.hint;

    return (
        <div className="ch-screen open">
            <div className="ch-screen-status"><span>9:41</span></div>

            <div className="ch-topbar">
                <button className="ch-btn-back" onClick={handleBack}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="ch-topbar-ava" style={{ background: bg }}>{emoji}</div>
                <div className="ch-topbar-info">
                    <div className="ch-topbar-title">{event.ideaTitle}</div>
                    <div className="ch-topbar-sub">
                        <StatusBadge status={event.status} />
                        {!connected && <span style={{ color: '#aaa', marginLeft: 6, fontSize: 10 }}>· подключение…</span>}
                    </div>
                </div>
            </div>

            {/* Закреплённый комментарий при приглашении */}
            {(hint || event.status === 'PENDING') && (
                <div className="ch-pinned">
                    <div className="ch-pinned-icon">📌</div>
                    <div className="ch-pinned-body">
                        <div className="ch-pinned-label">Комментарий к приглашению</div>
                        <div className="ch-pinned-text">
                            {hint || formatEventDate(event)}
                            {event.isSurprise && <span className="ch-pinned-surprise"> · 🎁 Сюрприз</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Баннер приглашения */}
            <InviteBanner event={event} userId={userId} onStatusChange={setEvent} />
            <PendingBanner event={event} userId={userId} />

            <div className="ch-messages">
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, paddingTop: 32 }}>
                        Загружаем историю…
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => {
                            if (msg.type === 'SYSTEM' || msg.senderId === 0) {
                                return (
                                    <div key={msg.id ?? i} className="ch-sys-msg">
                                        <div className="ch-sys-text">{msg.content}</div>
                                    </div>
                                );
                            }
                            const mine = msg.senderId === userId;
                            const isEditing = editingId === msg.id;
                            return (
                                <div key={msg.id ?? i} className={`ch-bubble-row ${mine ? 'mine' : ''}`}>
                                    <div className={`ch-b-ava ${mine ? 'me' : 'her'}`}>
                                        {mine ? '🐻' : '🌸'}
                                    </div>
                                    <div>
                                        {isEditing ? (
                                            <div className="ch-edit-wrap">
                                                <input
                                                    className="ch-edit-input"
                                                    value={editText}
                                                    onChange={e => setEditText(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                                    autoFocus
                                                />
                                                <div className="ch-edit-actions">
                                                    <button className="ch-edit-btn save" onClick={confirmEdit}>Сохранить</button>
                                                    <button className="ch-edit-btn cancel" onClick={cancelEdit}>Отмена</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={`ch-bubble ${mine ? 'mine' : 'theirs'}`}
                                                onDoubleClick={() => mine && startEdit(msg)}
                                                title={mine ? 'Двойной клик — редактировать' : ''}
                                            >
                                                {msg.content}
                                                {msg.edited && <span className="ch-edited">изменено</span>}
                                            </div>
                                        )}
                                        <div className="ch-b-time">{fmtTime(msg.createdAt)}</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* Строка ввода */}
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
    const navigate   = useNavigate();
    const { state }  = useLocation();
    const { userId } = useAuthContext();

    const [events,      setEvents]      = useState([]);
    const [unreadMap,   setUnreadMap]   = useState({});
    const [lastMsgs,    setLastMsgs]    = useState({}); // eventId → last message text
    const [loading,     setLoading]     = useState(true);
    const [activeEvent, setActiveEvent] = useState(null);
    const [from,        setFrom]        = useState(null);

    // Загружаем все активные чаты (PENDING + ACCEPTED)
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getActiveChats()
            .then(data => {
                if (cancelled) return;
                setEvents(data);
                setLoading(false);
                // Счётчики непрочитанных + последние сообщения для превью
                data.forEach(ev => {
                    getUnreadCount(ev.id)
                        .then(count => {
                            if (!cancelled) setUnreadMap(prev => ({ ...prev, [ev.id]: count }));
                        })
                        .catch(() => {});
                    getChatHistory(ev.id)
                        .then(msgs => {
                            if (cancelled) return;
                            const last = msgs.filter(m => m.type !== 'SYSTEM').pop();
                            if (last) setLastMsgs(prev => ({ ...prev, [ev.id]: last.content }));
                        })
                        .catch(() => {});
                });
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // Реалтайм: WS-подписки на все чаты для мгновенного обновления превью
    useEffect(() => {
        if (events.length === 0 || !userId) return;

        const sockets = events.map(ev => {
            const client = createChatSocket({
                eventId: ev.id,
                userId,
                onMessage: (msg) => {
                    if (msg.type === 'SYSTEM') return;
                    // Обновляем последнее сообщение в превью
                    setLastMsgs(prev => ({ ...prev, [ev.id]: msg.content }));
                    // Не считаем unread если этот чат сейчас открыт
                    setActiveEvent(current => {
                        if (current?.id !== ev.id) {
                            setUnreadMap(prev => ({ ...prev, [ev.id]: (prev[ev.id] || 0) + 1 }));
                        }
                        return current;
                    });
                },
                onSystemEvent: (evt) => {
                    // Обновляем статус события в списке если пришло системное
                    if (evt.eventType) {
                        setEvents(prev => prev.map(e =>
                            e.id === ev.id ? { ...e, status: evt.eventType } : e
                        ));
                    }
                },
            });
            client.activate();
            return client;
        });

        return () => sockets.forEach(c => c.deactivate());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events.length, userId]);

    // Автооткрытие чата если пришли с state.eventId
    useEffect(() => {
        if (state?.eventId && events.length > 0) {
            const ev = events.find(e => e.id === state.eventId);
            if (ev) openChat(ev, state?.from);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, events]);

    const openChat = (event, fromSource = null) => {
        setActiveEvent(event);
        setFrom(fromSource);
        setUnreadMap(prev => ({ ...prev, [event.id]: 0 }));
        markChatRead(event.id).catch(() => {});
    };

    // PENDING события — ожидают ответа
    const pendingEvents  = events.filter(e => e.status === 'PENDING');
    const acceptedEvents = events.filter(e => e.status === 'ACCEPTED');

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
                <div className="ch-top-title">Чаты <span>свиданий</span></div>
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
                            Откройте карточку идеи и пригласите партнёра — чат создастся сразу
                        </div>
                    </div>
                ) : (
                    <>
                        {/* PENDING — обсуждение приглашения */}
                        {pendingEvents.length > 0 && (
                            <>
                                <div className="ch-date-label">Ожидают ответа</div>
                                {pendingEvents.map(event => {
                                    const unread  = unreadMap[event.id] || 0;
                                    const lastMsg = lastMsgs[event.id];
                                    const isReceiver = event.receiverId === userId;
                                    return (
                                        <div key={event.id} className="ch-row ch-row--pending" onClick={() => openChat(event)}>
                                            <div className="ch-ava" style={{ background: categoryGradient(event.ideaCategory) }}>
                                                {categoryEmoji(event.ideaCategory)}
                                            </div>
                                            <div className="ch-info">
                                                <div className="ch-name">{event.ideaTitle}</div>
                                                <div className="ch-preview">
                                                    {lastMsg || (isReceiver ? '💌 Вас пригласили' : '⏳ Ожидаем ответа')}
                                                </div>
                                            </div>
                                            <div className="ch-right">
                                                <div className="ch-time">{fmtTime(event.createdAt)}</div>
                                                {unread > 0 && <div className="ch-badge">{unread}</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {/* ACCEPTED — запланированные свидания */}
                        {acceptedEvents.length > 0 && (
                            <>
                                <div className="ch-date-label">Запланированные</div>
                                {acceptedEvents.map(event => {
                                    const unread  = unreadMap[event.id] || 0;
                                    const lastMsg = lastMsgs[event.id];
                                    return (
                                        <div key={event.id} className="ch-row" onClick={() => openChat(event)}>
                                            <div className="ch-ava" style={{ background: categoryGradient(event.ideaCategory) }}>
                                                {categoryEmoji(event.ideaCategory)}
                                            </div>
                                            <div className="ch-info">
                                                <div className="ch-name">{event.ideaTitle}</div>
                                                <div className={`ch-preview ${unread > 0 ? 'unread' : ''}`}>
                                                    {lastMsg || formatEventDate(event)}
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
                    </>
                )}
            </div>

            {activeEvent && (
                <ChatScreen
                    event={activeEvent}
                    userId={userId}
                    from={from}
                    onClose={() => setActiveEvent(null)}
                />
            )}

            {!activeEvent && <BottomNav />}
        </div>
    );
}