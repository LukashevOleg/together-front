import { useCallback, useRef } from 'react';
import { recordInteraction } from '../api/smartFeedApi';

/**
 * Хук для записи взаимодействий с идеями.
 *
 * Использование:
 *   const { onLike, onSkip, onView, onRate } = useIdeaInteraction();
 *
 *   onLike(ideaId)          — пользователь лайкнул идею
 *   onSkip(ideaId)          — пользователь скипнул
 *   onView(ideaId)          — вызвать при открытии карточки, таймер запустится сам
 *   stopView(ideaId)        — вызвать при закрытии (запишет время просмотра)
 *   onRate(ideaId, 1-5)     — оценка после свидания
 */
export function useIdeaInteraction() {
    // Трекаем время открытия карточки: ideaId → timestamp
    const viewStartRef = useRef({});

    const onLike = useCallback(async (ideaId) => {
        try {
            await recordInteraction(ideaId, 'LIKE');
        } catch (e) {
            console.warn('Failed to record LIKE for idea', ideaId, e);
        }
    }, []);

    const onSkip = useCallback(async (ideaId) => {
        try {
            await recordInteraction(ideaId, 'SKIP');
        } catch (e) {
            console.warn('Failed to record SKIP for idea', ideaId, e);
        }
    }, []);

    /**
     * Начинаем отсчёт времени просмотра.
     * Вызывать когда карточка появляется на экране.
     */
    const onView = useCallback((ideaId) => {
        viewStartRef.current[ideaId] = Date.now();
    }, []);

    /**
     * Останавливаем таймер и записываем VIEWED.
     * Вызывать при уходе с карточки / свайпе.
     * Записывает только если пользователь смотрел > 3 секунды.
     */
    const stopView = useCallback(async (ideaId) => {
        const startedAt = viewStartRef.current[ideaId];
        if (!startedAt) return;

        const seconds = Math.round((Date.now() - startedAt) / 1000);
        delete viewStartRef.current[ideaId];

        if (seconds < 3) return; // слишком быстро — не пишем

        try {
            await recordInteraction(ideaId, 'VIEWED', { viewDurationSeconds: seconds });
        } catch (e) {
            console.warn('Failed to record VIEWED for idea', ideaId, e);
        }
    }, []);

    const onRate = useCallback(async (ideaId, rating) => {
        try {
            await recordInteraction(ideaId, 'RATED', { rating });
        } catch (e) {
            console.warn('Failed to record RATED for idea', ideaId, e);
        }
    }, []);

    const onCompleted = useCallback(async (ideaId) => {
        try {
            await recordInteraction(ideaId, 'COMPLETED_DATE');
        } catch (e) {
            console.warn('Failed to record COMPLETED_DATE for idea', ideaId, e);
        }
    }, []);

    return { onLike, onSkip, onView, stopView, onRate, onCompleted };
}