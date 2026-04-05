import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDateHistory, categoryEmoji, categoryGradient } from '../../api/datingApi';
import { submitReview, getMyReview } from '../../api/allstatApi';
import { useAuthContext } from '../../context/AuthContext';
import BottomNav from '../../components/layout/BottomNav';
import './HistoryPage.css';

// ── Inline StarRatingModal ────────────────────────────────────────────────
function StarRatingModal({ idea, existingRating, onSubmit, onClose }) {
    const [rating,  setRating]  = useState(existingRating || 0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const labels = ['', 'Ужасно 😞', 'Плохо 😕', 'Нормально 😐', 'Хорошо 😊', 'Отлично! 🥰'];

    const handleSubmit = async () => {
        if (rating === 0) { setError('Выберите оценку'); return; }
        setLoading(true);
        try {
            await onSubmit(rating, comment.trim() || null);
            onClose();
        } catch {
            setError('Не удалось отправить отзыв');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:500,
                display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={onClose}
        >
            <div
                style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'12px 24px 40px',
                    width:'100%', maxWidth:480, display:'flex', flexDirection:'column', alignItems:'center' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ width:40, height:4, borderRadius:2, background:'#e0e0e0', marginBottom:20 }} />
                <div style={{ fontSize:18, fontWeight:700, color:'#1a1a1a', marginBottom:4 }}>Оцените свидание</div>
                <div style={{ fontSize:13, color:'#888', marginBottom:20, textAlign:'center' }}>{idea?.title}</div>

                {/* Звёзды бургунди */}
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    {[1,2,3,4,5].map(star => (
                        <button
                            key={star}
                            style={{ fontSize:44, background:'none', border:'none', cursor:'pointer', padding:0, lineHeight:1,
                                color: star <= (hovered || rating) ? '#6D1A36' : '#ddd',
                                transition:'color .15s, transform .12s',
                                transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)' }}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => { setRating(star); setError(''); }}
                        >★</button>
                    ))}
                </div>

                {rating > 0 && (
                    <div style={{ fontSize:14, color:'#6D1A36', fontWeight:600, marginBottom:16, minHeight:20 }}>
                        {labels[rating]}
                    </div>
                )}

                <textarea
                    style={{ width:'100%', border:'1.5px solid #e8e8e8', borderRadius:12, padding:12,
                        fontSize:14, color:'#333', resize:'none', outline:'none', fontFamily:'inherit',
                        boxSizing:'border-box', marginBottom:8 }}
                    placeholder="Оставьте комментарий (необязательно)…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    maxLength={500}
                    rows={3}
                />

                {error && <div style={{ color:'#e53935', fontSize:13, marginBottom:8 }}>{error}</div>}

                <button
                    style={{ width:'100%', padding:14, background:'#6D1A36', color:'#fff', border:'none',
                        borderRadius:14, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:8,
                        opacity: loading ? 0.6 : 1 }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Отправляем…' : 'Отправить отзыв'}
                </button>
                <button
                    style={{ background:'none', border:'none', color:'#999', fontSize:14, cursor:'pointer', marginTop:12 }}
                    onClick={onClose}
                >Отмена</button>
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
    const { userId } = useAuthContext();
    const [events,       setEvents]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [reviewModal,  setReviewModal]  = useState(null);  // { event } | null
    const [myReviews,    setMyReviews]    = useState({});    // ideaId → rating
    const [toast,        setToast]        = useState('');

    useEffect(() => {
        getDateHistory()
            .then(async data => {
                const list = data || [];
                setEvents(list);
                setLoading(false);
                // Загружаем мои отзывы на каждую идею из истории
                const completed = list.filter(e => e.status === 'COMPLETED' && e.ideaId);
                const uniqueIdeaIds = [...new Set(completed.map(e => e.ideaId))];
                const reviewMap = {};
                await Promise.all(uniqueIdeaIds.map(async ideaId => {
                    try {
                        const r = await getMyReview(ideaId);
                        if (r) reviewMap[ideaId] = r.rating;
                    } catch {}
                }));
                setMyReviews(reviewMap);
            })
            .catch(() => setLoading(false));
    }, []);

    const totalDates = events.length;

    const avgRating = Object.values(myReviews).length > 0
        ? (Object.values(myReviews).reduce((a, b) => a + b, 0) / Object.values(myReviews).length)
        : 0;

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

    const handleReviewSubmit = async (rating, comment) => {
        const event = reviewModal;
        await submitReview({
            ideaId:    event.ideaId,
            ideaTitle: event.ideaTitle,
            rating,
            comment,
        });
        setMyReviews(prev => ({ ...prev, [event.ideaId]: rating }));
        showToast('Отзыв сохранён ⭐');
    };

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
                                <div className="sum-lbl">средний рейтинг</div>
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
                                        const bg    = categoryGradient(event.ideaCategory);
                                        const emoji = categoryEmoji(event.ideaCategory);
                                        const catLabel = CATEGORY_LABEL[event.ideaCategory] || '';
                                        return (
                                            <div
                                                key={event.id}
                                                className="history-card"
                                            >
                                                <div
                                                    style={{ display:'flex', flex:1, cursor:'pointer' }}
                                                    onClick={() => navigate('/chats', { state: { eventId: event.id } })}
                                                >
                                                    <div className="hc-img" style={{ background: bg }}>
                                                        {emoji}
                                                    </div>
                                                    <div className="hc-body">
                                                        <div className="hc-title">{event.ideaTitle}</div>
                                                        <div className="hc-meta">
                                                            {formatCardDate(event.scheduledDate)}
                                                            {event.scheduledTime && ` · ${event.scheduledTime.slice(0, 5)}`}
                                                        </div>
                                                        <div className="hc-footer">
                                                            {catLabel && (
                                                                <span className="hc-tag">{catLabel}</span>
                                                            )}
                                                            {/* Показываем оценку если уже оценено */}
                                                            {myReviews[event.ideaId] && (
                                                                <span style={{ fontSize:12, color:'#6D1A36', fontWeight:600 }}>
                                                                    {'★'.repeat(myReviews[event.ideaId])}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Кнопка Оценить — только для завершённых */}
                                                {event.status === 'COMPLETED' && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setReviewModal(event); }}
                                                        style={{
                                                            flexShrink: 0,
                                                            alignSelf: 'center',
                                                            background: myReviews[event.ideaId] ? '#F5EEF0' : '#6D1A36',
                                                            color: myReviews[event.ideaId] ? '#6D1A36' : '#fff',
                                                            border: myReviews[event.ideaId] ? '1.5px solid #6D1A36' : 'none',
                                                            borderRadius: 12,
                                                            padding: '7px 14px',
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            whiteSpace: 'nowrap',
                                                            marginLeft: 8,
                                                        }}
                                                    >
                                                        {myReviews[event.ideaId] ? '✏️ Изменить' : '⭐ Оценить'}
                                                    </button>
                                                )}
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
            {toast && (
                <div style={{
                    position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
                    background:'#1a1a1a', color:'#fff', borderRadius:20, padding:'10px 20px',
                    fontSize:14, fontWeight:500, zIndex:600, whiteSpace:'nowrap',
                }}>
                    {toast}
                </div>
            )}

            {/* Модал оценки */}
            {reviewModal && (
                <StarRatingModal
                    idea={{ id: reviewModal.ideaId, title: reviewModal.ideaTitle }}
                    existingRating={myReviews[reviewModal.ideaId] || 0}
                    onSubmit={handleReviewSubmit}
                    onClose={() => setReviewModal(null)}
                />
            )}
        </div>
    );
}