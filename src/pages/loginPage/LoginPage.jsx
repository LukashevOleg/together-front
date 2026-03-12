import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

// ── Экран 1: ввод телефона ─────────────────────────────────────────────────
function PhoneScreen({ onSubmit, loading, error }) {
    const [raw, setRaw] = useState('');        // только цифры, без кода страны
    const [display, setDisplay] = useState(''); // форматированный вид

    const handleInput = (e) => {
        let digits = e.target.value.replace(/\D/g, '');
        if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
        digits = digits.slice(0, 10);

        let formatted = '';
        if (digits.length > 0) formatted = digits.slice(0, 3);
        if (digits.length > 3) formatted += ' ' + digits.slice(3, 6);
        if (digits.length > 6) formatted += '-' + digits.slice(6, 8);
        if (digits.length > 8) formatted += '-' + digits.slice(8, 10);

        setRaw(digits);
        setDisplay(formatted);
    };

    const ready = raw.length === 10;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!ready) return;
        onSubmit('+7' + raw);
    };

    return (
        <form className="screen visible" id="screenPhone" onSubmit={handleSubmit}>
            <div className="top-nav" />

            <div className="hero">
                <div className="hero-logo">💝</div>
                <div className="hero-title">Вме<span>сте</span></div>
                <div className="hero-sub">Идеи для свиданий, которые понравятся вам обоим</div>
            </div>

            <div className="form-area">
                <div className="phone-label">Номер телефона</div>
                <div className={`phone-input-wrap ${error ? 'error' : ''}`}>
                    <div className="phone-flag">🇷🇺 <span className="phone-code">+7</span></div>
                    <input
                        className="phone-input"
                        type="tel"
                        value={display}
                        onChange={handleInput}
                        placeholder="999 123-45-67"
                        maxLength={13}
                        autoFocus
                        disabled={loading}
                    />
                </div>
                <div className="phone-hint">Отправим СМС с кодом подтверждения. Стандартные тарифы оператора.</div>

                {error && <p className="field-error">{error}</p>}

                <button
                    type="submit"
                    className={`btn-confirm ${ready ? 'ready' : ''}`}
                    disabled={!ready || loading}
                >
                    {loading ? 'Отправляем…' : 'Получить код'}
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </button>

                <div className="terms">
                    Продолжая, вы соглашаетесь с <a href="#">условиями использования</a><br/>
                    и <a href="#">политикой конфиденциальности</a>
                </div>
            </div>
        </form>
    );
}

// ── Экран 2: ввод OTP ──────────────────────────────────────────────────────
function SmsScreen({ phoneNumber, onSubmit, onBack, onResend, loading, error, ttlMinutes }) {
    const [code, setCode]       = useState('');
    const [countdown, setCountdown] = useState(ttlMinutes * 60);
    const [cells, setCells]     = useState(['', '', '', '', '', '']);
    const hiddenRef = useRef(null);

    useEffect(() => {
        setTimeout(() => hiddenRef.current?.focus(), 400);
    }, []);

    useEffect(() => {
        if (countdown <= 0) return;
        const t = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [countdown]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleInput = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        e.target.value = val;
        setCode(val);
        setCells(Array.from({ length: 6 }, (_, i) => val[i] || ''));
        if (val.length === 6) onSubmit(val);
    };

    const handleResend = () => {
        setCountdown(60);
        setCode('');
        setCells(['', '', '', '', '', '']);
        onResend?.();
    };

    const displayPhone = '+7 ' + phoneNumber.slice(2, 5) + ' ' +
        phoneNumber.slice(5, 8) + '-' + phoneNumber.slice(8, 10) + '-' + phoneNumber.slice(10);

    return (
        <div className="screen visible" id="screenSms">
            <div className="top-nav">
                <button className="btn-back" onClick={onBack} type="button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <div className="btn-cancel" onClick={onBack}>Отмена</div>
            </div>

            <div className="hero" style={{ paddingTop: 20, paddingBottom: 20 }}>
                <div className="hero-logo" style={{ fontSize: 48, marginBottom: 12 }}>📲</div>
                <div className="hero-title" style={{ fontSize: 26, marginBottom: 6 }}>Введите <span>код</span></div>
                <div className="hero-sub">
                    Код отправлен на номер<br/>
                    <strong>{displayPhone}</strong>
                </div>
            </div>

            <div className="form-area">
                <input
                    ref={hiddenRef}
                    className="code-input-hidden"
                    type="tel"
                    maxLength={6}
                    onInput={handleInput}
                    autoComplete="one-time-code"
                />

                <div className="code-row" onClick={() => hiddenRef.current?.focus()}>
                    {cells.map((digit, i) => (
                        <div
                            key={i}
                            className={`code-cell
                ${i === code.length && !error ? 'active' : ''}
                ${digit ? 'filled' : ''}
                ${error ? 'error' : ''}
              `}
                        >
                            {digit || (i === code.length && !error
                                ? <div className="code-cursor" />
                                : null)}
                        </div>
                    ))}
                </div>

                {error && <div className="sms-error show">{error}</div>}

                <div className="resend-row">
                    {countdown > 0 ? (
                        <div className="resend-timer">
                            Отправить повторно через <span>{formatTime(countdown)}</span>
                        </div>
                    ) : (
                        <div className="btn-resend show" onClick={handleResend}>Отправить снова</div>
                    )}
                </div>

                <button
                    className={`btn-confirm ${code.length === 6 ? 'ready' : ''}`}
                    disabled={code.length < 6 || loading}
                    onClick={() => onSubmit(code)}
                    type="button"
                >
                    {loading ? 'Проверяем…' : 'Подтвердить'}
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ── Главная страница логина ────────────────────────────────────────────────
export default function LoginPage({ onAuthSuccess }) {
    const { step, phoneNumber, loading, error, ttlMinutes, sendOtp, verifyOtp, goBack } = useAuth();

    const handleVerify = async (otpCode) => {
        const result = await verifyOtp(otpCode);
        if (result?.success) {
            onAuthSuccess?.(result);
        }
    };

    return (
        <div className="login-page">
            <div className="status-bar">
                <span>9:41</span>
                <div className="status-icons">
                    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="1" y="6" width="3" height="12" rx="1"/><rect x="6" y="9" width="3" height="9" rx="1"/><rect x="11" y="5" width="3" height="13" rx="1"/><rect x="16" y="2" width="3" height="16" rx="1"/></svg>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>
                    <svg viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M22 11v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="4" y="9" width="10" height="7" rx="1" fill="currentColor"/></svg>
                </div>
            </div>

            {step === 'phone'
                ? <PhoneScreen onSubmit={sendOtp} loading={loading} error={error} />
                : <SmsScreen
                    phoneNumber={phoneNumber}
                    onSubmit={handleVerify}
                    onBack={goBack}
                    onResend={() => sendOtp(phoneNumber)}
                    loading={loading}
                    error={error}
                    ttlMinutes={ttlMinutes}
                />
            }
        </div>
    );
}