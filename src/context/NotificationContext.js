import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuthContext } from './AuthContext';
import { Client } from '@stomp/stompjs';
import { getActiveChats } from '../api/datingApi';

const NotificationContext = createContext({
    totalUnread:   0,
    newEvents:     [],
    clearUnread:   () => {},
    markEventRead: () => {},
});

export function NotificationProvider({ children }) {
    const { userId, isAuthenticated } = useAuthContext();

    const [totalUnread, setTotalUnread] = useState(0);
    const [newEvents,   setNewEvents]   = useState([]);

    const clientRef     = useRef(null);
    const subscribedRef = useRef(new Set());
    const initDoneRef   = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !userId) return;
        if (initDoneRef.current) return;
        initDoneRef.current = true;

        const uid = Number(userId);

        const client = new Client({
            webSocketFactory: () => {
                const SockJS = require('sockjs-client');
                const Ctor = SockJS.default || SockJS;
                return new Ctor('http://localhost:8080/ws');
            },
            connectHeaders: { 'X-User-Id': String(uid) },
            reconnectDelay: 5000,

            onConnect: () => {

                // Персональный канал — новый чат от партнёра
                client.subscribe(`/topic/user/${uid}`, (frame) => {
                    try {
                        const event = JSON.parse(frame.body);
                        if (!event?.id) return;

                        setNewEvents(prev => {
                            const exists = prev.some(e => e.id === event.id);
                            if (exists) {
                                // Обновляем существующее событие (cancel/decline от партнёра)
                                return prev.map(e => e.id === event.id ? { ...e, ...event } : e);
                            }
                            // Новое событие — bump unread и подписываемся на чат
                            setTotalUnread(n => n + 1);
                            subscribeChat(event.id);
                            return [...prev, event];
                        });
                    } catch (e) { console.error('[Notify] parse error', e); }
                });

                // Подписываемся на существующие чаты
                getActiveChats()
                    .then(chats => {
                        chats.forEach(ev => subscribeChat(ev.id));
                    })
                    .catch(() => {});
            },

            onStompError: (f) => console.error('[Notify] STOMP error', f),
            onWebSocketError: (e) => console.error('[Notify] WS error', e),
        });

        function subscribeChat(eventId) {
            if (subscribedRef.current.has(eventId)) return;
            subscribedRef.current.add(eventId);

            client.subscribe(`/topic/chat/${eventId}`, (frame) => {
                try {
                    const msg = JSON.parse(frame.body);
                    if (msg.type === 'SYSTEM' || Number(msg.senderId) === uid || msg.edited) {
                        return;
                    }
                    setTotalUnread(n => n + 1);
                } catch {}
            });
        }

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            clientRef.current = null;
            subscribedRef.current = new Set();
            initDoneRef.current = false;
        };
    }, [userId, isAuthenticated]); // eslint-disable-line

    const clearUnread     = () => setTotalUnread(0);
    const markEventRead   = () => {}; // снижаем на 1 не нужно — clearUnread при входе в чаты

    return (
        <NotificationContext.Provider value={{ totalUnread, newEvents, clearUnread, markEventRead }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}