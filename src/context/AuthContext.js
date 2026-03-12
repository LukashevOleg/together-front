import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

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
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    return useContext(AuthContext);
}