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

/** Получить текущего партнёра. Возвращает PartnerResponse или null (204) */
export async function getPartner() {
    try {
        const { data } = await api.get('/api/partner');
        return data;
    } catch (e) {
        if (e.response?.status === 204) return null;
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

/** Разорвать связь с партнёром */
export async function removePartner() {
    await api.delete('/api/partner');
}