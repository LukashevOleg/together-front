import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { acceptInvite } from '../../api/profilerApi';
import './AcceptInvitePage.css';

/**
 * Страница принятия инвайта.
 * Открывается по ссылке: http://localhost:3000/join/:code
 *
 * Флоу:
 *  - не авторизован → сохранить code в sessionStorage → редирект на /login
 *  - после логина AuthContext.login() → App перенаправит обратно на /join/:code
 *  - авторизован → показать экран подтверждения → POST /api/partner/invite/:code/accept
 */
export default function AcceptInvitePage() {
    const { code }        = useParams();
    const navigate        = useNavigate();
    const { isAuthenticated } = useAuthContext();

    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);
    const [accepted, setAccepted] = useState(false);

    // Если не залогинен — сохранить код и уйти на логин
    useEffect(() => {
        if (!isAuthenticated) {
            sessionStorage.setItem('pendingInviteCode', code);
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, code, navigate]);

    const handleAccept = async () => {
        setLoading(true);
        setError(null);
        try {
            await acceptInvite(code);
            sessionStorage.removeItem('pendingInviteCode');
            setAccepted(true);
        } catch (e) {
            const status = e.response?.status;
            if (status === 404) setError('Ссылка недействительна или уже использована.');
            else if (status === 400) setError('Вы не можете принять собственное приглашение или уже состоите в паре.');
            else setError('Что-то пошло не так. Попробуйте ещё раз.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoHome = () => navigate('/lubimka', { replace: true });

    // Экран успеха
    if (accepted) {
        return (
            <div className="accept-invite-page">
                <div className="ai-card">
                    <div className="ai-success-emoji">💝</div>
                    <div className="ai-title">Вы теперь<br/><span>вместе!</span></div>
                    <div className="ai-sub">
                        Пара создана. Начните свайпать идеи для свиданий вместе.
                    </div>
                    <button className="ai-btn-accept" onClick={handleGoHome}>
                        Открыть Любимку
                        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
            </div>
        );
    }

    // Не авторизован — null, пока не сработает редирект
    if (!isAuthenticated) return null;

    // Экран подтверждения
    return (
        <div className="accept-invite-page">
            <div className="ai-card">
                <div className="ai-emoji">💌</div>
                <div className="ai-title">Вас пригласили<br/><span>в пару</span></div>
                <div className="ai-sub">
                    Примите приглашение, чтобы начать планировать свидания вместе.
                </div>

                {error && <div className="ai-error">{error}</div>}

                <button
                    className="ai-btn-accept"
                    onClick={handleAccept}
                    disabled={loading}
                >
                    {loading ? 'Принимаем…' : 'Принять приглашение'}
                    {!loading && <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>}
                </button>

                <button className="ai-btn-cancel" onClick={() => navigate('/')}>
                    Отмена
                </button>
            </div>
        </div>
    );
}