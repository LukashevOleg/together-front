import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

/** Достаём userId из payload JWT без внешних библиотек */
function decodeUserId(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId ?? null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const isAuthenticated = !!user && !!localStorage.getItem('accessToken');

    // userId — декодируем из токена при каждом обращении
    const userId = isAuthenticated
        ? decodeUserId(localStorage.getItem('accessToken'))
        : null;

    const login = (authResult) => {
        const userData = {
            phone:     authResult.phone || authResult.phoneNumber,
            isNewUser: authResult.isNewUser,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        // токены уже сохранены в authApi.js
    };

    const logout = () => {
        setUser(null);
        localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, userId, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    return useContext(AuthContext);
}