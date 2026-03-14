import api from './authApi';

// ── DTO builders ──────────────────────────────────────────────────────────

/**
 * Собирает CreateIdeaRequest из данных формы.
 * Пустые строки → null, числа → Number или null.
 */
export function buildCreateIdeaRequest(form) {
    return {
        title:       form.title.trim(),
        description: form.description?.trim() || null,
        category:    form.category,
        priceFrom:   form.priceFrom !== '' && form.priceFrom != null
            ? Number(form.priceFrom) : null,
        durationMin: form.durationMin !== '' && form.durationMin != null
            ? Number(form.durationMin) : null,
        location:    form.location?.trim() || null,
        address:     form.address?.trim()  || null,
        tags:        form.tags?.length > 0 ? form.tags : null,
    };
}

// ── API calls ─────────────────────────────────────────────────────────────

/** Создать идею. Возвращает IdeaDto.Detail */
export async function createIdea(formData) {
    const payload = buildCreateIdeaRequest(formData);
    const { data } = await api.post('/api/ideas', payload);
    return data;
}

/** Загрузить фото к идее. Возвращает PhotoUploadResponse */
export async function uploadIdeaPhoto(ideaId, file) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post(`/api/ideas/${ideaId}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

/** Получить список идей с фильтрами */
export async function getIdeas(params = {}) {
    const query = new URLSearchParams();
    if (params.page     != null)  query.set('page',     params.page);
    if (params.size     != null)  query.set('size',     params.size);
    if (params.sortBy)            query.set('sortBy',   params.sortBy);
    if (params.sortDir)           query.set('sortDir',  params.sortDir);
    if (params.search)            query.set('search',   params.search);
    if (params.category)          query.set('category', params.category);
    if (params.priceTo  != null)  query.set('priceTo',  params.priceTo);
    const { data } = await api.get(`/api/ideas?${query}`);
    return data; // PageResponse<IdeaDto.Summary>
}

/** Получить идею по id */
export async function getIdeaById(id) {
    const { data } = await api.get(`/api/ideas/${id}`);
    return data; // IdeaDto.Detail
}

/** Удалить идею */
export async function deleteIdea(id) {
    await api.delete(`/api/ideas/${id}`);
}

// ── Save / Like ───────────────────────────────────────────────────────────

/** Лайкнуть идею. Возвращает { saved: true, savesCount: N } */
export async function saveIdea(ideaId) {
    const { data } = await api.post(`/api/ideas/${ideaId}/save`);
    return data;
}

/** Убрать лайк. Возвращает { saved: false, savesCount: N } */
export async function unsaveIdea(ideaId) {
    const { data } = await api.delete(`/api/ideas/${ideaId}/save`);
    return data;
}

/** Статус лайка. Возвращает { saved: boolean, savesCount: N } */
export async function getSaveStatus(ideaId) {
    const { data } = await api.get(`/api/ideas/${ideaId}/save`);
    return data;
}

/** Список всех лайкнутых идей пользователя */
export async function getSavedIdeas() {
    const { data } = await api.get('/api/ideas/saved');
    return data; // IdeaDto.Summary[]
}

/** Свои идеи (созданные текущим пользователем) */
export async function getMyIdeas(params = {}) {
    const query = new URLSearchParams();
    if (params.page != null) query.set('page', params.page);
    if (params.size != null) query.set('size', params.size);
    const { data } = await api.get(`/api/ideas/mine?${query}`);
    return data; // PageResponse<IdeaDto.Summary>
}