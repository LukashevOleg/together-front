import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { getSwipeFeed, recordSwipe } from '../../api/swipesApi';
import { getMyProfile, getPartner } from '../../api/profilerApi';
import { categoryGradient } from '../../api/datingApi';
import BottomNav from '../../components/layout/BottomNav';
import './SwipePage.css';

// ── Helpers ────────────────────────────────────────────────────────────────
function formatPrice(p) {
    if (!p) return 'Бесплатно';
    return `от ${Number(p).toLocaleString('ru-RU')} ₽`;
}
function formatDuration(min) {
    if (!min) return null;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
}
function catLabel(cat) {
    const MAP = {
        ROMANTIC: 'Романтика', FOOD: 'Гастро', NATURE: 'Природа',
        CULTURE: 'Культура', EXTREME: 'Экстрим', RELAX: 'Релакс',
        ACTIVE: 'Активное', NIGHTLIFE: 'Ночные',
    };
    return MAP[cat] || cat;
}
function catEmoji(cat) {
    const MAP = {
        ROMANTIC:'🌹', FOOD:'🍷', NATURE:'🌿', CULTURE:'🎨',
        EXTREME:'⚡', RELAX:'🧖', ACTIVE:'🏃', NIGHTLIFE:'🌙',
    };
    return MAP[cat] || '💡';
}
function pluralReviews(n) {
    if (n % 100 >= 11 && n % 100 <= 14) return 'отзывов';
    switch (n % 10) {
        case 1: return 'отзыв';
        case 2: case 3: case 4: return 'отзыва';
        default: return 'отзывов';
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function StarsSvg({ rating }) {
    return (
        <div className="sw-stars-wrap">
            {[1,2,3,4,5].map(i => {
                const full = i <= Math.floor(rating);
                const half = !full && i === Math.floor(rating) + 1 && (rating % 1) >= 0.5;
                const id = `sh${i}${Math.random().toString(36).slice(2,6)}`;
                return (
                    <svg key={i} className="sw-star-svg" viewBox="0 0 24 24">
                        {half && (
                            <defs>
                                <linearGradient id={id}>
                                    <stop offset="50%" stopColor="#7B1E2E"/>
                                    <stop offset="50%" stopColor="#E5E3E0"/>
                                </linearGradient>
                            </defs>
                        )}
                        <polygon
                            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                            fill={full ? '#7B1E2E' : half ? `url(#${id})` : '#E5E3E0'}
                            stroke={full || half ? '#7B1E2E' : '#E5E3E0'}
                            strokeWidth="1.5"
                        />
                    </svg>
                );
            })}
        </div>
    );
}

// ── SwipeCard ──────────────────────────────────────────────────────────────
const SwipeCard = ({ item, posClass, onSwipe, onLocationClick, cardRef, navigate }) => {
    const [expanded, setExpanded] = useState(false);
    const bg = item.coverPhotoUrl ? null : categoryGradient(item.ideaCategory);

    const dragState = useRef({ active: false, startX: 0, startY: 0, curX: 0 });

    const onPointerDown = useCallback((e) => {
        if (e.target.closest('.sw-no-drag')) return;
        if (posClass !== 'pos-front') return;
        dragState.current = { active: true, startX: e.clientX, startY: e.clientY, curX: 0 };
        cardRef.current.style.transition = 'none';
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [posClass, cardRef]);

    const onPointerMove = useCallback((e) => {
        const d = dragState.current;
        if (!d.active) return;
        const x = e.clientX - d.startX;
        const y = e.clientY - d.startY;
        d.curX = x;
        const card = cardRef.current;
        card.style.transform = `translate(${x}px, calc(-50% + ${y * 0.25}px)) rotate(${x * 0.07}deg)`;
        card.querySelector('.sw-stamp.like').style.opacity = Math.min(1, Math.max(0, x / 70));
        card.querySelector('.sw-stamp.nope').style.opacity = Math.min(1, Math.max(0, -x / 70));
    }, [cardRef]);

    const onPointerUp = useCallback(() => {
        const d = dragState.current;
        if (!d.active) return;
        d.active = false;
        const card = cardRef.current;
        if (Math.abs(d.curX) > 80) {
            onSwipe(d.curX > 0 ? 'LIKE' : 'DISLIKE');
        } else {
            card.style.transition = 'transform 0.3s ease';
            card.style.transform = '';
            card.querySelector('.sw-stamp.like').style.opacity = 0;
            card.querySelector('.sw-stamp.nope').style.opacity = 0;
        }
    }, [cardRef, onSwipe]);

    return (
        <div
            className={`sw-card ${posClass}`}
            ref={cardRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
        >
            <div className="sw-stamp like">ХОЧУ ♥</div>
            <div className="sw-stamp nope">НЕТ ✕</div>

            {/* Hero */}
            <div className="sw-card-hero" style={bg ? { background: bg } : {}}>
                {item.coverPhotoUrl
                    ? <img className="sw-card-hero-img" src={item.coverPhotoUrl} alt={item.ideaTitle} />
                    : <span className="sw-card-hero-emoji">{catEmoji(item.ideaCategory)}</span>
                }
            </div>

            {/* Content — структура точно как в HTML макете */}
            <div className="sw-card-body">
                <div className="sw-card-title">{item.ideaTitle}</div>

                <div className="sw-card-tags">
                    {item.ideaCategory && <span className="sw-ctag cat">{catLabel(item.ideaCategory)}</span>}
                    {item.durationMin   && <span className="sw-ctag info">{formatDuration(item.durationMin)}</span>}
                    <span className="sw-ctag info">{formatPrice(item.priceFrom)}</span>
                </div>

                <div className="sw-rating-row">
                    {item.rating > 0
                        ? <>
                            <StarsSvg rating={Number(item.rating)} />
                            <span className="sw-rating-num">{Number(item.rating).toFixed(1)}</span>
                            <span className="sw-rating-count">
                                ({item.reviewsCount} {pluralReviews(item.reviewsCount)})
                            </span>
                        </>
                        : <>
                            <StarsSvg rating={0} />
                            <span className="sw-rating-count" style={{ marginLeft: 4 }}>Нет оценок</span>
                        </>
                    }
                </div>

                {!!(item.description || item.shortDescription) && (
                    <div className="sw-desc-wrap sw-no-drag">
                        <div className={`sw-desc-text${expanded ? ' expanded' : ''}`}>
                            {item.description || item.shortDescription}
                        </div>
                        <span
                            className="sw-desc-toggle"
                            onPointerDown={e => e.stopPropagation()}
                            onClick={() => setExpanded(v => !v)}
                        >
                            {expanded ? 'Свернуть' : 'Читать далее'}
                        </span>
                    </div>
                )}

                <button
                    className="sw-btn-more sw-no-drag"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => navigate && navigate(`/ideas/${item.ideaId}`)}
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 8 16 12 12 16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    Узнать больше
                </button>
            </div>
        </div>
    );
};


// ── MatchOverlay ───────────────────────────────────────────────────────────
const MatchOverlay = ({ match, myProfile, partnerProfile, onInvite, onSkip }) => {
    if (!match) return null;
    const bg     = categoryGradient(match.ideaCategory);
    const emoji  = catEmoji(match.ideaCategory);

    return (
        <div className="sw-match-overlay show">
            <div className="sw-match-box">
                <div className="sw-match-hero" style={{ background: bg }}>
                    <span className="sw-spark">✨</span>
                    <span className="sw-spark">✨</span>
                    <span className="sw-spark">✨</span>
                    <span className="sw-spark">✨</span>
                    <div className="sw-match-emoji">{emoji}</div>
                    <div className="sw-match-hero-grad" />
                </div>
                <div className="sw-match-content">
                    <div className="sw-match-eyebrow">Совпадение</div>
                    <div className="sw-match-title">
                        Ваши мысли<br/><em>совпали!</em>
                    </div>
                    <div className="sw-match-avatars">
                        <div className="sw-match-ava me">
                            {myProfile?.avatarUrl
                                ? <img src={myProfile.avatarUrl} alt="me" />
                                : '🐻'}
                        </div>
                        <div className="sw-match-heart">💝</div>
                        <div className="sw-match-ava her">
                            {partnerProfile?.avatarUrl
                                ? <img src={partnerProfile.avatarUrl} alt="partner" />
                                : '🌸'}
                        </div>
                    </div>
                    <div className="sw-match-sub">
                        Вы оба хотите пойти на<br/>
                        <span className="sw-match-idea-name">{match.ideaTitle}</span>
                    </div>

                    <button className="sw-match-btn-invite" onClick={onInvite}>
                        <svg viewBox="0 0 24 24">
                            <path d="M22 2L11 13"/>
                            <path d="M22 2L15 22l-4-9-9-4 20-7z" fill="white" stroke="none"/>
                        </svg>
                        Пригласить на свидание
                    </button>
                    <button className="sw-match-btn-skip" onClick={onSkip}>
                        Пропустить
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── LocationSheet ──────────────────────────────────────────────────────────
const LocationSheet = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="sw-loc-overlay show" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="sw-loc-sheet">
                <div className="sw-loc-header">
                    <div className="sw-loc-title">{item.location}</div>
                    <button className="sw-loc-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div className="sw-loc-map">
                    <div className="sw-loc-map-grid" />
                    <div className="sw-loc-pin">📍</div>
                </div>
                <div className="sw-loc-info">
                    <div className="sw-loc-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                    </div>
                    <div>
                        <div className="sw-loc-name">{item.location}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── SwipePage ──────────────────────────────────────────────────────────────
export default function SwipePage() {
    const navigate        = useNavigate();
    const { userId }      = useAuthContext();

    const [cards,          setCards]          = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [myProfile,      setMyProfile]      = useState(null);
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [city,           setCity]           = useState(null); // null пока не загрузили профиль

    // Матч — показываем оверлей
    const [activeMatch,    setActiveMatch]    = useState(null);
    // Локация — показываем шторку
    const [locItem,        setLocItem]        = useState(null);

    // Refs для текущих трёх карточек
    const frontRef = useRef(null);
    const back1Ref = useRef(null);
    const back2Ref = useRef(null);

    // Актуальный город в ref
    const cityRef    = useRef('Москва');
    // Полный сет ВСЕХ ideaId которые уже были показаны в этой сессии.
    // Фильтруем локально — надёжнее чем полагаться на курсор при дырявых id.
    const seenIdsRef = useRef(new Set());

    // Один эффект инициализации: профиль → город → лента
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        Promise.all([
            getMyProfile().catch(() => null),
            getPartner().catch(() => null),
        ]).then(async ([me, partner]) => {
            if (cancelled) return;
            setMyProfile(me);
            setPartnerProfile(partner);

            const resolvedCity = me?.city || 'Москва';
            setCity(resolvedCity);
            cityRef.current = resolvedCity;

            try {
                const feed = await getSwipeFeed(resolvedCity);
                if (!cancelled) {
                    const items = (feed.items || []).filter(c => !seenIdsRef.current.has(c.ideaId));
                    items.forEach(c => seenIdsRef.current.add(c.ideaId));
                    setCards(items);
                }
            } catch (e) {
                console.error('Feed load failed', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, []);

    // Дозагрузка — фильтруем всё что уже видели локально
    const loadFeed = useCallback(async () => {
        const currentCity = cityRef.current;
        // Передаём максимальный из seen как afterId — подсказка бэку откуда читать
        const maxSeen = seenIdsRef.current.size > 0
            ? Math.max(...seenIdsRef.current)
            : null;
        try {
            const feed = await getSwipeFeed(currentCity, maxSeen);
            const fresh = (feed.items || []).filter(c => !seenIdsRef.current.has(c.ideaId));
            if (fresh.length > 0) {
                fresh.forEach(c => seenIdsRef.current.add(c.ideaId));
                setCards(prev => [...prev, ...fresh]);
            }
        } catch (e) {
            console.error('Feed load failed', e);
        }
    }, []);

    // ── Обработка свайпа ──────────────────────────────────────────────────
    const handleSwipe = useCallback(async (action) => {
        if (cards.length === 0) return;
        const item = cards[0];

        // Анимация вылета
        const card = frontRef.current;
        if (card) {
            card.style.transition = 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.35s ease';
            card.style.transform  = action === 'LIKE'
                ? 'translate(460px, calc(-50% - 28px)) rotate(22deg)'
                : 'translate(-460px, calc(-50% - 28px)) rotate(-22deg)';
            card.style.opacity = '0';
        }

        // Убираем карточку из стека через 320мс
        setTimeout(async () => {
            setCards(prev => {
                const next = prev.slice(1);
                // Если осталось мало — подгружаем следующую пачку
                if (next.length <= 2) loadFeed();
                return next;
            });

            // Записываем на бэк
            try {
                const result = await recordSwipe({
                    ideaId:       item.ideaId,
                    ideaTitle:    item.ideaTitle,
                    ideaCategory: item.ideaCategory,
                    city:         cityRef.current,
                    action,
                });

                // Матч!
                if (result.match) {
                    setTimeout(() => setActiveMatch(result.match), 200);
                }
            } catch (e) {
                if (e.response?.status !== 409) {
                    console.error('Swipe record failed', e);
                }
            }
        }, 320);
    }, [cards, loadFeed]); // city убран — читаем cityRef.current напрямую

    const handleInviteFromMatch = () => {
        setActiveMatch(null);
        if (activeMatch) {
            navigate(`/ideas/${activeMatch.ideaId}`, {
                state: { source: 'planned', date: null },
            });
        }
    };

    // ── Рендер трёх верхних карточек стека ──────────────────────────────
    const visible = cards.slice(0, 3);

    return (
        <div className="swipe-page">

            {/* TOP BAR */}
            <div className="sw-top-bar">
                <button className="sw-btn-back" onClick={() => navigate(-1)}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="sw-top-title">Сов<span>падения</span></div>
                <div style={{ width: 34 }} />
            </div>

            {/* CARD STACK */}
            {!loading && cards.length === 0 ? (
                <div className="sw-empty">
                    <div className="sw-empty-emoji">🎉</div>
                    <div className="sw-empty-title">Все идеи просмотрены!</div>
                    <div className="sw-empty-sub">
                        Скоро появятся новые — или загрузим уже просмотренные заново
                    </div>
                    <button className="sw-empty-btn" onClick={loadFeed}>
                        Обновить
                    </button>
                </div>
            ) : (
                <div className="sw-card-stack">
                    {visible.map((item, i) => {
                        const posClass = ['pos-front', 'pos-back1', 'pos-back2'][i];
                        const ref      = [frontRef, back1Ref, back2Ref][i];
                        return (
                            <SwipeCard
                                key={item.ideaId}
                                item={item}
                                posClass={posClass}
                                cardRef={ref}
                                onSwipe={i === 0 ? handleSwipe : () => {}}
                                onLocationClick={setLocItem}
                                navigate={navigate}
                            />
                        );
                    })}
                </div>
            )}

            <BottomNav />

            {/* LOCATION SHEET */}
            {locItem && <LocationSheet item={locItem} onClose={() => setLocItem(null)} />}

            {/* MATCH OVERLAY */}
            <MatchOverlay
                match={activeMatch}
                myProfile={myProfile}
                partnerProfile={partnerProfile}
                onInvite={handleInviteFromMatch}
                onSkip={() => setActiveMatch(null)}
            />
        </div>
    );
}