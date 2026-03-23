import api from './authApi';

/** Статистика пары */
export async function getPairStats() {
    const { data } = await api.get('/api/stats/pair');
    return data;
}

/** Статистика конкретной идеи */
export async function getIdeaStat(ideaId) {
    const { data } = await api.get(`/api/stats/ideas/${ideaId}`);
    return data;
}
