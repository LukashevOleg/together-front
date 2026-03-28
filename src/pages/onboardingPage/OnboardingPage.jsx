import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOnboardingStep, createInvite } from '../../api/profilerApi';
import './OnboardingPage.css';

const TOTAL_STEPS = 5;

const INTERESTS = [
    { key: 'ROMANTIC',  emoji: '🌹', label: 'Романтика' },
    { key: 'FOOD',      emoji: '🍷', label: 'Гастро' },
    { key: 'NATURE',    emoji: '🌿', label: 'Природа' },
    { key: 'CULTURE',   emoji: '🎨', label: 'Культура' },
    { key: 'EXTREME',   emoji: '⚡', label: 'Экстрим' },
    { key: 'RELAX',     emoji: '🧖', label: 'Релакс' },
    { key: 'ACTIVE',    emoji: '🏃', label: 'Активное' },
    { key: 'NIGHTLIFE', emoji: '🌙', label: 'Ночные' },
];

const CITIES = [
    'Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург',
    'Новосибирск', 'Сочи', 'Нижний Новгород', 'Краснодар',
];

const QR_PATTERN = [
    1,1,1,1,1,1,1,0,
    1,0,0,0,0,0,1,0,
    1,0,1,1,1,0,1,1,
    1,0,1,0,1,0,1,0,
    1,0,1,1,1,0,1,1,
    1,0,0,0,0,0,1,0,
    1,1,1,1,1,1,1,0,
    0,1,0,1,0,1,0,1,
];

function ageLabel(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'год';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'года';
    return 'лет';
}

