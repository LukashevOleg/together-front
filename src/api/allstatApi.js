import api from './authApi';

/**
 * Оставить / обновить отзыв на идею.
 * @param {{ ideaId, ideaTitle, rating, comment, authorName }} data
 */
export async function submitReview(data) {
    const res = await api.post('/api/reviews', data);
    return res.data;
}

/**
 * Получить отзывы для идеи (постранично).
 * @param {number} ideaId
 * @param {number} page  - номер страницы (0-based)
 * @param {number} size  - размер страницы
 * @returns PagedResponse { reviews, page, totalPages, averageRating, reviewCount }
 */
export async function getReviews(ideaId, page = 0, size = 5) {
    const res = await api.get(`/api/reviews/idea/${ideaId}`, { params: { page, size } });
    return res.data;
}

/** Статистика пары */
export async function getPairStats() {
    const { data } = await api.get('/api/stats/pair');
    return data;
}
/**
 * Краткая сводка по идее: средний рейтинг + количество отзывов.
 * Используется в ленте идей.
 * @returns Summary { ideaId, averageRating, reviewCount }
 */
export async function getReviewSummary(ideaId) {
    const res = await api.get(`/api/reviews/idea/${ideaId}/summary`);
    return res.data;
}

/**
 * Мой отзыв на эту идею (null если не оставлял).
 */
export async function getMyReview(ideaId) {
    const res = await api.get(`/api/reviews/idea/${ideaId}/mine`);
    return res.data;
}
