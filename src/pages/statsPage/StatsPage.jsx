import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPairStats } from '../../api/allstatApi';
import BottomNav from '../../components/layout/BottomNav';
import './StatsPage.css';

const CATEGORY_EMOJI = {
    ROMANTIC:      '🌹',
    FOOD:          '🍷',
    OUTDOOR:       '🌲',
    CULTURE:       '🎨',
    RELAX:         '🧖',
    ACTIVE:        '⚡',
    ENTERTAINMENT: '🎭',
    INDOOR:        '🏠',
    WELLNESS:      '🧘',
    OTHER:         '✨',
};

const STATUS_LABEL = {
    ACCEPTED:  '📅 Запланировано',
    COMPLETED: '✅ Состоялось',
    CANCELLED: '🚫 Отменено',
    DECLINED:  '❌ Отклонено',
    PENDING:   '⏳ Ожидание',
};

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function StatsPage() {
    const navigate = useNavigate();
    const [stats,   setStats]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);

    useEffect(() => {
        getPairStats()
            .then(data => { setStats(data); setLoading(false); })
            .catch(() => { setError(true); setLoading(false); });
    }, []);

    return (
        <div className="stats-page">

            {/* HEADER */}
            <div className="stats-header">
                <button className="stats-btn-back" onClick={() => navigate('/lubimka')}>
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="stats-title">Статистика</div>
            </div>

            {/* CONTENT */}
            <div className="stats-scroll">
                {loading ? (
                    <div className="stats-loading">
                        <div className="stats-skeleton" />
                        <div className="stats-skeleton" />
                        <div className="stats-skeleton tall" />
                    </div>
                ) : error ? (
                    <div className="stats-empty">
                        <div className="stats-empty-emoji">😔</div>
                        <div className="stats-empty-title">Не удалось загрузить</div>
                        <div className="stats-empty-sub">Проверьте соединение и попробуйте снова</div>
                    </div>
                ) : (
                    <>
                        {/* Основные счётчики */}
                        <div className="stats-grid2">
                            <div className="stat-tile dark">
                                <div className="st-em">💝</div>
                                <div className="st-num">{stats?.matchesCount ?? 0}</div>
                                <div className="st-lbl">совпадений</div>
                            </div>
                            <div className="stat-tile dark">
                                <div className="st-em">🗓</div>
                                <div className="st-num">{stats?.datesCount ?? 0}</div>
                                <div className="st-lbl">свиданий</div>
                            </div>
                        </div>

                        {/* Серия */}
                        {stats?.streak && stats.streak.count > 0 && (
                            <div className="stats-streak">
                                <div className="stats-streak-z">
                                    <div className="stats-streak-lbl">Серия подряд</div>
                                    <div className="stats-streak-val">
                                        {stats.streak.count} {stats.streak.description}
                                    </div>
                                </div>
                                <div className="stats-streak-em">🔥</div>
                            </div>
                        )}

                        {/* Топ категории */}
                        {stats?.topCategories?.length > 0 && (
                            <div className="stats-cats-card">
                                <div className="stats-cats-title">
                                    Любимые категории
                                </div>
                                {stats.topCategories.map(cat => (
                                    <div key={cat.key} className="stats-cat-row">
                                        <div className="stats-cat-name">
                                            {CATEGORY_EMOJI[cat.key] || '💡'} {cat.label}
                                        </div>
                                        <div className="stats-cat-bar">
                                            <div
                                                className="stats-cat-fill"
                                                style={{ width: `${cat.percent}%` }}
                                            />
                                        </div>
                                        <div className="stats-cat-pct">{cat.percent}%</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Пусто */}
                        {!stats?.timeline?.length && !stats?.topCategories?.length && (
                            <div className="stats-empty">
                                <div className="stats-empty-emoji">📊</div>
                                <div className="stats-empty-title">Пока нет данных</div>
                                <div className="stats-empty-sub">
                                    Ходите на свидания — здесь появится ваша история
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    );
}