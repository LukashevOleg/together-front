import api from './authApi';

// ── DateEvent ──────────────────────────────────────────────────────────────

/**
 * Создать приглашение на свидание.
 *
 * @param {object} p
 * @param {number}  p.ideaId
 * @param {string}  p.ideaTitle
 * @param {string}  p.ideaCategory
 * @param {string}  p.scheduledDate   — 'YYYY-MM-DD'
 * @param {string}  p.scheduledTime   — 'HH:mm' | null (спонтанное)
 * @param {boolean} p.isSurprise
 * @param {string}  p.hint            — подсказка для сюрприза
 * @param {'SPONTANEOUS'|'PLANNED'} p.source
 * @param {number}  partnerId         — ID партнёра
 */
export async function createDateEvent(params, partnerId) {
    const { data } = await api.post('/api/dates/invitations', params, {
        headers: { 'X-Partner-Id': partnerId },
    });
    return data; // DateEventDto.Response
}

/** Принять приглашение */
export async function acceptDateEvent(eventId) {
    const { data } = await api.post(`/api/dates/invitations/${eventId}/accept`);
    return data;
}

/** Отклонить приглашение */
export async function declineDateEvent(eventId) {
    const { data } = await api.post(`/api/dates/invitations/${eventId}/decline`);
    return data;
}

/** Обновить приглашение (дата, время, подсказка) */
export async function updateDateEvent(eventId, updates) {
    const { data } = await api.put(`/api/dates/invitations/${eventId}`, updates);
    return data;
}

/** Отменить приглашение */
export async function cancelDateEvent(eventId) {
    const { data } = await api.delete(`/api/dates/invitations/${eventId}`);
    return data;
}

/** Одно свидание */
export async function getDateEvent(eventId) {
    const { data } = await api.get(`/api/dates/invitations/${eventId}`);
    return data;
}

/** Входящие ожидающие */
export async function getPendingInvitations() {
    const { data } = await api.get('/api/dates/invitations/pending');
    return data; // DateEventDto.Response[]
}

/** Исходящие ожидающие */
export async function getSentInvitations() {
    const { data } = await api.get('/api/dates/invitations/sent');
    return data;
}

/** Будущие свидания (ACCEPTED, дата >= сегодня) */
export async function getUpcomingDates() {
    const { data } = await api.get('/api/dates/upcoming');
    return data; // DateEventDto.Response[]
}

/**
 * Все активные события для чат-листа: PENDING (обсуждение) + ACCEPTED (принятые).
 * Главный источник данных для ChatsPage.
 */
export async function getActiveChats() {
    const { data } = await api.get('/api/dates/chats');
    return data; // DateEventDto.Response[]
}

/** История прошедших свиданий */
export async function getDateHistory() {
    const { data } = await api.get('/api/dates/history');
    return data;
}

// ── Chat REST ──────────────────────────────────────────────────────────────

/** Полная история сообщений чата */
export async function getChatHistory(eventId) {
    const { data } = await api.get(`/api/dates/${eventId}/chat/messages`);
    return data; // ChatMessageDto.Response[]
}

/** Постраничная история (infinite scroll вверх) */
export async function getChatHistoryPaged(eventId, page = 0, size = 30) {
    const { data } = await api.get(
        `/api/dates/${eventId}/chat/messages/paged?page=${page}&size=${size}`
    );
    return data;
}

/** Пометить чат прочитанным */
export async function markChatRead(eventId) {
    await api.post(`/api/dates/${eventId}/chat/read`);
}

/** Кол-во непрочитанных */
export async function getUnreadCount(eventId) {
    const { data } = await api.get(`/api/dates/${eventId}/chat/unread`);
    return data.count; // number
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Форматирует LocalDate + LocalTime в читаемую строку */
export function formatEventDate(event) {
    if (!event?.scheduledDate) return '';
    const d = new Date(event.scheduledDate);
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    let str = `${d.getDate()} ${months[d.getMonth()]}`;
    if (event.scheduledTime) str += ` · ${event.scheduledTime.slice(0, 5)}`;
    return str;
}

/** Категория → эмодзи */
const CATEGORY_EMOJI = {
    ROMANTIC: '🌹', FOOD: '🍷', NATURE: '🌿',
    CULTURE: '🎨', EXTREME: '⚡', RELAX: '🧖',
    ACTIVE: '🏃', NIGHTLIFE: '🌙',
};
export function categoryEmoji(cat) {
    return CATEGORY_EMOJI[cat] || '💡';
}

/** Категория → градиент фона */
const CATEGORY_GRADIENT = {
    ROMANTIC:  'linear-gradient(135deg,#3D0A14,#7B1E2E)',
    FOOD:      'linear-gradient(135deg,#1C0A00,#7A3A0A)',
    NATURE:    'linear-gradient(135deg,#0A1C0A,#2E6B2E)',
    CULTURE:   'linear-gradient(135deg,#0A0A1C,#2A2A7B)',
    EXTREME:   'linear-gradient(135deg,#1C1400,#7B6000)',
    RELAX:     'linear-gradient(135deg,#0A1218,#1A4A5A)',
    ACTIVE:    'linear-gradient(135deg,#101018,#303060)',
    NIGHTLIFE: 'linear-gradient(135deg,#0A0A14,#1A1A40)',
};
export function categoryGradient(cat) {
    return CATEGORY_GRADIENT[cat] || CATEGORY_GRADIENT.ROMANTIC;
}