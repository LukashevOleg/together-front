import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getIdeaById, saveIdea, unsaveIdea, getSaveStatus } from '../../api/ideaApi';
import { createDateEvent, acceptDateEvent, declineDateEvent, cancelDateEvent } from '../../api/datingApi';
import { getPartner } from '../../api/profilerApi';
import { useIdeaInteraction } from '../../hooks/useIdeaInteraction';
import { getReviews, getIdeaStats } from '../../api/allstatApi';
import { SURPRISE_IMAGE, SURPRISE_TITLE } from '../../utils/surpriseHelper';
import BottomNav from '../../components/layout/BottomNav';
import './IdeaDetailPage.css';

const CATEGORY_LABELS = {
    ROMANTIC:  { label: 'Романтика', emoji: '🌹' },
    FOOD:      { label: 'Гастро',    emoji: '🍷' },
    NATURE:    { label: 'Природа',   emoji: '🌿' },
    CULTURE:   { label: 'Культура',  emoji: '🎨' },
    EXTREME:   { label: 'Экстрим',   emoji: '⚡' },
    RELAX:     { label: 'Релакс',    emoji: '🧖' },
    ACTIVE:    { label: 'Активное',  emoji: '🏃' },
    NIGHTLIFE: { label: 'Ночные',    emoji: '🌙' },
};
const heroGradients = {
    ROMANTIC:  'linear-gradient(135deg,#3D0A14,#7B1E2E)',
    FOOD:      'linear-gradient(135deg,#1C0A00,#7A3A0A)',
    NATURE:    'linear-gradient(135deg,#0A1C0A,#2E6B2E)',
    CULTURE:   'linear-gradient(135deg,#0A0A1C,#2A2A7B)',
    EXTREME:   'linear-gradient(135deg,#1C1400,#7B6000)',
    RELAX:     'linear-gradient(135deg,#0A1218,#1A4A5A)',
    ACTIVE:    'linear-gradient(135deg,#101018,#303060)',
    NIGHTLIFE: 'linear-gradient(135deg,#0A0A14,#1A1A40)',
};
function formatDuration(min) {
    if (!min) return null;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
}
function formatPrice(p) { return p ? `от ${Number(p).toLocaleString('ru-RU')} ₽` : null; }
function formatSaves(n) { if (!n) return '0'; return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n); }
function todayISO() { return new Date().toISOString().split('T')[0]; }
function nextDays(from, count) {
    return Array.from({ length: count }, (_, i) => {
        const d = new Date(from); d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}
function fmtDateShort(iso) {
    const d = new Date(iso);
    const m = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
}
function fmtWeekday(iso) {
    return ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][new Date(iso).getDay()];
}

const TIME_SLOTS = ['17:00', '19:00', '21:00'];

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ photos, startIndex, onClose }) {
    const [index, setIndex] = useState(startIndex);
    const touchStartX = useRef(null);

    // закрыть по Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // блокируем скролл страницы под лайтбоксом
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const prev = () => setIndex(i => (i - 1 + photos.length) % photos.length);
    const next = () => setIndex(i => (i + 1) % photos.length);

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd   = (e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 40) { delta < 0 ? next() : prev(); }
        touchStartX.current = null;
    };

    return (
        <div className="lb-overlay"
             onTouchStart={onTouchStart}
             onTouchEnd={onTouchEnd}>

            {/* Крестик */}
            <button className="lb-close" onClick={onClose} aria-label="Закрыть">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6"  y1="6" x2="18" y2="18"/>
                </svg>
            </button>

            {/* Счётчик */}
            {photos.length > 1 && (
                <div className="lb-counter">{index + 1} / {photos.length}</div>
            )}

            {/* Фото */}
            <div className="lb-img-wrap">
                <img
                    key={index}
                    className="lb-img"
                    src={photos[index].url}
                    alt={`Фото ${index + 1}`}
                    draggable={false}
                />
            </div>

            {/* Стрелки — только если фото > 1 */}
            {photos.length > 1 && (
                <>
                    <button className="lb-arrow lb-arrow-prev" onClick={prev} aria-label="Предыдущее">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <button className="lb-arrow lb-arrow-next" onClick={next} aria-label="Следующее">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                </>
            )}

            {/* Точки */}
            {photos.length > 1 && (
                <div className="lb-dots">
                    {photos.map((_, i) => (
                        <button key={i} className={`lb-dot ${i === index ? 'active' : ''}`}
                                onClick={() => setIndex(i)} aria-label={`Фото ${i + 1}`}/>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Photo Hero Carousel ───────────────────────────────────────────────────────
function PhotoHero({ photos, bgGrad, catEmoji, title, onBack, onSave, saved, onPhotoClick }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const stripRef   = useRef(null);
    const touchStart = useRef(null);

    const scrollToIndex = useCallback((i) => {
        const strip = stripRef.current;
        if (!strip) return;
        const w = strip.clientWidth;
        strip.scrollTo({ left: i * w, behavior: 'smooth' });
    }, []);

    // Синхронизируем точки при ручном скролле (snap)
    const onScroll = () => {
        const strip = stripRef.current;
        if (!strip) return;
        const i = Math.round(strip.scrollLeft / strip.clientWidth);
        setActiveIdx(i);
    };

    const hasSingle = !photos || photos.length === 0;
    const list      = hasSingle ? [] : [...photos].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="id-hero-wrap">
            {hasSingle ? (
                /* Нет фото → градиент + эмодзи */
                <div className="id-hero" style={{ background: bgGrad }}>
                    <div className="id-hero-emoji">{catEmoji || '💡'}</div>
                    <div className="id-hero-gradient"/>
                    <div className="id-hero-title">{title}</div>
                </div>
            ) : (
                /* Карусель */
                <div className="id-hero id-hero--carousel">
                    <div className="id-carousel-strip"
                         ref={stripRef}
                         onScroll={onScroll}>
                        {list.map((p, i) => (
                            <div key={p.id} className="id-carousel-slide"
                                 onClick={() => onPhotoClick(i)}>
                                <img src={p.url} alt={`Фото ${i + 1}`} className="id-carousel-img"/>
                            </div>
                        ))}
                    </div>

                    {/* Dot-индикаторы — вверху */}
                    {list.length > 1 && (
                        <div className="id-carousel-dots">
                            {list.map((_, i) => (
                                <button key={i}
                                        className={`id-carousel-dot ${i === activeIdx ? 'active' : ''}`}
                                        onClick={() => { setActiveIdx(i); scrollToIndex(i); }}
                                        aria-label={`Фото ${i + 1}`}/>
                            ))}
                        </div>
                    )}

                    <div className="id-hero-gradient"/>
                    <div className="id-hero-title">{title}</div>
                </div>
            )}

            {/* Общие оверлей-кнопки */}
            <button className="id-btn-back" onClick={onBack}>
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className={`id-btn-save ${saved ? 'saved' : ''}`} onClick={onSave}>
                <svg viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
        </div>
    );
}

// ── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({ open, onClose, onSend, initialDate }) {
    const base = initialDate || todayISO();
    const days = nextDays(base, 3);

    const [selDate,    setSelDate]    = useState(days[0]);
    const [selTime,    setSelTime]    = useState('19:00');
    const [customTime, setCustomTime] = useState('');
    const [isSurprise, setIsSurprise] = useState(false);
    const [hint,       setHint]       = useState('');

    useEffect(() => {
        if (!open) return;
        const newDays = nextDays(initialDate || todayISO(), 3);
        setSelDate(newDays[0]);
        setSelTime('19:00');
        setCustomTime('');
        setIsSurprise(false);
        setHint('');
    }, [open, initialDate]);

    const selectSlot   = (t) => { setSelTime(t); setCustomTime(''); };
    const selectCustom = (v) => { setCustomTime(v); setSelTime(v ? '__custom__' : '19:00'); };

    const handleSend = () => {
        const time = selTime === '__custom__' ? customTime : selTime;
        onSend({ date: selDate, time, isSurprise, hint });
    };

    return (
        <div className={`id-modal-overlay ${open ? 'open' : ''}`}
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="id-modal-sheet">
                <div className="id-modal-handle" />
                <div className="id-modal-title">Пригласить на свидание</div>
                <div className="id-modal-sub">
                    Партнёр получит уведомление и сможет принять или предложить другое время
                </div>

                <div className="id-date-row">
                    {nextDays(base, 3).map(d => (
                        <button key={d} className={`id-date-btn ${selDate === d ? 'active' : ''}`}
                                onClick={() => setSelDate(d)}>
                            <div className="id-date-btn-label">Дата</div>
                            <div className="id-date-btn-value">{fmtDateShort(d)}</div>
                            <div className="id-date-btn-sub">{fmtWeekday(d)}</div>
                        </button>
                    ))}
                </div>

                <div className="id-time-label">Время</div>
                <div className="id-time-slots">
                    {TIME_SLOTS.map(t => (
                        <div key={t} className={`id-time-slot ${selTime === t ? 'selected' : ''}`}
                             onClick={() => selectSlot(t)}>{t}</div>
                    ))}
                    <div className={`id-time-custom ${selTime === '__custom__' ? 'selected' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <input className="id-time-input" type="time" value={customTime}
                               onChange={e => selectCustom(e.target.value)} />
                    </div>
                </div>

                <div className="id-modal-divider" />

                <div className="id-toggle-row">
                    <div>
                        <div className="id-toggle-label">🎁 Свидание-сюрприз</div>
                        <div className="id-toggle-desc">Партнёр не узнает место до встречи</div>
                    </div>
                    <label className="id-switch">
                        <input type="checkbox" checked={isSurprise}
                               onChange={e => { setIsSurprise(e.target.checked); if (!e.target.checked) setHint(''); }} />
                        <span className="id-switch-track" />
                    </label>
                </div>

                <div className={`id-hint-wrap ${isSurprise ? 'visible' : ''}`}>
                    <textarea className="id-hint-field" value={hint} onChange={e => setHint(e.target.value)}
                              placeholder="Подскажите что взять с собой или как одеться" />
                </div>

                <button className="id-modal-send" onClick={handleSend}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                        <path d="M22 2L11 13"/>
                        <path d="M22 2L15 22l-4-9-9-4 20-7z" fill="white" stroke="none"/>
                    </svg>
                    Отправить приглашение
                </button>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function IdeaDetailPage() {
    const { id }    = useParams();
    const navigate  = useNavigate();
    const { state } = useLocation();
    const { onView, stopView, onLike, onSkip  } = useIdeaInteraction();

    const source      = state?.source;
    const plannedDate = state?.date;
    const invMode     = state?.mode;
    const invEventId  = state?.eventId;

    const [idea,        setIdea]        = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [partnerId,   setPartnerId]   = useState(null);
    const [saved,       setSaved]       = useState(false);
    const [totalDates,  setTotalDates]  = useState(0);
    const [modalOpen,   setModalOpen]   = useState(false);
    const [sending,     setSending]     = useState(false);
    const [toast,       setToast]       = useState('');
    const [reviews,     setReviews]     = useState(null);
    const [ideaStats,   setIdeaStats]   = useState(null);
    const [lbIndex,     setLbIndex]     = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getIdeaById(id),
            getPartner().catch(() => null),
            getSaveStatus(id).catch(() => ({ saved: false, totalDates: 0 })),
            getReviews(id, 0, 5).catch(() => null),
            getIdeaStats(id).catch(() => null),
        ]).then(([ideaData, partner, savedStatus, reviewData, statsData]) => {
            if (cancelled) return;
            setIdea(ideaData);
            setPartnerId(partner?.id ?? null);
            setSaved(savedStatus.saved);
            setReviews(reviewData);
            setIdeaStats(statsData);
            setLoading(false);
            // savesCount берём из getSaveStatus (самый свежий), с фолбэком на allstat и idea
            setTotalDates(statsData?.totalDates ?? 0)
        }).catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [id]);

    useEffect(() => {
        onView(id);
        return () => stopView(id); // запишет сколько секунд смотрел при уходе
    }, [id]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

    const handleSave = async () => {
        if (!idea) return;
        const newSaved = !saved;
        setSaved(newSaved);

        if (newSaved) onLike(Number(id));
        else          onSkip(Number(id));

        try {
            newSaved
                ? await saveIdea(Number(id), idea.title, idea.category)
                : await unsaveIdea(Number(id));
            showToast(newSaved ? 'Сохранено ❤️' : 'Убрано из сохранённых');
        } catch {
            setSaved(!newSaved);
            showToast('Ошибка, попробуйте ещё раз');
        }
    };

    const handleAcceptInvite = async () => {
        setSending(true);
        try {
            await acceptDateEvent(invEventId);
            showToast('Приглашение принято ✅');
            setTimeout(() => navigate('/chats', { state: { eventId: invEventId } }), 800);
        } catch { showToast('Ошибка'); }
        finally { setSending(false); }
    };
    const handleDeclineInvite = async () => {
        setSending(true);
        try {
            await declineDateEvent(invEventId);
            showToast('Приглашение отклонено');
            setTimeout(() => navigate('/invitations'), 800);
        } catch { showToast('Ошибка'); }
        finally { setSending(false); }
    };
    const handleCancelInvite = async () => {
        setSending(true);
        try {
            await cancelDateEvent(invEventId);
            showToast('Приглашение отменено');
            setTimeout(() => navigate('/invitations'), 800);
        } catch { showToast('Ошибка'); }
        finally { setSending(false); }
    };

    const handleInviteClick = () => {
        if (source === 'spontaneous') {
            handleSend({ date: todayISO(), time: null, isSurprise: false, hint: '' });
        } else {
            setModalOpen(true);
        }
    };

    const handleSend = async ({ date, time, isSurprise, hint }) => {
        setSending(true);
        try {
            await createDateEvent({
                ideaId:        Number(id),
                ideaTitle:     idea.title,
                ideaCategory:  idea.category || null,
                scheduledDate: date,
                scheduledTime: time || null,
                isSurprise:    Boolean(isSurprise),
                hint:          hint || null,
                source:        source === 'spontaneous' ? 'SPONTANEOUS' : 'PLANNED',
            }, partnerId);
            setModalOpen(false);
            showToast('Приглашение отправлено 💌');
        } catch (e) {
            const msg = e.response?.status === 400
                ? 'Нет партнёра или неверные данные'
                : 'Ошибка при отправке, попробуйте ещё раз';
            showToast(msg);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="idea-detail-page"><div className="id-loading">Загружаем...</div></div>;

    if (!idea) return (
        <div className="idea-detail-page">
            <div className="id-not-found">
                <div className="id-not-found-emoji">🔍</div>
                <div className="id-not-found-title">Идея не найдена</div>
                <div className="id-not-found-sub">Возможно, она была удалена</div>
                <button className="id-cta" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Назад</button>
            </div>
        </div>
    );

    const cat    = CATEGORY_LABELS[idea.category] || {};
    const bgGrad = heroGradients[idea.category]   || heroGradients.ROMANTIC;

    const isSurpriseForReceiver = invMode === 'incoming' && state?.event?.isSurprise;
    const displayTitle = isSurpriseForReceiver ? SURPRISE_TITLE : idea.title;

    // Фото: для сюрприза — заглушка, иначе массив из photos[], сортируем по sortOrder
    const sortedPhotos = isSurpriseForReceiver
        ? [{ id: 0, url: SURPRISE_IMAGE, sortOrder: 0 }]
        : (idea.photos?.length > 0
            ? [...idea.photos].sort((a, b) => a.sortOrder - b.sortOrder)
            : []);

    const modalDate = source === 'planned' ? plannedDate : todayISO();
    const ctaLabel  = source === 'spontaneous' ? 'Пригласить сейчас 💌' : 'Пригласить партнёра';

    return (
        <div className="idea-detail-page">

            <div className="id-scroll">
                <PhotoHero
                    photos={sortedPhotos}
                    bgGrad={bgGrad}
                    catEmoji={cat.emoji}
                    title={displayTitle}
                    saved={saved}
                    onBack={() => navigate(-1)}
                    onSave={handleSave}
                    onPhotoClick={(i) => setLbIndex(i)}
                />

                <div className="id-content">

                    <div className="id-tags">
                        {cat.label && <span className="id-tag cat">{cat.emoji} {cat.label}</span>}
                        {idea.durationMin && <span className="id-tag time">⏱ {formatDuration(idea.durationMin)}</span>}
                        {idea.priceFrom   && <span className="id-tag cost">💰 {formatPrice(idea.priceFrom)}</span>}
                        {idea.location    && <span className="id-tag place">📍 {idea.location}</span>}
                        {idea.tags?.map(t => <span key={t} className="id-tag">{t}</span>)}
                    </div>

                    <div className="id-section-label">Описание</div>

                    <div className="id-description">{idea.description}</div>
                    <div className="id-divider" />

                    <div className="id-stats">
                        {/* Рейтинг */}
                        <div className="id-stat-card">
                            <div className="id-stat-val rating">
                                {idea.rating ? Number(idea.rating).toFixed(1) : '0'}
                            </div>
                            <div className="id-stat-lbl">рейтинг</div>
                            <div className="id-stat-sub">
                                {idea.reviewsCount ? `${idea.reviewsCount} отзывов` : 'нет отзывов'}
                            </div>
                        </div>

                        {/* Сохранений */}
                        <div className="id-stat-card">
                            <div className="id-stat-val saves">{formatSaves(totalDates)}</div>
                            <div className="id-stat-lbl">запланированных свиданий</div>
                            {/*<div className="id-stat-sub">свиданий</div>*/}
                        </div>

                        {/* Остались довольны */}
                        <div className="id-stat-card">
                            <div className="id-stat-val match">
                                {ideaStats?.percentPositiveReview != null
                                    ? `${ideaStats.percentPositiveReview}%`
                                    : '0%'}
                            </div>
                            <div className="id-stat-lbl">остались довольными</div>
                        </div>
                    </div>

                    {(idea.address || idea.location) && (
                        <>
                            <div className="id-divider" />
                            <div className="id-section-label">Где это</div>
                            <div className="id-location-card">
                                <div className="id-location-dot" />
                                <div>
                                    <div className="id-location-text">{idea.address || idea.location}</div>
                                    {idea.address && idea.location && <div className="id-location-sub">{idea.location}</div>}
                                </div>
                            </div>
                        </>
                    )}

                    {reviews && (
                        <>
                            <div className="id-divider" />
                            <div className="id-reviews-block">
                                <div className="id-reviews-header">
                                    <span className="id-reviews-title">Отзывы</span>
                                    {reviews.averageRating ? (
                                        <div className="id-reviews-avg">
                                            <span className="id-reviews-stars">
                                                {[1,2,3,4,5].map(s => (
                                                    <span key={s} style={{ color: s <= Math.round(reviews.averageRating) ? '#6D1A36' : '#ddd' }}>★</span>
                                                ))}
                                            </span>
                                            <span className="id-reviews-avg-val">{reviews.averageRating.toFixed(1)}</span>
                                            <span className="id-reviews-avg-count">({reviews.reviewCount})</span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize:13, color:'#bbb' }}>Нет оценок</span>
                                    )}
                                </div>

                                {reviews.reviews?.length > 0 ? (
                                    <>
                                        {reviews.reviews.map(r => (
                                            <div key={r.id} className="id-review-item">
                                                <div className="id-review-top">
                                                    <div className="id-review-avatar">{(r.authorName || '?')[0]}</div>
                                                    <div className="id-review-meta">
                                                        <div className="id-review-author">{r.authorName || 'Пользователь'}</div>
                                                        <span style={{ fontSize:12 }}>
                                                            {[1,2,3,4,5].map(s => (
                                                                <span key={s} style={{ color: s <= r.rating ? '#6D1A36' : '#ddd', fontSize:12 }}>★</span>
                                                            ))}
                                                        </span>
                                                    </div>
                                                    <div className="id-review-date">
                                                        {new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'short' })}
                                                    </div>
                                                </div>
                                                {r.comment && <div className="id-review-comment">{r.comment}</div>}
                                            </div>
                                        ))}

                                        {reviews.totalElements > 5 && (
                                            <button
                                                className="id-reviews-see-all"
                                                onClick={() => navigate(`/reviews/${id}`)}
                                            >
                                                Смотреть все {reviews.totalElements} отзывов
                                                <svg viewBox="0 0 24 24" width="14" height="14" style={{ marginLeft:4 }}>
                                                    <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" fill="none"/>
                                                </svg>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ fontSize:13, color:'#bbb', textAlign:'center', padding:'12px 0' }}>
                                        Отзывов пока нет — будьте первым!
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* ── Прижатая кнопка действия ── */}
            <div className="id-cta-footer">
                {invMode === 'incoming' ? (
                    <div className="id-cta-row">
                        <button className="id-cta" style={{ flex: 1 }} onClick={handleAcceptInvite} disabled={sending}>✅ Принять</button>
                        <button className="id-cta" style={{ flex: 1, background: '#EBEBEB', color: '#888' }} onClick={handleDeclineInvite} disabled={sending}>Отклонить</button>
                        <button className="id-cta-chat" onClick={() => navigate('/chats', { state: { eventId: invEventId } })}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#7B1E2E" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </button>
                    </div>
                ) : invMode === 'outgoing' ? (
                    <>
                        {state?.event?.isSurprise && (
                            <div className="id-surprise-banner">
                                🎁 <span><strong>{state?.event?.receiverName || 'Партнёр'}</strong> не видит название — для них это сюрприз</span>
                            </div>
                        )}
                        <button className="id-cta" style={{ background: '#EBEBEB', color: '#C0392B', border: '1.5px solid #E5E3E0' }} onClick={handleCancelInvite} disabled={sending}>
                            {sending ? 'Отменяем…' : '🚫 Отменить приглашение'}
                        </button>
                    </>
                ) : (
                    <button className="id-cta" onClick={handleInviteClick} disabled={sending}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        {sending ? 'Отправляем…' : ctaLabel}
                    </button>
                )}
            </div>

            <div className={`id-toast ${toast ? 'show' : ''}`}>{toast}</div>
            <BottomNav />

            <InviteModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSend={handleSend}
                initialDate={modalDate}
            />

            {/* Лайтбокс */}
            {lbIndex !== null && sortedPhotos.length > 0 && (
                <Lightbox
                    photos={sortedPhotos}
                    startIndex={lbIndex}
                    onClose={() => setLbIndex(null)}
                />
            )}
        </div>
    );
}