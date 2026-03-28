import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReviews } from '../../api/allstatApi';
import './ReviewsPage.css';

function StarDisplay({ rating, size = 16 }) {
    return (
        <span className="rv-stars-row" style={{ fontSize: size }}>
            {[1,2,3,4,5].map(s => (
                <span key={s} className={s <= rating ? 'rv-star-on' : 'rv-star-off'}>★</span>
            ))}
        </span>
    );
}

export default function ReviewsPage() {
    const { ideaId } = useParams();
    const navigate   = useNavigate();

    const [data, setData]     = useState(null);
    const [page, setPage]     = useState(0);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async (p) => {
        setLoading(true);
        try {
            const res = await getReviews(ideaId, p, 10);
            setData(prev => {
                if (!prev || p === 0) return res;
                return {
                    ...res,
                    reviews: [...prev.reviews, ...res.reviews],
                };
            });
            setPage(p);
        } finally {
            setLoading(false);
        }
    }, [ideaId]);

    useEffect(() => { load(0); }, [load]);

    const hasMore = data && page + 1 < data.totalPages;

    return (
        <div className="rv-root">
            {/* Шапка */}
            <div className="rv-header">
                <button className="rv-back" onClick={() => navigate(-1)}>
                    <svg viewBox="0 0 24 24" width="20" height="20"><polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.2" fill="none"/></svg>
                </button>
                <div className="rv-header-text">
                    <div className="rv-header-title">Отзывы</div>
                    {data && (
                        <div className="rv-header-sub">
                            {data.reviewCount} {pluralReviews(data.reviewCount)}
                            {data.averageRating && ` · ★ ${data.averageRating.toFixed(1)}`}
                        </div>
                    )}
                </div>
            </div>

            {/* Сводка */}
            {data?.averageRating && (
                <div className="rv-summary-card">
                    <div className="rv-summary-rating">{data.averageRating.toFixed(1)}</div>
                    <div>
                        <StarDisplay rating={Math.round(data.averageRating)} size={22} />
                        <div className="rv-summary-count">{data.reviewCount} {pluralReviews(data.reviewCount)}</div>
                    </div>
                </div>
            )}

            {/* Список */}
            <div className="rv-list">
                {data?.reviews.map(r => (
                    <div key={r.id} className="rv-card">
                        <div className="rv-card-top">
                            <div className="rv-avatar">{(r.authorName || '?')[0]}</div>
                            <div className="rv-card-meta">
                                <div className="rv-author">{r.authorName || 'Пользователь'}</div>
                                <div className="rv-date">{formatDate(r.createdAt)}</div>
                            </div>
                            <StarDisplay rating={r.rating} size={14} />
                        </div>
                        {r.comment && <div className="rv-comment">{r.comment}</div>}
                    </div>
                ))}

                {!loading && data?.reviews.length === 0 && (
                    <div className="rv-empty">Отзывов пока нет</div>
                )}

                {loading && <div className="rv-loader">Загружаем…</div>}

                {hasMore && !loading && (
                    <button className="rv-more" onClick={() => load(page + 1)}>
                        Показать ещё
                    </button>
                )}
            </div>
        </div>
    );
}

function pluralReviews(n) {
    if (n % 100 >= 11 && n % 100 <= 14) return 'отзывов';
    switch (n % 10) {
        case 1: return 'отзыв';
        case 2: case 3: case 4: return 'отзыва';
        default: return 'отзывов';
    }
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}