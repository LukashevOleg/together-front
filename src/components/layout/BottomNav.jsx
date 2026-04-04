import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import './BottomNav.css';

export default function BottomNav() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { totalUnread, clearUnread } = useNotifications();

    const isHome    = pathname === '/';
    const isIdeas   = pathname.startsWith('/ideas');
    const isChats   = pathname.startsWith('/chats');
    const isLubimka = pathname.startsWith('/lubimka') || pathname === '/partner';

    const handleChats = () => {
        clearUnread();
        navigate('/chats');
    };

    return (
        <nav className="bottom-nav">
            <div className={`nav-item ${isHome ? 'active' : ''}`} onClick={() => navigate('/')}>
                <div className="nav-icon">
                    <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div className="nav-label">Главная</div>
            </div>

            <div className={`nav-item ${isIdeas ? 'active' : ''}`} onClick={() => navigate('/ideas')}>
                <div className="nav-icon">
                    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21h6"/><path d="M10 17h4"/>
                        <path d="M12 3C8.686 3 6 5.686 6 9c0 2.21 1.13 4.15 2.84 5.28L9 17h6l.16-2.72C16.87 13.15 18 11.21 18 9c0-3.314-2.686-6-6-6z"/>
                    </svg>
                </div>
                <div className="nav-label">Идеи</div>
            </div>

            <div className={`nav-item ${pathname.startsWith('/swipe') ? 'active' : ''}`} onClick={() => navigate('/swipe')}>
                <div className="nav-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                        <g transform="rotate(8 15 11)">
                            <rect x="7" y="2" width="13" height="15" rx="2.5" fill="none" />
                        </g>
                        <rect x="4" y="4" width="13" height="16" rx="2.5" fill="#FFFFFF" />
                    </svg>
                </div>
                <div className="nav-label">Свайпы</div>
            </div>

            <div className={`nav-item ${isChats ? 'active' : ''}`} onClick={handleChats}>
                <div className="nav-icon" style={{ position: 'relative' }}>
                    <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>

                    {totalUnread > 0 && !isChats && (
                        <span className="nav-badge" />
                    )}
                </div>
                <div className="nav-label">Чаты</div>
            </div>

            <div className={`nav-item ${isLubimka ? 'active' : ''}`} onClick={() => navigate('/lubimka')}>
                <div className="nav-icon">
                    <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <div className="nav-label">Любимка</div>
            </div>
        </nav>
    );
}