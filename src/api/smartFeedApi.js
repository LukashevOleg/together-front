import api from './authApi';

/**
 * Идеи на сегодня — спонтанный режим.
 * Бэк учитывает погоду, время суток, исключает идеи с бронью.
 */
export async function fetchTodayIdeas({ city, maxPrice, page = 0, size = 20 } = {}) {
    const params = new URLSearchParams({ page, size });
    if (city)     params.set('city', city);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const { data } = await api.get(`/api/ideas/today?${params}`);
    return data; // Page<Idea>: { content, totalElements, last, ... }
}

/**
 * Умная лента — плановый режим.
 * Персональный подбор по предпочтениям без жёстких погодных фильтров.
 */
export async function fetchSmartFeed({ city, maxPrice, maxDurationMin, page = 0, size = 20 } = {}) {
    const params = new URLSearchParams({ page, size });
    if (city)          params.set('city', city);
    if (maxPrice)      params.set('maxPrice', maxPrice);
    if (maxDurationMin) params.set('maxDurationMin', maxDurationMin);

    const { data } = await api.get(`/api/ideas/smart?${params}`);
    return data;
}

/**
 * Пул идей для свайпов в матчах.
 */
export async function fetchSwipePool({ city, limit = 50 } = {}) {
    const params = new URLSearchParams({ limit });
    if (city) params.set('city', city);

    const { data } = await api.get(`/api/ideas/swipe-pool?${params}`);
    return data; // Idea[]
}

/**
 * Запись взаимодействия пользователя с идеей.
 *
 * @param {number} ideaId
 * @param {'LIKE'|'SKIP'|'VIEWED'|'COMPLETED_DATE'|'RATED'} type
 * @param {object} extra — { viewDurationSeconds?, rating? }
 */
export async function recordInteraction(ideaId, type, extra = {}) {
    await api.post(`/api/ideas/${ideaId}/interact`, {
        type,
        viewDurationSeconds: extra.viewDurationSeconds ?? null,
        rating:              extra.rating ?? null,
    });
}

/**
 * Текущая погода напрямую из Open-Meteo — только для отображения в UI.
 * Бэк использует свой экземпляр для scoring, этот вызов только для hero-карточки.
 *
 * @param {string} city
 * @returns {{ temp: number, condition: string, emoji: string }}
 */
export async function fetchWeatherDisplay(city) {
    try {
        // Шаг 1: геокодирование
        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`
        );
        const geoData = await geoRes.json();
        const loc = geoData.results?.[0];
        if (!loc) return null;

        // Шаг 2: погода
        const wRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&wind_speed_unit=ms&timezone=auto`
        );
        const wData = await wRes.json();
        const cur = wData.current;

        const code = cur.weather_code;
        const temp = Math.round(cur.temperature_2m);

        // WMO code → emoji + label
        let emoji = '☀️', condition = 'Ясно';
        if (code >= 95)                      { emoji = '⛈️';  condition = 'Гроза'; }
        else if (code >= 80)                 { emoji = '🌧️';  condition = 'Ливень'; }
        else if (code >= 71 && code <= 77)   { emoji = '❄️';  condition = 'Снег'; }
        else if (code >= 51 && code <= 67)   { emoji = '🌧️';  condition = 'Дождь'; }
        else if (code === 45 || code === 48) { emoji = '🌫️';  condition = 'Туман'; }
        else if (code >= 1  && code <= 3)    { emoji = '⛅';  condition = 'Облачно'; }

        return { temp, condition, emoji };
    } catch {
        return null;
    }
}