import React, { useState } from 'react';
import './StarRatingModal.css';

/**
 * Модальное окно для выставления оценки (1–5 бургунди-звёзд) и комментария.
 * Props:
 *   idea      - { id, title }
 *   onSubmit  - async (rating, comment) => void
 *   onClose   - () => void
 */
export default function StarRatingModal({ idea, onSubmit, onClose }) {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (rating === 0) { setError('Выберите оценку'); return; }
        setLoading(true);
        try {
            await onSubmit(rating, comment.trim() || null);
            onClose();
        } catch (e) {
            setError('Не удалось отправить отзыв');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="srm-overlay" onClick={onClose}>
            <div className="srm-sheet" onClick={e => e.stopPropagation()}>
                <div className="srm-handle" />

                <div className="srm-title">Оцените свидание</div>
                <div className="srm-idea-name">{idea?.title}</div>

                {/* Звёзды */}
                <div className="srm-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            className={`srm-star ${star <= (hovered || rating) ? 'active' : ''}`}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => { setRating(star); setError(''); }}
                            aria-label={`${star} звезда`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                {rating > 0 && (
                    <div className="srm-rating-label">
                        {['', 'Ужасно 😞', 'Плохо 😕', 'Нормально 😐', 'Хорошо 😊', 'Отлично! 🥰'][rating]}
                    </div>
                )}

                {/* Комментарий */}
                <textarea
                    className="srm-textarea"
                    placeholder="Оставьте комментарий (необязательно)…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    maxLength={500}
                    rows={3}
                />

                {error && <div className="srm-error">{error}</div>}

                <button
                    className="srm-submit"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Отправляем…' : 'Отправить отзыв'}
                </button>

                <button className="srm-cancel" onClick={onClose}>Отмена</button>
            </div>
        </div>
    );
}