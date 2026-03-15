import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getIdeaById, saveIdea, unsaveIdea, getSaveStatus } from '../../api/ideaApi';
import { createDateEvent, acceptDateEvent, declineDateEvent, cancelDateEvent } from '../../api/datingApi';
import { getPartner } from '../../api/profilerApi';
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
function formatSaves(n) { if (!n) return '—'; return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n); }
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

// ── Invite Modal ────────────────────────────────────────────────────────────
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

                {/* DATE BUTTONS */}
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

                {/* TIME SLOTS */}
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

                {/* SURPRISE TOGGLE */}
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

// ── Page ────────────────────────────────────────────────────────────────────
export default function IdeaDetailPage() {
    const { id }    = useParams();
    const navigate  = useNavigate();
    const { state } = useLocation();

    // state передаётся из DateModePage: { source: 'spontaneous'|'planned', date: 'YYYY-MM-DD' }
    // или из InvitationsPage: { mode: 'incoming'|'outgoing', eventId, event }
    const source      = state?.source;
    const plannedDate = state?.date;
    const invMode     = state?.mode;     // 'incoming' | 'outgoing' | undefined
    const invEventId  = state?.eventId;

    const [idea,      setIdea]      = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [partnerId, setPartnerId] = useState(null);
    const [saved,     setSaved]     = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [sending,   setSending]   = useState(false);
    const [toast,     setToast]     = useState('');

    // Загружаем идею и партнёра параллельно
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getIdeaById(id),
            getPartner().catch(() => null),
            getSaveStatus(id).catch(() => ({ saved: false })),
        ]).then(([ideaData, partner, savedStatus]) => {
            if (cancelled) return;
            setIdea(ideaData);
            setPartnerId(partner?.id ?? null);
            setSaved(savedStatus.saved);
            setLoading(false);
        }).catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [id]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

    const handleSave = async () => {
        if (!idea) return;
        const newSaved = !saved;
        setSaved(newSaved);
        try {
            if (newSaved) {
                await saveIdea(Number(id), idea.title, idea.category);
                showToast('Сохранено ❤️');
            } else {
                await unsaveIdea(Number(id));
                showToast('Убрано из сохранённых');
            }
        } catch {
            setSaved(!newSaved);
            showToast('Ошибка, попробуйте ещё раз');
        }
    };

    // Обработчики для режима приглашения (incoming/outgoing)
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
            handleSend({
                date:       todayISO(),
                time:       null,
                isSurprise: false,
                hint:       '',
            });
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

    // Сюрприз: получатель видит заглушку вместо настоящей карточки
    const isSurpriseForReceiver = invMode === 'incoming' && state?.event?.isSurprise;
    const displayTitle = isSurpriseForReceiver ? SURPRISE_TITLE : idea.title;
    const cover = isSurpriseForReceiver
        ? SURPRISE_IMAGE
        : (idea.photos?.[0]?.url || idea.coverPhotoUrl || null);

    // Дата для модала: planned → из state, иначе сегодня
    const modalDate  = source === 'planned' ? plannedDate : todayISO();
    const ctaLabel   = source === 'spontaneous' ? 'Пригласить сейчас 💌' : 'Пригласить партнёра';

    return (
        <div className="idea-detail-page">
            <div className="status-bar">
                <span>9:41</span>
                <div className="status-icons">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="1" y="6" width="3" height="12" rx="1"/>
                        <rect x="6" y="9" width="3" height="9" rx="1"/>
                        <rect x="11" y="5" width="3" height="13" rx="1"/>
                        <rect x="16" y="2" width="3" height="16" rx="1"/>
                    </svg>
                </div>
            </div>

            <div className="id-scroll">
                <div className="id-hero" style={!cover ? { background: bgGrad } : {}}>
                    {cover
                        ? <img className="id-hero-img" src={cover} alt={idea.title} />
                        : <div className="id-hero-emoji">{cat.emoji || '💡'}</div>}
                    <div className="id-hero-gradient" />
                    <div className="id-hero-title">{displayTitle}</div>
                    <button className="id-btn-back" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button className={`id-btn-save ${saved ? 'saved' : ''}`} onClick={handleSave}>
                        <svg viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>

                <div className="id-content">
                    <div className="id-drag-handle" />

                    <div className="id-tags">
                        {cat.label && <span className="id-tag cat">{cat.emoji} {cat.label}</span>}
                        {idea.durationMin && <span className="id-tag time">⏱ {formatDuration(idea.durationMin)}</span>}
                        {idea.priceFrom   && <span className="id-tag cost">💰 {formatPrice(idea.priceFrom)}</span>}
                        {idea.location    && <span className="id-tag place">📍 {idea.location}</span>}
                        {idea.tags?.map(t => <span key={t} className="id-tag">{t}</span>)}
                    </div>

                    {idea.description && <div className="id-description">{idea.description}</div>}
                    <div className="id-divider" />

                    <div className="id-stats">
                        <div className="id-stat-card">
                            <div className="id-stat-val rating">{idea.rating ? Number(idea.rating).toFixed(1) : '—'}</div>
                            <div className="id-stat-lbl">Рейтинг</div>
                            <div className="id-stat-sub">{idea.reviewsCount ? `${idea.reviewsCount} отзывов` : 'нет отзывов'}</div>
                        </div>
                        <div className="id-stat-card">
                            <div className="id-stat-val saves">{formatSaves(idea.savesCount)}</div>
                            <div className="id-stat-lbl">Сохранили</div>
                            <div className="id-stat-sub">пар</div>
                        </div>
                        <div className="id-stat-card">
                            <div className="id-stat-val match">92%</div>
                            <div className="id-stat-lbl">Подошло</div>
                            <div className="id-stat-sub">паре</div>
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

                    {/* CTA — зависит от режима */}
                    {invMode === 'incoming' ? (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="id-cta" style={{ flex: 1 }} onClick={handleAcceptInvite} disabled={sending}>
                                ✅ Принять
                            </button>
                            <button
                                className="id-cta"
                                style={{ flex: 1, background: '#EBEBEB', color: '#888' }}
                                onClick={handleDeclineInvite}
                                disabled={sending}
                            >
                                Отклонить
                            </button>
                            <button
                                style={{
                                    background: '#EBEBEB', border: '1.5px solid #E5E3E0',
                                    borderRadius: 18, padding: '0 16px',
                                    display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0,
                                }}
                                onClick={() => navigate('/chats', { state: { eventId: invEventId } })}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#7B1E2E" strokeWidth="2" strokeLinecap="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                            </button>
                        </div>
                    ) : invMode === 'outgoing' ? (
                        <>
                            {/* Пометка для сюрприза — отправитель видит нормальную карточку */}
                            {state?.event?.isSurprise && (
                                <div style={{
                                    background: '#F5F1E8',
                                    borderRadius: 14,
                                    padding: '10px 14px',
                                    fontSize: 12,
                                    color: '#7A5A1A',
                                    marginBottom: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                    🎁 <span>
                    <strong>{state?.event?.receiverName || 'Партнёр'}</strong> не видит название — для них это сюрприз
                  </span>
                                </div>
                            )}
                            <button
                                className="id-cta"
                                style={{ background: '#EBEBEB', color: '#C0392B', border: '1.5px solid #E5E3E0' }}
                                onClick={handleCancelInvite}
                                disabled={sending}
                            >
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
            </div>

            <div className={`id-toast ${toast ? 'show' : ''}`}>{toast}</div>
            <BottomNav />

            <InviteModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSend={handleSend}
                initialDate={modalDate}
            />
        </div>
    );
}