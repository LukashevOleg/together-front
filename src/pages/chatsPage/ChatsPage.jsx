import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatsPage.css';

// ── Заглушки ───────────────────────────────────────────────────────────────
const STUB_CHATS = [
    {
        id: 1, emoji: '🌹', bg: 'linear-gradient(135deg,#3D0A14,#7B1E2E)',
        name: 'Вечерний пикник на крыше',
        sub: '7 марта · 19:00 · с Анастасией',
        preview: 'Анастасия: Что взять с собой?',
        time: '20:21', unread: 2,
        comment: 'Хочу устроить тебе незабываемый вечер на крыше! Там будет плед, вино и твои любимые сыры 🧀🍷 Оденься потеплее',
        messages: [
            { mine: false, text: 'Ой, как романтично! Я так давно хотела на крышу 😍', time: '20:14' },
            { mine: true,  text: 'Тогда договорились! Встречаемся у метро в 18:45?', time: '20:18' },
            { mine: false, text: 'Да, отлично! Что взять с собой?', time: '20:21' },
        ],
    },
    {
        id: 2, emoji: '🎨', bg: 'linear-gradient(135deg,#4A1020,#8B2535)',
        name: 'Мастер-класс по керамике',
        sub: '19 марта · 14:00 · с Анастасией',
        preview: 'Анастасия: Видела эту студию — выглядит уютно',
        time: '18:05', unread: 1,
        comment: 'Видела эту студию — выглядит очень уютно, хочу попробовать что-то новое вместе',
        messages: [
            { mine: false, text: 'Видела эту студию — выглядит очень уютно!', time: '18:05' },
        ],
    },
    {
        id: 3, emoji: '⛸', bg: 'linear-gradient(135deg,#1A1A1A,#383838)',
        name: 'Катание на коньках',
        sub: '15 марта · 17:00 · с Анастасией',
        preview: 'Вы: Берём горячий шоколад ☕',
        time: 'пн', unread: 0,
        comment: 'Давай покатаемся! Берём горячий шоколад с собой ☕',
        messages: [
            { mine: false, text: 'Ура, обожаю коньки! Надо взять термос 🧣', time: 'пн, 15:30' },
            { mine: true,  text: 'Берём горячий шоколад ☕', time: 'пн, 15:34' },
        ],
    },
    {
        id: 4, emoji: '🍷', bg: 'linear-gradient(135deg,#1C1C1C,#3A3A3A)',
        name: 'Винная дегустация в баре',
        sub: '12 марта · 20:00 · с Анастасией',
        preview: 'Анастасия: Звучит отлично!',
        time: 'вс', unread: 0,
        comment: 'Нашла классный бар с дегустацией! Как думаешь, пойдём?',
        messages: [
            { mine: false, text: 'Звучит отлично! Я обожаю такие вещи 🍷', time: 'вс, 19:45' },
        ],
    },
    {
        id: 5, emoji: '🌿', bg: 'linear-gradient(135deg,#1C1C1C,#2A2A2A)',
        name: 'Прогулка в ботаническом саду',
        sub: '28 февраля · 12:00 · с Анастасией',
        preview: 'Вы: Там сейчас выставка орхидей 🌸',
        time: '28 фев', unread: 0,
        comment: 'Там сейчас весенняя выставка орхидей!',
        messages: [
            { mine: true,  text: 'Там сейчас выставка орхидей 🌸', time: '28 фев' },
            { mine: false, text: 'О, очень хочу! Берём кофе с собой?', time: '28 фев' },
            { mine: true,  text: 'Конечно! До встречи в 11:45 🌿', time: '28 фев' },
        ],
    },
];

const DATE_GROUPS = [
    { label: 'Сегодня',  ids: [1, 2] },
    { label: 'Вчера',    ids: [3, 4] },
    { label: 'Ранее',    ids: [5] },
];

