import api from './authApi';

// ── Profile ───────────────────────────────────────────────────────────────

/** Получить свой профиль. Возвращает ProfileDto.Response */
export async function getMyProfile() {
    const { data } = await api.get('/api/profile/me');
    return data;
}

/** Обновить профиль (имя, возраст, город, интересы) */
export async function updateProfile(fields) {
    const { data } = await api.put('/api/profile/me', fields);
    return data;
}

/** Загрузить аватар */
export async function uploadAvatar(file) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/api/profile/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

/**
 * Сохранить шаг онбординга.
 * @param {number} step  - номер шага (0–4)
 * @param {object} fields - данные шага: { name?, age?, interests?, city? }
 */
export async function saveOnboardingStep(step, fields) {
    const { data } = await api.post('/api/profile/me/onboarding', {
        step,
        ...fields,
    });
    return data;
}

// ── Partner ───────────────────────────────────────────────────────────────

/** Получить публичный профиль пользователя по его ID (для страницы партнёра) */
export async function getProfileById(userId) {
    const { data } = await api.get(`/api/profile/${userId}`);
    return data; // ProfileDto.Response без phone
}

/**
 * Получить текущего партнёра.
 * Profiler возвращает { partnerUserId, partnerName, partnerAvatarUrl, connectedAt }
 * Нормализуем в { id, name, avatarUrl, connectedAt } для удобства на фронте.
 * Возвращает null если партнёра нет (204).
 */
export async function getPartner() {
    try {
        const { data } = await api.get('/api/partner');
        if (!data) return null;
        // Нормализация: унифицируем имена полей
        return {
            id:          data.partnerUserId,
            name:        data.partnerName        || 'Партнёр',
            avatarUrl:   data.partnerAvatarUrl   || null,
            connectedAt: data.connectedAt,
            // Оригинальные поля тоже оставляем на случай прямого использования
            ...data,
        };
    } catch (e) {
        if (e.response?.status === 204 || e.response?.status === 404) return null;
        throw e;
    }
}

/** Создать инвайт-ссылку. Возвращает InviteResponse */
export async function createInvite() {
    const { data } = await api.post('/api/partner/invite');
    return data;
}

/** Принять инвайт по коду */
export async function acceptInvite(code) {
    const { data } = await api.post(`/api/partner/invite/${code}/accept`);
    return data;
}

// ── Saved ideas ───────────────────────────────────────────────────────────

/** Сохранить идею. Возвращает { saved: true } */
export async function saveIdea(ideaId, ideaTitle, ideaCategory) {
    const { data } = await api.post('/api/saved-ideas', {
        ideaId, ideaTitle, ideaCategory,
    });
    return data; // { saved: boolean }
}

/** Убрать идею из сохранённых. Возвращает { saved: false } */
export async function unsaveIdea(ideaId) {
    const { data } = await api.delete(`/api/saved-ideas/${ideaId}`);
    return data;
}

/** Проверить — сохранена ли идея текущим пользователем */
export async function getIdeaSavedStatus(ideaId) {
    const { data } = await api.get(`/api/saved-ideas/${ideaId}/status`);
    return data.saved; // boolean
}

/** Все сохранённые идеи пользователя */
export async function getSavedIdeas() {
    const { data } = await api.get('/api/saved-ideas');
    return data; // SavedIdeaDto.Response[]
}

/** Разорвать связь с партнёром */
export async function removePartner() {
    await api.delete('/api/partner');
}