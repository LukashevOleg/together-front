import { useState, useCallback, useRef } from 'react';

/**
 * Хук для поиска городов через Nominatim (OpenStreetMap).
 *
 * @returns {{
 *   query: string,
 *   suggestions: Array<{name: string, country: string}>,
 *   selected: {name: string, country: string} | null,
 *   loading: boolean,
 *   search: (value: string) => void,
 *   pick: (city: {name: string, country: string}) => void,
 *   clear: () => void,
 * }}
 */
export function useCitySearch() {
    const [query,       setQuery]       = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selected,    setSelected]    = useState(null);
    const [loading,     setLoading]     = useState(false);
    const debounceTimer = useRef(null);

    const search = useCallback((value) => {
        setQuery(value);
        setSelected(null); // сбрасываем выбор при ручном изменении

        clearTimeout(debounceTimer.current);

        if (value.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        debounceTimer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const url = new URL('https://nominatim.openstreetmap.org/search');
                url.searchParams.set('q',              value);
                url.searchParams.set('format',         'json');
                url.searchParams.set('addressdetails', '1');
                url.searchParams.set('limit',          '7');
                url.searchParams.set('accept-language','ru');
                url.searchParams.set('featuretype',    'city');

                const res  = await fetch(url.toString(), {
                    headers: { 'Accept-Language': 'ru' },
                });
                const data = await res.json();

                // Оставляем только населённые пункты, убираем дубли
                const cities = [];
                const seen   = new Set();

                for (const item of data) {
                    const type = item.type;
                    if (!['city', 'town', 'village', 'municipality', 'hamlet'].includes(type)) continue;

                    const name    = item.address?.city
                        || item.address?.town
                        || item.address?.village
                        || item.address?.hamlet
                        || item.name;
                    const country = item.address?.country ?? '';
                    const key     = `${name}|${country}`;

                    if (!seen.has(key)) {
                        seen.add(key);
                        cities.push({ name, country });
                    }
                }

                setSuggestions(cities);
            } catch (e) {
                console.error('[useCitySearch]', e);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 350);
    }, []);

    const pick = useCallback((city) => {
        setSelected(city);
        setQuery(city.name);
        setSuggestions([]);
    }, []);

    const clear = useCallback(() => {
        setQuery('');
        setSelected(null);
        setSuggestions([]);
    }, []);

    return { query, suggestions, selected, loading, search, pick, clear };
}