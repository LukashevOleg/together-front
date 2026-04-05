import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDateHistory, categoryEmoji, categoryGradient } from '../../api/datingApi';
import { submitReview, getMyReview } from '../../api/allstatApi';
import BottomNav from '../../components/layout/BottomNav';
import './HistoryPage.css';

// ── Модал оценки ────────────────────────────────────────────────────────────
function StarModal({ event, existingRating, onSubmit, onClose }) {
    const [rating,  setRating]  = useState(existingRating || 0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [busy,    setBusy]    = useState(false);
    const [err,     setErr]     = useState('');
    const LABELS = ['','Ужасно 😞','Плохо 😕','Нормально 😐','Хорошо 😊','Отлично! 🥰'];

    const send = async () => {
        if (!rating) { setErr('Выберите оценку'); return; }
        setBusy(true);
        try { await onSubmit(rating, comment.trim() || null); onClose(); }
        catch { setErr('Не удалось отправить'); }
        finally { setBusy(false); }
    };

    return (
        <div className="sm-overlay" onClick={onClose}>
            <div className="sm-sheet" onClick={e => e.stopPropagation()}>
                <div className="sm-handle" />
                <div className="sm-title">Оцените свидание</div>
                <div className="sm-idea">{event.ideaTitle}</div>

                <div className="sm-stars">
                    {[1,2,3,4,5].map(s => (
                        <button
                            key={s}
                            className={`sm-star ${s <= (hovered || rating) ? 'active' : ''}`}
                            onClick={() => { setRating(s); setErr(''); }}
                            onMouseEnter={() => setHovered(s)}
                            onMouseLeave={() => setHovered(0)}
                        >★</button>
                    ))}
                </div>

                <div className="sm-label">{LABELS[hovered || rating]}</div>

                <textarea
                    className="sm-textarea"
                    placeholder="Комментарий (необязательно)…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    maxLength={500}
                    rows={3}
                />

                {err && <div className="sm-error">{err}</div>}

                <button className="sm-submit" onClick={send} disabled={busy}>
                    {busy ? 'Отправляем…' : 'Отправить отзыв'}
                </button>
                <button className="sm-cancel" onClick={onClose}>Отмена</button>
            </div>
        </div>
    );
}

const CATEGORY_LABEL = {
    ROMANTIC:      'Романтика',
    FOOD:          'Гастро',
    OUTDOOR:       'Природа',
    CULTURE:       'Культура',
    RELAX:         'Релакс',
    ACTIVE:        'Активное',
    ENTERTAINMENT: 'Развлечение',
    INDOOR:        'Дома',
    WELLNESS:      'Велнес',
    OTHER:         'Другое',
};

const MONTHS_RU = [
    'Январь','Февраль','Март','Апрель','Май','Июнь',
    'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];

function formatCardDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
}

function monthKey(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
    if (!key) return '';
    const [year, month] = key.split('-');
    return `${MONTHS_RU[parseInt(month) - 1]} ${year}`;
}

// Группируем события по месяцам
function groupByMonth(events) {
    const groups = {};
    events.forEach(e => {
        const key = monthKey(e.scheduledDate);
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
    });
    // Сортируем месяцы от новых к старым
    return Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a));
}

