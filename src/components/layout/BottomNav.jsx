import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav({ onCreateClick }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <nav className="bottom-nav">
            <div className={`nav-item ${pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
                <div className="nav-icon">
                    <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div className="nav-label">Главная</div>
            </div>

            <div className={`nav-item ${pathname.startsWith('/ideas') ? 'active' : ''}`} onClick={() => navigate('/ideas')}>
                <div className="nav-icon">
                    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21h6"/><path d="M10 17h4"/>
                        <path d="M12 3C8.686 3 6 5.686 6 9c0 2.21 1.13 4.15 2.84 5.28L9 17h6l.16-2.72C16.87 13.15 18 11.21 18 9c0-3.314-2.686-6-6-6z"/>
                        <line x1="18.5" y1="3.5" x2="19.5" y2="2.5" strokeWidth="1.5"/>
                        <line x1="20" y1="6" x2="21.5" y2="5.5" strokeWidth="1.5"/>
                        <line x1="19.5" y1="8.5" x2="21" y2="8.5" strokeWidth="1.5"/>
                    </svg>
                </div>
                <div className="nav-label">Идеи</div>
            </div>

            <div className="nav-center-btn" onClick={onCreateClick}>
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>

            <div className={`nav-item ${pathname === '/calendar' ? 'active' : ''}`} onClick={() => navigate('/calendar')}>
                <div className="nav-icon">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="5" width="18" height="16" rx="3"/>
                        <path d="M3 10h18"/>
                        <circle cx="8" cy="15" r="1.2" fill="currentColor" stroke="none"/>
                        <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none"/>
                        <circle cx="16" cy="15" r="1.2" fill="currentColor" stroke="none"/>
                        <line x1="8" y1="3" x2="8" y2="7"/>
                        <line x1="16" y1="3" x2="16" y2="7"/>
                    </svg>
                </div>
                <div className="nav-label">Календарь</div>
            </div>

            <div className={`nav-item ${pathname === '/favorites' ? 'active' : ''}`} onClick={() => navigate('/favorites')}>
                <div className="nav-icon">
                    <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <div className="nav-label">Любимка</div>
            </div>
        </nav>
    );
}