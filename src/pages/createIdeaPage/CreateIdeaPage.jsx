import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIdea, uploadIdeaPhoto } from '../../api/ideaApi';
import './CreateIdeaPage.css';

const STEPS = ['Фото', 'Основное', 'Детали', 'Теги'];

const CATEGORIES = [
    { key: 'ROMANTIC',      label: '🌹 Романтика' },
    { key: 'OUTDOOR',       label: '🌲 Природа' },
    { key: 'FOOD',          label: '🍷 Гастро' },
    { key: 'ACTIVE',        label: '⚡ Актив' },
    { key: 'CREATIVE',      label: '🎨 Творчество' },
    { key: 'INDOOR',        label: '🏠 Дома' },
    { key: 'WELLNESS',      label: '🧘 Велнес' },
    { key: 'ENTERTAINMENT', label: '🎭 Развлечение' },
    { key: 'OTHER',         label: '✨ Другое' },
];

const TAG_SUGGESTIONS = [
    'вечер', 'романтика', 'недорого', 'природа', 'активно',
    'вдвоём', 'уютно', 'необычно', 'в городе', 'за городом',
];

let _uid = 0;
const uid = () => ++_uid;

export default function CreateIdeaPage() {
    const navigate = useNavigate();
    const fileRef  = useRef();

    const [step,    setStep]    = useState(0);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    // Фото: массив { id, file, previewUrl }
    const [photos,      setPhotos]      = useState([]);
    const dragItem      = useRef(null);
    const dragOverItem  = useRef(null);

    const [form, setForm] = useState({
        title:       '',
        description: '',
        category:    '',
        priceFrom:   '',
        durationMin: '',
        location:    '',
        address:     '',
        tags:        [],
    });

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const toggleTag = (tag) => setForm(f => ({
        ...f,
        tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));

    // ── Фото ─────────────────────────────────────────────────────────────

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const newItems = files.map(file => ({
            id: uid(),
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setPhotos(prev => [...prev, ...newItems]);
        // сбрасываем input чтобы повторно можно было выбрать тот же файл
        e.target.value = '';
    };

    const removePhoto = (id) => {
        setPhotos(prev => {
            const item = prev.find(p => p.id === id);
            if (item) URL.revokeObjectURL(item.previewUrl);
            return prev.filter(p => p.id !== id);
        });
    };

    // ── Drag & Drop ───────────────────────────────────────────────────────

    const onDragStart = useCallback((index) => {
        dragItem.current = index;
    }, []);

    const onDragEnter = useCallback((index) => {
        dragOverItem.current = index;
        // визуальная подсказка через state не нужна — браузер сам показывает
    }, []);

    const onDragEnd = useCallback(() => {
        const from = dragItem.current;
        const to   = dragOverItem.current;
        if (from === null || to === null || from === to) {
            dragItem.current = dragOverItem.current = null;
            return;
        }
        setPhotos(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        dragItem.current = dragOverItem.current = null;
    }, []);

    // ── Валидация ─────────────────────────────────────────────────────────

    const canNext = () => {
        if (step === 1) return form.title.trim().length >= 3 && form.category;
        return true;
    };

    // ── Отправка ──────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const idea = await createIdea(form);

            // Загружаем фото строго по порядку → sortOrder = 0, 1, 2…
            for (const photo of photos) {
                await uploadIdeaPhoto(idea.id, photo.file);
            }

            navigate('/ideas/feed');
        } catch (e) {
            const msg = e.response?.data?.message
                || JSON.stringify(e.response?.data?.errors)
                || 'Ошибка при создании идеи';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="create-page">

            <div className="top-bar">
                <button className="btn-back"
                        onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <div className="top-bar-title">Новая идея</div>
                <button className="btn-skip" onClick={() => navigate(-1)}>Отмена</button>
            </div>

            <div className="progress-wrap">
                <div className="progress-steps">
                    {STEPS.map((s, i) => (
                        <div key={s} className={`progress-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                            <div className="progress-step-fill"/>
                        </div>
                    ))}
                </div>
                <div className="progress-label">
                    Шаг <span>{step + 1} из {STEPS.length}</span> — {STEPS[step]}
                </div>
            </div>

            <div className="create-scroll">

                {/* ── Шаг 1: Фото ── */}
                {step === 0 && (
                    <div className="step-panel active">
                        <div className="step-eyebrow">Шаг 1</div>
                        <div className="step-heading">Добавьте фото</div>
                        <div className="step-desc">
                            Перетащите, чтобы изменить порядок — первое фото станет обложкой
                        </div>

                        {/* Сетка фоток */}
                        {photos.length > 0 && (
                            <div className="photo-grid">
                                {photos.map((p, index) => (
                                    <div
                                        key={p.id}
                                        className={`photo-thumb ${index === 0 ? 'cover' : ''}`}
                                        draggable
                                        onDragStart={() => onDragStart(index)}
                                        onDragEnter={() => onDragEnter(index)}
                                        onDragEnd={onDragEnd}
                                        onDragOver={e => e.preventDefault()}
                                    >
                                        <img src={p.previewUrl} alt={`photo-${index}`}/>

                                        {index === 0 && (
                                            <div className="cover-badge">Обложка</div>
                                        )}

                                        <button
                                            className="photo-remove"
                                            onClick={() => removePhoto(p.id)}
                                            aria-label="Удалить фото"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <line x1="18" y1="6" x2="6" y2="18"/>
                                                <line x1="6"  y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>

                                        <div className="drag-handle" title="Перетащить">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <line x1="8"  y1="6"  x2="21" y2="6"/>
                                                <line x1="8"  y1="12" x2="21" y2="12"/>
                                                <line x1="8"  y1="18" x2="21" y2="18"/>
                                                <line x1="3"  y1="6"  x2="3.01" y2="6"/>
                                                <line x1="3"  y1="12" x2="3.01" y2="12"/>
                                                <line x1="3"  y1="18" x2="3.01" y2="18"/>
                                            </svg>
                                        </div>
                                    </div>
                                ))}

                                {/* Кнопка добавить ещё */}
                                <button
                                    className="photo-add-more"
                                    onClick={() => fileRef.current?.click()}
                                    title="Добавить фото"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                        <line x1="5"  y1="12" x2="19" y2="12"/>
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Пустое состояние */}
                        {photos.length === 0 && (
                            <div className="photo-upload-main"
                                 onClick={() => fileRef.current?.click()}>
                                <div className="upload-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                </div>
                                <div className="upload-label">Загрузить фото</div>
                                <div className="upload-sub">JPG, PNG до 10 МБ · можно несколько</div>
                            </div>
                        )}

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={handlePhotoChange}
                        />

                        {photos.length > 0 && (
                            <div className="photo-count-hint">
                                {photos.length} {photos.length === 1 ? 'фото' : photos.length < 5 ? 'фото' : 'фото'} · перетащите для изменения порядка
                            </div>
                        )}
                    </div>
                )}

                {/* ── Шаг 2: Основное ── */}
                {step === 1 && (
                    <div className="step-panel active">
                        <div className="step-eyebrow">Шаг 2</div>
                        <div className="step-heading">Расскажите об идее</div>
                        <div className="step-desc">Название и категория помогут найти вашу идею</div>
                        <div className="field-group">
                            <label className="field-label">Название *</label>
                            <input className="field-input" placeholder="Например: Ужин при свечах на крыше"
                                   value={form.title} onChange={e => set('title', e.target.value)} maxLength={200}/>
                            <div className="field-counter">{form.title.length}/200</div>
                        </div>
                        <div className="field-group">
                            <label className="field-label">Описание</label>
                            <textarea className="field-textarea" placeholder="Опишите идею подробнее…"
                                      value={form.description} onChange={e => set('description', e.target.value)} rows={4}/>
                        </div>
                        <div className="field-group">
                            <label className="field-label">Категория *</label>
                            <div className="cat-chips">
                                {CATEGORIES.map(c => (
                                    <div key={c.key} className={`f-chip ${form.category === c.key ? 'on' : ''}`}
                                         onClick={() => set('category', c.key)}>{c.label}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Шаг 3: Детали ── */}
                {step === 2 && (
                    <div className="step-panel active">
                        <div className="step-eyebrow">Шаг 3</div>
                        <div className="step-heading">Детали свидания</div>
                        <div className="step-desc">Укажите цену и время — это поможет с планированием</div>
                        <div className="fields-row">
                            <div className="field-group">
                                <label className="field-label">Цена от (₽)</label>
                                <input className="field-input" type="number" placeholder="0"
                                       value={form.priceFrom} onChange={e => set('priceFrom', e.target.value)} min={0}/>
                            </div>
                            <div className="field-group">
                                <label className="field-label">Длительность (мин)</label>
                                <input className="field-input" type="number" placeholder="120"
                                       value={form.durationMin} onChange={e => set('durationMin', e.target.value)} min={1}/>
                            </div>
                        </div>
                        <div className="field-group">
                            <label className="field-label">Город / локация</label>
                            <input className="field-input" placeholder="Москва"
                                   value={form.location} onChange={e => set('location', e.target.value)}/>
                        </div>
                        <div className="field-group">
                            <label className="field-label">Адрес</label>
                            <input className="field-input" placeholder="Ул. Тверская, 1"
                                   value={form.address} onChange={e => set('address', e.target.value)}/>
                        </div>
                    </div>
                )}

                {/* ── Шаг 4: Теги ── */}
                {step === 3 && (
                    <div className="step-panel active">
                        <div className="step-eyebrow">Шаг 4</div>
                        <div className="step-heading">Добавьте теги</div>
                        <div className="step-desc">Теги помогут найти идею по настроению</div>
                        <div className="tag-suggestions">
                            {TAG_SUGGESTIONS.map(tag => (
                                <div key={tag} className={`f-chip ${form.tags.includes(tag) ? 'on' : ''}`}
                                     onClick={() => toggleTag(tag)}>#{tag}</div>
                            ))}
                        </div>
                        {form.tags.length > 0 && (
                            <div className="selected-tags">
                                <div className="field-label">Выбрано: {form.tags.length}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && <div className="create-error">{error}</div>}

            <div className="create-footer">
                {step < STEPS.length - 1
                    ? <button className="btn-next" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
                        Далее
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                    : <button className="btn-next ready" disabled={loading} onClick={handleSubmit}>
                        {loading
                            ? `Загружаем фото${photos.length > 0 ? ` (${photos.length})` : ''}…`
                            : 'Создать идею 💝'
                        }
                    </button>
                }
            </div>
        </div>
    );
}