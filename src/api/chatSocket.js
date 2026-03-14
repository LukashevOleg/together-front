import { Client } from '@stomp/stompjs';

const WS_URL = 'http://localhost:8080/ws';

/**
 * Создаёт и возвращает STOMP-клиент для чата конкретного свидания.
 *
 * Использование:
 *   const client = createChatSocket({
 *     eventId: 42,
 *     userId:  7,
 *     onMessage: (msg) => setMessages(prev => [...prev, msg]),
 *     onConnect: () => setConnected(true),
 *   });
 *   client.activate();            // подключиться
 *   ...
 *   client.sendText("Привет!");   // отправить сообщение
 *   client.deactivate();          // отключиться при размонтировании
 */
export function createChatSocket({ eventId, userId, onMessage, onSystemEvent, onConnect, onDisconnect }) {
    // require() обходит проблему ES-модулей sockjs-client v1 в CRA
    const webSocketFactory = () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const SockJS = require('sockjs-client');
            const Ctor   = SockJS.default || SockJS;
            return new Ctor(WS_URL);
        } catch {
            // Fallback: нативный WebSocket
            const wsUrl = WS_URL.replace('http://', 'ws://').replace('https://', 'wss://');
            return new WebSocket(wsUrl);
        }
    };

    const client = new Client({
        webSocketFactory,

        // X-User-Id в STOMP CONNECT заголовке — сервер читает в WebSocketAuthInterceptor
        connectHeaders: {
            'X-User-Id': String(userId),
        },

        reconnectDelay: 5000,

        onConnect: () => {
            // Подписываемся на топик чата
            client.subscribe(`/topic/chat/${eventId}`, (frame) => {
                try {
                    const payload = JSON.parse(frame.body);

                    // Системное событие (смена статуса свидания)
                    if (payload.eventType) {
                        onSystemEvent?.(payload);
                    } else {
                        // Обычное или системное сообщение
                        onMessage?.(payload);
                    }
                } catch (e) {
                    console.error('WS parse error', e);
                }
            });

            // Помечаем сообщения прочитанными при подключении
            client.publish({ destination: `/app/chat/${eventId}/read` });

            onConnect?.();
        },

        onDisconnect: () => {
            onDisconnect?.();
        },

        onStompError: (frame) => {
            console.error('STOMP error', frame);
        },

        onWebSocketError: (event) => {
            console.error('WebSocket error', event);
        },
    });

    // Удобный метод — отправить текстовое сообщение
    client.sendText = (content) => {
        if (!client.connected) return;
        client.publish({
            destination: `/app/chat/${eventId}/send`,
            body: JSON.stringify({ content }),
        });
    };

    // Пометить прочитанным через WS
    client.sendRead = () => {
        if (!client.connected) return;
        client.publish({ destination: `/app/chat/${eventId}/read` });
    };

    return client;
}