export default function ChatsPage() {
    const navigate = useNavigate();
    const [activeChat, setActiveChat] = useState(null);
    const [inputText,  setInputText]  = useState('');
    const [localMsgs,  setLocalMsgs]  = useState({});   // id → extra messages
    const messagesEndRef = useRef(null);

    const openChat = (chat) => {
        setActiveChat(chat);
        setInputText('');
    };

    const closeChat = () => setActiveChat(null);

    const sendMsg = () => {
        const text = inputText.trim();
        if (!text || !activeChat) return;
        const newMsg = { mine: true, text, time: 'только что' };
        setLocalMsgs(prev => ({
            ...prev,
            [activeChat.id]: [...(prev[activeChat.id] || []), newMsg],
        }));
        setInputText('');
    };

    // Scroll to bottom when chat opens or message added
    useEffect(() => {
        if (activeChat) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView(), 80);
        }
    }, [activeChat, localMsgs]);

    const allMessages = (chat) => [
        ...chat.messages,
        ...(localMsgs[chat.id] || []),
    ];

    return (
        <div className="chats-page">
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

            {/* TOP BAR */}
            <div className="ch-top-bar">
                <button className="ch-btn-back" onClick={() => navigate(-1)}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="ch-top-title">Чаты <span>свиданий</span></div>
                <div style={{ width: 34 }} />
            </div>

            {/* CHAT LIST */}
            <div className="ch-scroll">
                {DATE_GROUPS.map(group => {
                    const chats = group.ids.map(id => STUB_CHATS.find(c => c.id === id)).filter(Boolean);
                    return (
                        <div key={group.label}>
                            <div className="ch-date-label">{group.label}</div>
                            {chats.map(chat => (
                                <div key={chat.id} className="ch-row" onClick={() => openChat(chat)}>
                                    <div className="ch-ava" style={{ background: chat.bg }}>{chat.emoji}</div>
                                    <div className="ch-info">
                                        <div className="ch-name">{chat.name}</div>
                                        <div className={`ch-preview ${chat.unread > 0 ? 'unread' : ''}`}>
                                            {chat.preview}
                                        </div>
                                    </div>
                                    <div className="ch-right">
                                        <div className="ch-time">{chat.time}</div>
                                        {chat.unread > 0 && (
                                            <div className="ch-badge">{chat.unread}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* ── CHAT SCREEN (slide in) ─────────────────────────────────────────── */}
            <div className={`ch-screen ${activeChat ? 'open' : ''}`}>
                {/* Status bar */}
                <div className="ch-screen-status">
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

                {/* Topbar */}
                <div className="ch-topbar">
                    <button className="ch-btn-back" onClick={closeChat}>
                        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    {activeChat && (
                        <>
                            <div className="ch-topbar-ava" style={{ background: activeChat.bg }}>
                                {activeChat.emoji}
                            </div>
                            <div className="ch-topbar-info">
                                <div className="ch-topbar-title">{activeChat.name}</div>
                                <div className="ch-topbar-sub">{activeChat.sub}</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Messages */}
                <div className="ch-messages">
                    {activeChat && (
                        <>
                            {/* System comment */}
                            <div className="ch-sys-msg">
                                <div className="ch-sys-label">💝 Комментарий при добавлении</div>
                                <div className="ch-sys-text">{activeChat.comment}</div>
                            </div>

                            {/* Bubbles */}
                            {allMessages(activeChat).map((msg, i) => (
                                <div key={i} className={`ch-bubble-row ${msg.mine ? 'mine' : ''}`}>
                                    <div className={`ch-b-ava ${msg.mine ? 'me' : 'her'}`}>
                                        {msg.mine ? '🐻' : '🌸'}
                                    </div>
                                    <div>
                                        <div className={`ch-bubble ${msg.mine ? 'mine' : 'theirs'}`}>
                                            {msg.text}
                                        </div>
                                        <div className="ch-b-time">{msg.time}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="ch-input-row">
                    <input
                        className="ch-input"
                        placeholder="Сообщение..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMsg()}
                    />
                    <button className="ch-send" onClick={sendMsg}>
                        <svg viewBox="0 0 24 24">
                            <path d="M22 2L11 13"/>
                            <path d="M22 2L15 22l-4-9-9-4 20-7z" fill="white" stroke="none"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}