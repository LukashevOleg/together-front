import api from './authApi';

/**
 * Получить пачку идей для свайпа в конкретном городе.
 * Курсор вычисляется на сервере автоматически.
 * @returns FeedResponse { items: FeedItem[], cursor: number, restarted: boolean }
 */
export async function getSwipeFeed(city) {
    const { data } = await api.get('/api/swipes/feed', { params: { city } });
    return data;
}

/**
 * Записать свайп.
 * @param {object} p
 * @param {number}  p.ideaId
 * @param {string}  p.ideaTitle
 * @param {string}  p.ideaCategory
 * @param {string}  p.city
 * @param {'LIKE'|'DISLIKE'|'SKIP'} p.action
 * @returns SwipeResponse — если match != null, это новый матч
 */
export async function recordSwipe(params) {
    const { data } = await api.post('/api/swipes', params);
    return data;
}

/** История всех свайпов пользователя */
export async function getSwipeHistory() {
    const { data } = await api.get('/api/swipes/history');
    return data;
}

/** Матчи текущей пары */
export async function getMatches() {
    const { data } = await api.get('/api/swipes/matches');
    return data; // MatchResponse[]
}