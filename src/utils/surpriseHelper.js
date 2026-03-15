/**
 * Фиксированное изображение для свиданий-сюрпризов.
 * Романтично-загадочная картинка — одна для всех сюрпризов.
 */
export const SURPRISE_IMAGE = 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800&h=600&fit=crop&q=80';

/** Заголовок для сюрприза — скрывает реальное название */
export const SURPRISE_TITLE = 'Сюрприз ❤️';

/**
 * Возвращает отображаемый заголовок события.
 * Если isSurprise=true и ты получатель (не inviter) — показываем заглушку.
 */
export function getEventTitle(event, userId) {
    if (event?.isSurprise && event?.receiverId === userId) {
        return SURPRISE_TITLE;
    }
    return event?.ideaTitle || '';
}

/**
 * Возвращает URL обложки для события.
 * Для сюрприза (получатель) — романтичная картинка.
 */
export function getEventCoverUrl(event, userId) {
    if (event?.isSurprise && event?.receiverId === userId) {
        return SURPRISE_IMAGE;
    }
    return null;
}