export default function OnboardingPage() {
    const navigate = useNavigate();

    const [step,      setStep]      = useState(0);
    const [done,      setDone]      = useState(false);
    const [saving,    setSaving]    = useState(false);

    // Form state per step
    const [name,      setName]      = useState('');
    const [age,       setAge]       = useState(25);
    const [interests, setInterests] = useState(new Set());
    const [city,      setCity]      = useState('');
    const [citySugs,  setCitySugs]  = useState([]);

    // Partner step
    const [partnerOpt, setPartnerOpt] = useState(null); // 'link' | 'qr'
    const [invite,     setInvite]     = useState(null);  // InviteResponse from API
    const [copied,     setCopied]     = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);

    // Load invite when user picks an option on step 4
    useEffect(() => {
        if (step !== 4 || !partnerOpt || invite) return;
        setInviteLoading(true);
        createInvite()
            .then(data => setInvite(data))
            .catch(() => {})
            .finally(() => setInviteLoading(false));
    }, [step, partnerOpt]);

    // ── Navigation ───────────────────────────────────────────────────────────
    const canProceed = () => {
        if (step === 0) return name.trim().length >= 2;
        if (step === 2) return interests.size >= 2;
        if (step === 3) return city.trim().length >= 2;
        return true;
    };

    const saveStep = async (stepNum, fields) => {
        try {
            setSaving(true);
            await saveOnboardingStep(stepNum, fields);
        } catch (e) {
            console.error('Onboarding step save failed', e);
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        if (!canProceed()) return;

        // Save current step data to backend
        if (step === 0) await saveStep(0, { name: name.trim() });
        if (step === 1) await saveStep(1, { age });
        if (step === 2) await saveStep(2, { interests: [...interests] });
        if (step === 3) await saveStep(3, { city: city.trim() });
        if (step === 4) {
            await saveStep(4, {});  // step=4 → onboardingCompleted=true
            setDone(true);
            return;
        }

        setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(s => s - 1);
    };

    const handleSkip = () => {
        setStep(s => s + 1);
    };

    // ── Interests ────────────────────────────────────────────────────────────
    const toggleInterest = (key) => {
        setInterests(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    // ── City suggestions ──────────────────────────────────────────────────────
    const onCityInput = (val) => {
        setCity(val);
        if (val.trim().length < 1) { setCitySugs([]); return; }
        const matches = CITIES.filter(c => c.toLowerCase().startsWith(val.toLowerCase()));
        setCitySugs(matches);
    };

    const selectCity = (c) => {
        setCity(c);
        setCitySugs([]);
    };

    // ── Copy invite link ──────────────────────────────────────────────────────
    const copyLink = () => {
        if (!invite) return;
        navigator.clipboard.writeText(invite.inviteUrl).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Done screen ───────────────────────────────────────────────────────────
    if (done) {
        return (
            <div className="onboarding-page">
                <div className="ob-screens">
                    <div className="ob-screen active">
                        <div className="ob-done-screen">
                            <div className="ob-done-emoji">💝</div>
                            <div className="ob-done-title">Всё <span>готово!</span></div>
                            <div className="ob-done-sub">
                                Добро пожаловать, {name || 'друг'}!<br/>
                                Теперь начните свайпать идеи вместе с половинкой
                            </div>
                            <button className="ob-done-btn" onClick={() => navigate('/', { replace: true })}>
                                Начать
                                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="onboarding-page">

            {/* TOP NAV */}
            <div className="ob-top-nav">
                <button
                    className={`ob-btn-back ${step === 0 ? 'invisible' : ''}`}
                    onClick={handleBack}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <button
                    className={`ob-btn-skip ${step >= TOTAL_STEPS - 1 ? 'invisible' : ''}`}
                    onClick={handleSkip}
                >
                    Пропустить
                </button>
            </div>

            {/* PROGRESS */}
            <div className="ob-progress-wrap">
                <div className="ob-progress-steps">
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <div key={i} className="ob-progress-step">
                            <div className="ob-progress-fill" style={{ width: i <= step ? '100%' : '0%' }} />
                        </div>
                    ))}
                </div>
                <div className="ob-progress-label">
                    Шаг <span>{step + 1} из {TOTAL_STEPS}</span>
                </div>
            </div>

            {/* SCREENS */}
            <div className="ob-screens">

                {/* STEP 0 — NAME */}
                <div className={`ob-screen ${step === 0 ? 'active' : step > 0 ? 'left' : 'right'}`}>
                    <div className="ob-emoji">👋</div>
                    <div className="ob-title">Как вас<br/><span>зовут?</span></div>
                    <div className="ob-sub">Это имя увидит ваша половинка</div>
                    <div className="ob-field-label">Ваше имя</div>
                    <input
                        className="ob-text-input"
                        type="text"
                        placeholder="Например, Алексей"
                        maxLength={30}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && canProceed() && handleNext()}
                        autoFocus
                    />
                    <button
                        className={`ob-btn-next ${canProceed() ? 'ready' : ''}`}
                        disabled={!canProceed() || saving}
                        onClick={handleNext}
                    >
                        Продолжить
                        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>

                {/* STEP 1 — AGE */}
                <div className={`ob-screen ${step === 1 ? 'active' : step > 1 ? 'left' : 'right'}`}>
                    <div className="ob-emoji">🎂</div>
                    <div className="ob-title">Сколько<br/>вам <span>лет?</span></div>
                    <div className="ob-sub">Поможет подобрать идеи, которые вам подойдут</div>
                    <div className="ob-age-picker">
                        <button className="ob-age-btn" onClick={() => setAge(a => Math.max(16, a - 1))}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                        <div className="ob-age-display">
                            <div className="ob-age-num">{age}</div>
                            <div className="ob-age-unit">{ageLabel(age)}</div>
                        </div>
                        <button className="ob-age-btn" onClick={() => setAge(a => Math.min(80, a + 1))}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                    <button className="ob-btn-next ready" disabled={saving} onClick={handleNext}>
                        Продолжить
                        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>

                {/* STEP 2 — INTERESTS */}
                <div className={`ob-screen ${step === 2 ? 'active' : step > 2 ? 'left' : 'right'}`}>
                    <div className="ob-emoji">✨</div>
                    <div className="ob-title">Что вам<br/><span>нравится?</span></div>
                    <div className="ob-sub">Выберите хотя бы 2 — мы подберём подходящие идеи</div>
                    <div className="ob-interests-grid">
                        {INTERESTS.map(item => (
                            <div
                                key={item.key}
                                className={`ob-chip ${interests.has(item.key) ? 'on' : ''}`}
                                onClick={() => toggleInterest(item.key)}
                            >
                                <span className="ob-chip-emoji">{item.emoji}</span>
                                {item.label}
                            </div>
                        ))}
                    </div>
                    <div className="ob-interests-hint">
                        Выбрано: <span>{interests.size}</span> из {INTERESTS.length}
                    </div>
                    <button
                        className={`ob-btn-next ${canProceed() ? 'ready' : ''}`}
                        disabled={!canProceed() || saving}
                        onClick={handleNext}
                        style={{ marginTop: 16 }}
                    >
                        Продолжить
                        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>

                {/* STEP 3 — CITY */}
                <div className={`ob-screen ${step === 3 ? 'active' : step > 3 ? 'left' : 'right'}`}>
                    <div className="ob-emoji">🏙</div>
                    <div className="ob-title">Ваш<br/><span>город?</span></div>
                    <div className="ob-sub">Покажем идеи и места рядом с вами</div>
                    <div className="ob-city-wrap">
                        <div className="ob-city-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                        </div>
                        <input
                            className="ob-city-input"
                            type="text"
                            placeholder="Начните вводить город..."
                            value={city}
                            onChange={e => onCityInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && canProceed() && handleNext()}
                        />
                    </div>
                    {citySugs.length > 0 && (
                        <div className="ob-city-suggestions">
                            {citySugs.map(c => (
                                <div key={c} className="ob-city-sug-item" onClick={() => selectCity(c)}>
                                    <svg viewBox="0 0 24 24">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    {c}
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        className={`ob-btn-next ${canProceed() ? 'ready' : ''}`}
                        disabled={!canProceed() || saving}
                        onClick={handleNext}
                    >
                        Продолжить
                        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>

                {/* STEP 4 — PARTNER */}
                <div className={`ob-screen ${step === 4 ? 'active' : step > 4 ? 'left' : 'right'}`}>
                    <div className="ob-emoji">💌</div>
                    <div className="ob-title">Добавьте<br/><span>половинку</span></div>
                    <div className="ob-sub">Как удобнее пригласить партнёра?</div>

                    <div className="ob-partner-options">
                        {[
                            { key: 'link', icon: '🔗', title: 'Отправить ссылку',  desc: 'Поделитесь ссылкой-приглашением в мессенджере' },
                            { key: 'qr',   icon: '📷', title: 'Показать QR-код',   desc: 'Пусть партнёр отсканирует — и вы сразу связаны' },
                        ].map(opt => (
                            <div
                                key={opt.key}
                                className={`ob-partner-option ${partnerOpt === opt.key ? 'on' : ''}`}
                                onClick={() => setPartnerOpt(opt.key)}
                            >
                                <div className="ob-partner-option-icon">{opt.icon}</div>
                                <div className="ob-partner-option-body">
                                    <div className="ob-partner-option-title">{opt.title}</div>
                                    <div className="ob-partner-option-desc">{opt.desc}</div>
                                </div>
                                <div className="ob-partner-check">
                                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Panel — ссылка или QR: показывается сразу после выбора опции */}
                    {partnerOpt && (
                        <div className="ob-partner-panel">

                            {partnerOpt === 'link' && (
                                <div className="ob-invite-link-box">
                                    <div className="ob-invite-label">Ваша ссылка-приглашение</div>
                                    <div className="ob-invite-row">
                                        <div className="ob-invite-url">
                                            {inviteLoading
                                                ? 'Генерируем ссылку…'
                                                : (invite?.inviteUrl || 'vmeste.app/join/…')
                                            }
                                        </div>
                                        <button
                                            className={`ob-btn-copy ${copied ? 'copied' : ''}`}
                                            onClick={copyLink}
                                            disabled={inviteLoading || !invite}
                                        >
                                            {copied ? 'Скопировано!' : 'Копировать'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {partnerOpt === 'qr' && (
                                <div className="ob-qr-box">
                                    {inviteLoading ? (
                                        <div style={{ color: '#888', fontSize: 13, padding: '16px 0' }}>
                                            Генерируем QR-код…
                                        </div>
                                    ) : (
                                        <>
                                            <div className="ob-qr-grid">
                                                {QR_PATTERN.map((v, i) => (
                                                    <div key={i} className="ob-qr-cell"
                                                         style={{ background: v ? '#111' : 'transparent' }} />
                                                ))}
                                            </div>
                                            <div className="ob-qr-label">
                                                Попросите половинку<br/>навести камеру на QR-код
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                    )}

                    <button
                        className="ob-btn-next ready"
                        disabled={saving}
                        onClick={handleNext}
                    >
                        {saving ? 'Сохраняем…' : 'Завершить настройку'}
                        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>

            </div>
        </div>
    );
}