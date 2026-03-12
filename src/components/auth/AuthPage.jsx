import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

function PhoneStep({ onSubmit, loading, error }) {
    const [phone, setPhone] = useState('+7');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(phone);
    };

    const handleChange = (e) => {
        let val = e.target.value;
        // Всегда начинаем с '+'
        if (!val.startsWith('+')) val = '+' + val;
        // Только цифры после '+'
        val = '+' + val.slice(1).replace(/\D/g, '');
        setPhone(val);
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h1>Enter your phone</h1>
            <p className="subtitle">We'll send you a verification code</p>

            <div className="input-group">
                <label htmlFor="phone">Phone number</label>
                <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={handleChange}
                    placeholder="+79001234567"
                    maxLength={16}
                    autoFocus
                    disabled={loading}
                />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading || phone.length < 8} className="btn-primary">
                {loading ? 'Sending…' : 'Get code'}
            </button>
        </form>
    );
}

function OtpStep({ phoneNumber, onSubmit, onBack, loading, error, ttlMinutes }) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(ttlMinutes * 60);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        // Переходим к следующему полю
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
        // Автосабмит когда все 6 цифр введены
        const fullOtp = newOtp.join('');
        if (fullOtp.length === 6) onSubmit(fullOtp);
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            onSubmit(pasted);
        }
    };

    return (
        <div className="auth-form">
            <button className="back-btn" onClick={onBack} disabled={loading}>← Back</button>
            <h1>Enter the code</h1>
            <p className="subtitle">
                Sent to <strong>{phoneNumber}</strong>
            </p>

            <div className="otp-inputs" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        disabled={loading}
                        className={`otp-input ${error ? 'otp-input--error' : ''}`}
                        autoFocus={i === 0}
                    />
                ))}
            </div>

            {error && <p className="error">{error}</p>}

            <p className="countdown">
                {countdown > 0
                    ? `Code expires in ${formatTime(countdown)}`
                    : 'Code expired. Please go back and try again.'}
            </p>

            {loading && <p className="loading-text">Verifying…</p>}
        </div>
    );
}

// ── Главная страница авторизации ──────────────────────────────────────────
export default function AuthPage({ onAuthSuccess }) {
    const { step, phoneNumber, loading, error, ttlMinutes, sendOtp, verifyOtp, goBack } = useAuth();

    const handleVerify = async (otpCode) => {
        const result = await verifyOtp(otpCode);
        if (result?.success) {
            onAuthSuccess?.(result);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {step === 'phone' ? (
                    <PhoneStep onSubmit={sendOtp} loading={loading} error={error} />
                ) : (
                    <OtpStep
                        phoneNumber={phoneNumber}
                        onSubmit={handleVerify}
                        onBack={goBack}
                        loading={loading}
                        error={error}
                        ttlMinutes={ttlMinutes}
                    />
                )}
            </div>
        </div>
    );
}