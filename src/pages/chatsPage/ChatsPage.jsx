import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import {
    getActiveChats,
    getChatHistory,
    getDateHistory,
    markChatRead,
    getUnreadCount,
    acceptDateEvent,
    declineDateEvent,
    cancelDateEvent,
    editChatMessage,
    formatEventDate,
    categoryEmoji,
    categoryGradient,
} from '../../api/datingApi';
import { getMyProfile, getPartner } from '../../api/profilerApi';
import { useNotifications } from '../../context/NotificationContext';
import { createChatSocket } from '../../api/chatSocket';
import { getEventTitle, getEventCoverUrl, SURPRISE_IMAGE } from '../../utils/surpriseHelper';
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
function ChatScreen({ event: initialEvent, userId, onClose, from, myProfile, partnerProfile }) {
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
                    // Если сообщение с таким id уже есть и edited=true — обновляем контент
                    const existingIdx = prev.findIndex(m => m.id === msg.id);
                    if (existingIdx !== -1) {
                        if (msg.edited) {
                            const next = [...prev];
                            next[existingIdx] = msg;
                            return next;
                        }
                        return prev; // дубль без редактирования — пропускаем
                    }
                    // Заменяем оптимистичное сообщение
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

    // Редактирование через бэк — сохраняется в БД и рассылается по WS
    const startEdit = (msg) => {
        if (msg.senderId !== userId) return;
        setEditingId(msg.id);
        setEditText(msg.content);
    };
    const confirmEdit = async () => {
        if (!editText.trim() || editingId == null) return;
        const text = editText.trim();
        // Оптимистично обновляем локально
        setMessages(prev => prev.map(m =>
            m.id === editingId ? { ...m, content: text, edited: true } : m
        ));
        setEditingId(null);
        setEditText('');
        try {
            // Сохраняем на бэке — WS вернёт обновлённое сообщение всем
            await editChatMessage(event.id, editingId, text);
        } catch (e) {
            console.error('Edit failed', e);
        }
    };
    const cancelEdit = () => { setEditingId(null); setEditText(''); };

    // Аватарки: определяем кто inviter кто receiver
    const myAvatarUrl      = myProfile?.avatarUrl || null;
    const partnerAvatarUrl = partnerProfile?.avatarUrl || null;

    // Кнопка назад — если пришли из Lubimka или Invitations, возвращаемся туда
    const handleBack = () => {
        if (from === 'lubimka')      { navigate('/lubimka'); }
        else if (from === 'invitations') { navigate('/invitations'); }
        else { onClose(); }
    };

    const bg         = categoryGradient(event.ideaCategory);
    const emoji      = categoryEmoji(event.ideaCategory);
    const coverUrl   = getEventCoverUrl(event, userId);
    const titleShown = getEventTitle(event, userId);
    const isPending  = event.status === 'PENDING';
    const isReceiver = event.receiverId === userId;
    const isSurpriseForMe = event.isSurprise && isReceiver;
    const [infoOpen, setInfoOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const handleAccept = async () => {
        setActionLoading(true);
        try {
            const updated = await acceptDateEvent(event.id);
            setEvent(prev => ({ ...prev, ...updated }));
            setInfoOpen(false);
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
    };

    const handleDecline = async () => {
        setActionLoading(true);
        try {
            const updated = await declineDateEvent(event.id);
            setEvent(prev => ({ ...prev, ...updated }));
            setInfoOpen(false);
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
    };

    return (
        <div className="ch-screen open">

            <div className="ch-topbar">
                <button className="ch-btn-back" onClick={handleBack}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div
                    className="ch-topbar-ava"
                    style={{
                        background: coverUrl ? 'none' : bg,
                        overflow: 'hidden',
                        cursor: (!isSurpriseForMe) ? 'pointer' : 'default',
                    }}
                    onClick={() => !isSurpriseForMe && navigate(`/ideas/${event.ideaId}`)}
                >
                    {coverUrl
                        ? <img src={coverUrl} alt="сюрприз" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                        : emoji
                    }
                </div>
                <div
                    className="ch-topbar-info"
                    style={{ cursor: (!isSurpriseForMe) ? 'pointer' : 'default' }}
                    onClick={() => !isSurpriseForMe && navigate(`/ideas/${event.ideaId}`)}
                >
                    <div className="ch-topbar-title">{titleShown}</div>
                    <div className="ch-topbar-sub">
                        <StatusBadge status={event.status} />
                        {!connected && <span style={{ color: '#aaa', marginLeft: 6, fontSize: 10 }}>· подключение…</span>}
                    </div>
                </div>
                {/* Кнопка инфо — открывает попап с деталями */}
                <button className="ch-info-btn" onClick={() => setInfoOpen(o => !o)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5"/>
                        <line x1="12" y1="12" x2="12" y2="16"/>
                    </svg>
                </button>
            </div>

            {/* Попап с деталями приглашения */}
            {infoOpen && (
                <>
                    <div className="ch-info-bg" onClick={() => setInfoOpen(false)} />
                    <div className="ch-info-popup">
                        {formatEventDate(event) && (
                            <div className="ch-info-row">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                <span>{formatEventDate(event)}</span>
                            </div>
                        )}
                        {event.isSurprise && (
                            <div className="ch-info-row">🎁 <span>Свидание-сюрприз</span></div>
                        )}
                        {event.hint && (
                            <div className="ch-info-row">💬 <span style={{ fontStyle: 'italic', color: '#666' }}>{event.hint}</span></div>
                        )}
                        {isPending && isReceiver && (
                            <div className="ch-info-actions">
                                <button className="ch-info-action accept" onClick={handleAccept} disabled={actionLoading}>
                                    ✅ Принять
                                </button>
                                <button className="ch-info-action decline" onClick={handleDecline} disabled={actionLoading}>
                                    Отклонить
                                </button>
                            </div>
                        )}
                        {isPending && !isReceiver && (
                            <div className="ch-info-actions">
                                <button
                                    className="ch-info-action decline"
                                    style={{ color: '#C0392B' }}
                                    onClick={async () => {
                                        setActionLoading(true);
                                        try {
                                            const updated = await cancelDateEvent(event.id);
                                            setEvent(prev => ({ ...prev, ...updated }));
                                            setInfoOpen(false);
                                        } catch(e) { console.error(e); }
                                        finally { setActionLoading(false); }
                                    }}
                                    disabled={actionLoading}
                                >
                                    🚫 Отменить
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

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
                                        {mine
                                            ? (myAvatarUrl
                                                ? <img src={myAvatarUrl} alt="me" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                : '🐻')
                                            : (partnerAvatarUrl
                                                ? <img src={partnerAvatarUrl} alt="partner" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                : '🌸')
                                        }
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
    const { newEvents, clearUnread, markEventRead } = useNotifications();

    // Очищаем badge когда зашли в раздел чатов
    useEffect(() => { clearUnread(); }, []); // eslint-disable-line

    const [events,      setEvents]      = useState([]);
    const [unreadMap,   setUnreadMap]   = useState({});
    const [lastMsgs,    setLastMsgs]    = useState({});
    const [loading,     setLoading]     = useState(true);
    const [activeEvent, setActiveEvent] = useState(null);
    const [from,        setFrom]        = useState(null);
    const [myProfile,   setMyProfile]   = useState(null);
    const [partnerProfile, setPartnerProfile] = useState(null);

    // Загружаем профили для аватарок
    useEffect(() => {
        Promise.all([
            getMyProfile().catch(() => null),
            getPartner().catch(() => null),
        ]).then(([me, partner]) => {
            setMyProfile(me);
            setPartnerProfile(partner);
        });
    }, []);

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
        markEventRead(event.id);
        markChatRead(event.id).catch(() => {});
    };

    // Табы: 0=Запланированные(ACCEPTED), 1=Приглашения(PENDING), 2=Прошедшие(COMPLETED)
    const [activeTab,  setActiveTab]  = useState(0);
    const [tabOffset,  setTabOffset]  = useState(0);
    const [history,    setHistory]    = useState([]);
    const tabBarRef  = useRef(null);
    const trackRef   = useRef(null);
    const [indStyle,   setIndStyle]   = useState({ left: 0, width: 0 });
    const TABS = ['Запланированные', 'Приглашения', 'Прошедшие', 'Не состоявшиеся'];

    // Реалтайм: подписываемся на WS каждого чата чтобы обновлять превью без перезагрузки
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
                    // Обновляем unread только если этот чат не открыт
                    setActiveEvent(current => {
                        if (!current || current.id !== ev.id) {
                            setUnreadMap(prev => ({ ...prev, [ev.id]: (prev[ev.id] || 0) + 1 }));
                        }
                        return current;
                    });
                },
                onSystemEvent: (evt) => {
                    // Обновляем статус события если изменился (принято/отклонено)
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

    // Синхронизируем события из NotificationContext (новые + обновлённые статусы)
    useEffect(() => {
        if (newEvents.length === 0) return;
        setEvents(prev => {
            const existingIds = new Set(prev.map(e => e.id));
            const fresh = newEvents.filter(e => !existingIds.has(e.id));
            // Обновляем статусы существующих событий (cancel/decline)
            const updated = prev.map(e => {
                const upd = newEvents.find(ne => ne.id === e.id);
                return upd ? { ...e, ...upd } : e;
            });
            if (fresh.length === 0) return updated;
            // Подгружаем previews для новых
            fresh.forEach(ev => {
                getUnreadCount(ev.id).then(count => setUnreadMap(p => ({ ...p, [ev.id]: count }))).catch(() => {});
            });
            return [...updated, ...fresh];
        });
    }, [newEvents]);

    // Загружаем историю (прошедшие свидания)
    useEffect(() => {
        getDateHistory().then(data => setHistory(data || [])).catch(() => {});
    }, []);

    // Индикатор таба
    const updateIndicator = useCallback((idx) => {
        const bar = tabBarRef.current;
        if (!bar) return;
        const tabs = bar.querySelectorAll('.ch-tab');
        const tab  = tabs[idx];
        if (!tab) return;
        const br = bar.getBoundingClientRect();
        const tr = tab.getBoundingClientRect();
        setIndStyle({ left: tr.left - br.left, width: tr.width });
    }, []);

    useLayoutEffect(() => {
        const id = setTimeout(() => updateIndicator(activeTab), 50);
        return () => clearTimeout(id);
    }, [activeTab, updateIndicator]);

    const tabElemsRef = useRef([]);

    const goTab = (idx) => {
        setActiveTab(idx);
        setTabOffset(idx * 100);
        // Прокручиваем таббар чтобы выбранный таб был полностью виден
        const bar = tabBarRef.current;
        const tab = tabElemsRef.current[idx];
        if (bar && tab) {
            const barRect = bar.getBoundingClientRect();
            const tabRect = tab.getBoundingClientRect();
            if (tabRect.right > barRect.right) {
                bar.scrollBy({ left: tabRect.right - barRect.right + 12, behavior: 'smooth' });
            } else if (tabRect.left < barRect.left) {
                bar.scrollBy({ left: tabRect.left - barRect.left - 12, behavior: 'smooth' });
            }
        }
    };

    // Свайп по табам
    const swipeStartX = useRef(null);
    const handleSwipeStart = (e) => { swipeStartX.current = e.touches?.[0]?.clientX ?? e.clientX; };
    const handleSwipeEnd   = (e) => {
        if (swipeStartX.current == null) return;
        const dx = (e.changedTouches?.[0]?.clientX ?? e.clientX) - swipeStartX.current;
        if (Math.abs(dx) < 50) return;
        if (dx < 0 && activeTab < 3) goTab(activeTab + 1);
        if (dx > 0 && activeTab > 0) goTab(activeTab - 1);
        swipeStartX.current = null;
    };

    const cancelledEvents = events
        .filter(e => e.status === 'CANCELLED' || e.status === 'DECLINED')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const acceptedEvents = events
        .filter(e => e.status === 'ACCEPTED')
        .sort((a, b) => {
            const ta = lastMsgs[a.id] ? new Date(a.updatedAt).getTime() : 0;
            const tb = lastMsgs[b.id] ? new Date(b.updatedAt).getTime() : 0;
            return tb - ta;
        });
    const pendingEvents = events
        .filter(e => e.status === 'PENDING')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Значки непрочитанных по табам
    const unreadAccepted = acceptedEvents.reduce((s, e) => s + (unreadMap[e.id] || 0), 0);
    const unreadPending  = pendingEvents.reduce((s, e)  => s + (unreadMap[e.id] || 0), 0);

    const renderRow = (event, extraCls = '') => {
        const unread    = unreadMap[event.id] || 0;
        const lastMsg   = lastMsgs[event.id];
        const isReceiver = event.receiverId === userId;
        const title     = getEventTitle(event, userId);
        const coverUrl  = getEventCoverUrl(event, userId);
        return (
            <div key={event.id} className={`ch-row ${extraCls}`} onClick={() => openChat(event)}>
                <div className="ch-ava" style={{
                    background: coverUrl ? 'none' : categoryGradient(event.ideaCategory),
                    overflow: 'hidden',
                }}>
                    {coverUrl
                        ? <img src={coverUrl} alt="сюрприз" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : categoryEmoji(event.ideaCategory)
                    }
                </div>
                <div className="ch-info">
                    <div className="ch-name">{title}</div>
                    <div className="ch-preview">
                        {lastMsg || (event.status === 'PENDING'
                            ? (isReceiver ? '💌 Вас пригласили' : '⏳ Ожидаем ответа')
                            : formatEventDate(event))}
                    </div>
                </div>
                <div className="ch-right">
                    <div className="ch-time">{fmtTime(event.updatedAt || event.createdAt)}</div>
                    {unread > 0 && <div className="ch-badge">{unread}</div>}
                </div>
            </div>
        );
    };

    const tabBadge = [unreadAccepted, unreadPending, 0, 0];

    return (
        <div className="chats-page">

            <div className="ch-top-bar">
                <div className="ch-top-title">Чаты свиданий</div>
            </div>

            {/* TAB BAR */}
            <div className="ch-tab-bar" ref={tabBarRef}>
                {TABS.map((label, i) => (
                    <div
                        key={i}
                        className={`ch-tab ${activeTab === i ? 'active' : ''}`}
                        ref={el => tabElemsRef.current[i] = el}
                        onClick={() => goTab(i)}
                    >
                        {label}
                        {tabBadge[i] > 0 && <span className="ch-tab-badge">{tabBadge[i]}</span>}
                    </div>
                ))}
            </div>

            {/* SWIPEABLE TRACK */}
            <div
                className="ch-scroll"
                ref={trackRef}
                onTouchStart={handleSwipeStart}
                onTouchEnd={handleSwipeEnd}
                onMouseDown={handleSwipeStart}
                onMouseUp={handleSwipeEnd}
            >
                {loading ? (
                    <div className="ch-loading">Загружаем…</div>
                ) : (
                    <>
                        {/* TAB 0: Запланированные */}
                        {activeTab === 0 && (
                            acceptedEvents.length === 0
                                ? <div className="ch-empty"><div className="ch-empty-emoji">📅</div><div className="ch-empty-title">Нет запланированных</div><div className="ch-empty-sub">Как только партнёр примет приглашение — свидание появится здесь</div></div>
                                : acceptedEvents.map(e => renderRow(e))
                        )}
                        {/* TAB 1: Приглашения */}
                        {activeTab === 1 && (
                            pendingEvents.length === 0
                                ? <div className="ch-empty"><div className="ch-empty-emoji">💌</div><div className="ch-empty-title">Нет активных приглашений</div><div className="ch-empty-sub">Пригласите партнёра на свидание из карточки идеи</div></div>
                                : pendingEvents.map(e => renderRow(e, 'ch-row--pending'))
                        )}
                        {/* TAB 2: Прошедшие */}
                        {activeTab === 2 && (
                            history.length === 0
                                ? <div className="ch-empty"><div className="ch-empty-emoji">🕐</div><div className="ch-empty-title">Нет прошедших свиданий</div><div className="ch-empty-sub">История свиданий появится здесь</div></div>
                                : history.map(e => renderRow(e))
                        )}
                        {/* TAB 3: Не состоявшиеся */}
                        {activeTab === 3 && (
                            cancelledEvents.length === 0
                                ? <div className="ch-empty"><div className="ch-empty-emoji">🚫</div><div className="ch-empty-title">Нет отменённых</div><div className="ch-empty-sub">Отменённые и отклонённые приглашения появятся здесь</div></div>
                                : cancelledEvents.map(e => renderRow(e))
                        )}
                    </>
                )}
            </div>

            {activeEvent && (
                <ChatScreen
                    event={activeEvent}
                    userId={userId}
                    from={from}
                    myProfile={myProfile}
                    partnerProfile={partnerProfile}
                    onClose={() => setActiveEvent(null)}
                />
            )}

            {!activeEvent && <BottomNav />}
        </div>
    );
}