export default function HistoryPage() {
    const navigate = useNavigate();
    const [events,      setEvents]      = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [modalEvent,  setModalEvent]  = useState(null);   // event для модала
    const [myReviews,   setMyReviews]   = useState({});     // ideaId → { rating, comment }
    const [editingId,   setEditingId]   = useState(null);   // ideaId с раскрытым комментарием
    const [editText,    setEditText]    = useState('');
    const [toast,       setToast]       = useState('');

    useEffect(() => {
        getDateHistory()
            .then(async data => {
                const list = data || [];
                setEvents(list);
                setLoading(false);
                // Подгружаем мои отзывы для завершённых свиданий
                const ideaIds = [...new Set(
                    list.filter(e => e.ideaId).map(e => e.ideaId)
                )];
                const map = {};
                await Promise.all(ideaIds.map(async id => {
                    try {
                        const r = await getMyReview(id);
                        if (r) map[id] = { rating: r.rating, comment: r.comment || '' };
                    } catch {}
                }));
                setMyReviews(map);
            })
            .catch(() => setLoading(false));
    }, []);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

    const handleReviewSubmit = async (rating, comment) => {
        await submitReview({
            ideaId:    modalEvent.ideaId,
            ideaTitle: modalEvent.ideaTitle,
            rating,
            comment,
        });
        setMyReviews(prev => ({ ...prev, [modalEvent.ideaId]: { rating, comment: comment || '' } }));
        showToast('Отзыв сохранён ⭐');
    };

    const handleCommentEdit = async (ideaId) => {
        const cur = myReviews[ideaId];
        if (!cur) return;
        try {
            await submitReview({
                ideaId,
                ideaTitle: events.find(e => e.ideaId === ideaId)?.ideaTitle || '',
                rating: cur.rating,
                comment: editText.trim() || null,
            });
            setMyReviews(prev => ({ ...prev, [ideaId]: { ...prev[ideaId], comment: editText.trim() } }));
            setEditingId(null);
            showToast('Комментарий сохранён');
        } catch { showToast('Ошибка сохранения'); }
    };

    const totalDates = events.length;
    const ratingValues = Object.values(myReviews).map(r => r.rating);
    const avgRating = ratingValues.length > 0
        ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
        : 0;

    const groups = groupByMonth(events);

    return (
        <div className="history-page">

            {/* HEADER */}
            <div className="history-header">
                <button className="history-btn-back" onClick={() => navigate('/lubimka')}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="history-title">История свиданий</div>
            </div>

            <div className="history-scroll">
                {loading ? (
                    <div className="history-loading">
                        <div className="history-skeleton summary" />
                        <div className="history-skeleton card" />
                        <div className="history-skeleton card" />
                        <div className="history-skeleton card" />
                    </div>
                ) : (
                    <>
                        {/* SUMMARY */}
                        <div className="history-summary">
                            <div className="sum-tile">
                                <div className="sum-num">{totalDates}</div>
                                <div className="sum-lbl">всего</div>
                            </div>
                            <div className="sum-tile">
                                <div className="sum-num burgundy">
                                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                                </div>
                                <div className="sum-lbl">ваша средняя оценка</div>
                            </div>
                        </div>

                        {/* GROUPED BY MONTH */}
                        {groups.length === 0 ? (
                            <div className="history-empty">
                                <div style={{ fontSize: 44 }}>🗓</div>
                                <div className="history-empty-title">Пока нет свиданий</div>
                                <div className="history-empty-sub">
                                    Принимайте приглашения — история появится здесь
                                </div>
                            </div>
                        ) : (
                            groups.map(([key, monthEvents]) => (
                                <div key={key}>
                                    <div className="history-month-lbl">
                                        {monthLabel(key)}
                                    </div>
                                    {monthEvents.map(event => {
                                        const bg      = categoryGradient(event.ideaCategory);
                                        const emoji   = categoryEmoji(event.ideaCategory);
                                        const review  = myReviews[event.ideaId];
                                        const isEditing = editingId === event.ideaId;
                                        return (
                                            <div key={event.id} className="hc-wrap">
                                                <div
                                                    className="history-card"
                                                    onClick={() => navigate('/chats', { state: { eventId: event.id } })}
                                                >
                                                    <div className="hc-img" style={{ background: bg }}>{emoji}</div>
                                                    <div className="hc-body">
                                                        <div className="hc-title">{event.ideaTitle}</div>
                                                        <div className="hc-meta">
                                                            <span>{formatCardDate(event.scheduledDate)}</span>
                                                            {event.scheduledTime && <span>{event.scheduledTime.slice(0, 5)}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Нижняя строка */}
                                                <div className="hc-bottom-row" onClick={e => e.stopPropagation()}>
                                                    {review ? (
                                                        isEditing ? (
                                                            <div className="hc-edit-block">
                                                                {/* Кликабельные звёзды в режиме редактирования */}
                                                                <div className="hc-stars-picker">
                                                                    {[1,2,3,4,5].map(s => (
                                                                        <button
                                                                            key={s}
                                                                            className="hc-star-btn"
                                                                            onClick={async () => {
                                                                                const updated = { ...myReviews[event.ideaId], rating: s };
                                                                                setMyReviews(prev => ({ ...prev, [event.ideaId]: updated }));
                                                                                try {
                                                                                    await submitReview({ ideaId: event.ideaId, ideaTitle: event.ideaTitle, rating: s, comment: updated.comment || null });
                                                                                    showToast('Оценка изменена');
                                                                                } catch {}
                                                                            }}
                                                                        >
                                                                            {s <= review.rating ? '★' : '☆'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <textarea
                                                                    className="hc-edit-textarea"
                                                                    value={editText}
                                                                    onChange={e => setEditText(e.target.value)}
                                                                    rows={2}
                                                                    maxLength={500}
                                                                    autoFocus
                                                                    placeholder="Комментарий…"
                                                                    onClick={e => e.stopPropagation()}
                                                                />
                                                                <div className="hc-edit-actions">
                                                                    <button className="hc-edit-cancel" onClick={() => setEditingId(null)}>Отмена</button>
                                                                    <button className="hc-edit-save" onClick={() => handleCommentEdit(event.ideaId)}>Сохранить</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="hc-reviewed-row">
                                                                {/* Кликабельные звёзды */}
                                                                <div className="hc-stars-picker">
                                                                    {[1,2,3,4,5].map(s => (
                                                                        <button
                                                                            key={s}
                                                                            className="hc-star-btn"
                                                                            onClick={async () => {
                                                                                const updated = { ...myReviews[event.ideaId], rating: s };
                                                                                setMyReviews(prev => ({ ...prev, [event.ideaId]: updated }));
                                                                                try {
                                                                                    await submitReview({ ideaId: event.ideaId, ideaTitle: event.ideaTitle, rating: s, comment: updated.comment || null });
                                                                                    showToast('Оценка изменена');
                                                                                } catch {}
                                                                            }}
                                                                        >
                                                                            {s <= review.rating ? '★' : '☆'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <span
                                                                    className="hc-comment-text"
                                                                    onClick={() => { setEditingId(event.ideaId); setEditText(review.comment || ''); }}
                                                                >
                                                                    {review.comment || 'Оставьте комментарий'}
                                                                </span>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <>
                                                            <span className="hc-bottom-label">Как прошло свидание?</span>
                                                            <button className="hc-rate-link" onClick={() => setModalEvent(event)}>
                                                                Оценить →
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>

            <BottomNav />

            {/* Toast */}
            {toast && <div className="hc-toast">{toast}</div>}

            {/* Модал оценки */}
            {modalEvent && (
                <StarModal
                    event={modalEvent}
                    existingRating={myReviews[modalEvent.ideaId] || 0}
                    onSubmit={handleReviewSubmit}
                    onClose={() => setModalEvent(null)}
                />
            )}
        </div>
    );
}