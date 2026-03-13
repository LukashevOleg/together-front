import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { getMyProfile, updateProfile, uploadAvatar } from '../../api/profilerApi';
import './ProfilePage.css';

const ALL_INTERESTS = [
    { key: 'ROMANTIC',  emoji: '🌹', label: 'Романтика' },
    { key: 'FOOD',      emoji: '🍷', label: 'Гастро' },
    { key: 'NATURE',    emoji: '🌿', label: 'Природа' },
    { key: 'CULTURE',   emoji: '🎨', label: 'Культура' },
    { key: 'EXTREME',   emoji: '⚡', label: 'Экстрим' },
    { key: 'RELAX',     emoji: '🧖', label: 'Релакс' },
    { key: 'ACTIVE',    emoji: '🏃', label: 'Активное' },
    { key: 'NIGHTLIFE', emoji: '🌙', label: 'Ночные' },
    { key: 'THEATRE',   emoji: '🎭', label: 'Театр' },
];

function ageLabel(n) {
    if (!n) return '';
    if (n % 10 === 1 && n % 100 !== 11) return `${n} год`;
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return `${n} года`;
    return `${n} лет`;
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthContext();
    const photoInputRef = useRef();

    // Profile data
    const [profile,   setProfile]   = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [avatarUrl, setAvatarUrl] = useState(null);

    // Field sheet state
    const [fieldSheet,    setFieldSheet]    = useState(false);
    const [fieldKey,      setFieldKey]      = useState(null); // 'name'|'age'|'city'
    const [fieldValue,    setFieldValue]    = useState('');
    const [fieldSaving,   setFieldSaving]   = useState(false);

    // Interests sheet state
    const [intSheet,      setIntSheet]      = useState(false);
    const [intSearch,     setIntSearch]     = useState('');
    const [selectedInts,  setSelectedInts]  = useState(new Set());
    const [intSnap,       setIntSnap]       = useState(null); // rollback
    const [intSaving,     setIntSaving]     = useState(false);

    // Load profile on mount
    useEffect(() => {
        getMyProfile()
            .then(data => {
                setProfile(data);
                setAvatarUrl(data.avatarUrl);
                setSelectedInts(new Set(data.interests || []));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // ── Avatar upload ─────────────────────────────────────────────────────────
    const onPhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Optimistic preview
        setAvatarUrl(URL.createObjectURL(file));
        try {
            const updated = await uploadAvatar(file);
            setProfile(updated);
            setAvatarUrl(updated.avatarUrl);
        } catch {
            // revert
            setAvatarUrl(profile?.avatarUrl || null);
        }
    };

    // ── Field sheet ───────────────────────────────────────────────────────────
    const FIELD_META = {
        name: { label: 'имя',    type: 'text',   placeholder: 'Ваше имя',    suffix: '' },
        age:  { label: 'возраст', type: 'number', placeholder: 'Ваш возраст', suffix: '' },
        city: { label: 'город',  type: 'text',   placeholder: 'Ваш город',   suffix: '' },
    };

    const openField = (key) => {
        setFieldKey(key);
        setFieldValue(String(profile?.[key] || ''));
        setFieldSheet(true);
    };

    const saveField = async () => {
        if (!fieldValue.trim()) { setFieldSheet(false); return; }
        setFieldSaving(true);
        try {
            const val = fieldKey === 'age' ? Number(fieldValue) : fieldValue.trim();
            const updated = await updateProfile({ [fieldKey]: val });
            setProfile(updated);
        } catch (e) {
            console.error('Save field error', e);
        } finally {
            setFieldSaving(false);
            setFieldSheet(false);
        }
    };

    // ── Interests sheet ───────────────────────────────────────────────────────
    const openInterests = () => {
        setIntSnap(new Set(selectedInts)); // snapshot for rollback
        setIntSearch('');
        setIntSheet(true);
    };

    const closeInterests = () => {
        if (intSnap) setSelectedInts(intSnap); // rollback
        setIntSnap(null);
        setIntSheet(false);
    };

    const toggleInterest = (key) => {
        setSelectedInts(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const saveInterests = async () => {
        setIntSaving(true);
        try {
            const updated = await updateProfile({ interests: [...selectedInts] });
            setProfile(updated);
            setIntSnap(null);
            setIntSheet(false);
        } catch {
            console.error('Save interests error');
        } finally {
            setIntSaving(false);
        }
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = () => {
        if (window.confirm('Вы уверены, что хотите выйти?')) {
            logout();
            navigate('/login', { replace: true });
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const filteredInterests = ALL_INTERESTS.filter(i =>
        !intSearch || i.label.toLowerCase().includes(intSearch.toLowerCase())
    );

    const heroSub = [profile?.city, profile?.age ? ageLabel(profile.age) : null]
        .filter(Boolean).join(' · ');

    if (loading) {
        return (
            <div className="profile-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#888', fontSize: 14 }}>Загружаем профиль…</div>
            </div>
        );
    }

    const closeOverlay = () => {
        if (fieldSheet) setFieldSheet(false);
        if (intSheet) closeInterests();
    };

    return (
        <div className="profile-page">

            <div className="pr-scroll">
                {/* HERO */}
                <div className="pr-hero">
                    <div className="pr-hero-overlay" />
                    {avatarUrl
                        ? <img className="pr-hero-photo" src={avatarUrl} alt="avatar" />
                        : <div className="pr-hero-emoji">🐻</div>
                    }
                    <button className="pr-btn-back" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <div className="pr-photo-btn" onClick={() => photoInputRef.current?.click()}>
                        <svg viewBox="0 0 24 24">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span>Фото</span>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={onPhotoChange} />
                    <div className="pr-hero-name-block">
                        <div className="pr-hero-name">{profile?.name || '—'}</div>
                        <div className="pr-hero-sub">{heroSub || 'Заполните профиль'}</div>
                    </div>
                </div>

                <div className="pr-content">
                    {/* PERSONAL INFO */}
                    <div>
                        <div className="pr-sec-header">
                            <div className="pr-sec-label">Личная информация</div>
                        </div>
                        <div className="pr-field-card">
                            {[
                                { key: 'name', icon: '👤', label: 'Имя',    value: profile?.name || '—' },
                                { key: 'age',  icon: '🎂', label: 'Возраст', value: profile?.age ? ageLabel(profile.age) : '—' },
                                { key: 'city', icon: '🏙', label: 'Город',   value: profile?.city || '—' },
                            ].map(row => (
                                <div key={row.key} className="pr-field-row" onClick={() => openField(row.key)}>
                                    <div className="pr-field-icon">{row.icon}</div>
                                    <div className="pr-field-body">
                                        <div className="pr-field-lbl">{row.label}</div>
                                        <div className="pr-field-val">{row.value}</div>
                                    </div>
                                    <div className="pr-field-chev">
                                        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Телефон — readonly */}
                        <div className="pr-field-card muted" style={{ marginTop: 10 }}>
                            <div className="pr-field-row readonly">
                                <div className="pr-field-icon muted">📱</div>
                                <div className="pr-field-body">
                                    <div className="pr-field-lbl">Телефон</div>
                                    <div className="pr-field-val">{user?.phone || '—'}</div>
                                </div>
                                <div className="pr-field-badge">Не меняется</div>
                            </div>
                        </div>
                    </div>

                    {/* INTERESTS */}
                    <div>
                        <div className="pr-sec-header">
                            <div className="pr-sec-label">Увлечения</div>
                            <div className="pr-sec-action" onClick={openInterests}>Изменить</div>
                        </div>
                        <div className="pr-chips-wrap">
                            {selectedInts.size > 0
                                ? ALL_INTERESTS
                                    .filter(i => selectedInts.has(i.key))
                                    .map(i => (
                                        <div key={i.key} className="pr-chip">
                                            <span>{i.emoji}</span>{i.label}
                                        </div>
                                    ))
                                : <span className="pr-chips-empty">Нажмите Изменить, чтобы добавить</span>
                            }
                        </div>
                    </div>

                    {/* LOGOUT */}
                    <button className="pr-logout-btn" onClick={handleLogout}>
                        <div className="pr-logout-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                        </div>
                        <div className="pr-logout-text">Выйти из аккаунта</div>
                    </button>
                </div>
            </div>

            {/* ── OVERLAY ─────────────────────────────────────────────────────── */}
            <div className={`pr-overlay ${fieldSheet || intSheet ? 'open' : ''}`} onClick={closeOverlay} />

            {/* ── FIELD SHEET ─────────────────────────────────────────────────── */}
            <div className={`pr-sheet ${fieldSheet ? 'open' : ''}`}>
                <div className="pr-sheet-handle" />
                <div className="pr-sheet-title">
                    Редактировать <span>{fieldKey ? FIELD_META[fieldKey]?.label : ''}</span>
                </div>
                <div className="pr-sheet-body">
                    <input
                        className="pr-s-input"
                        type={fieldKey ? FIELD_META[fieldKey]?.type : 'text'}
                        placeholder={fieldKey ? FIELD_META[fieldKey]?.placeholder : ''}
                        value={fieldValue}
                        onChange={e => setFieldValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveField()}
                    />
                </div>
                <div className="pr-sheet-footer">
                    <button className="pr-save-btn" onClick={saveField} disabled={fieldSaving}>
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        {fieldSaving ? 'Сохраняем…' : 'Сохранить'}
                    </button>
                </div>
            </div>

            {/* ── INTERESTS SHEET ─────────────────────────────────────────────── */}
            <div className={`pr-sheet ${intSheet ? 'open' : ''}`}>
                <div className="pr-sheet-handle" />
                <div className="pr-sheet-title">Ваши <span>увлечения</span></div>
                <div className="pr-sheet-body">
                    <div className="pr-int-search-wrap">
                        <div className="pr-int-search-icon">
                            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </div>
                        <input
                            className="pr-int-search"
                            placeholder="Поиск..."
                            value={intSearch}
                            onChange={e => setIntSearch(e.target.value)}
                        />
                    </div>
                    <div className="pr-int-grid">
                        {filteredInterests.map(i => (
                            <div
                                key={i.key}
                                className={`pr-ic ${selectedInts.has(i.key) ? 'on' : ''}`}
                                onClick={() => toggleInterest(i.key)}
                            >
                                <span>{i.emoji}</span>{i.label}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="pr-sheet-footer">
                    <button className="pr-save-btn" onClick={saveInterests} disabled={intSaving}>
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        {intSaving ? 'Сохраняем…' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}