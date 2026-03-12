import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const id = localStorage.getItem('userId');
        const phone = localStorage.getItem('phoneNumber');
        return id ? { id, phone } : null;
    });

    const login = (userData) => {
        localStorage.setItem('accessToken', userData.accessToken);
        localStorage.setItem('refreshToken', userData.refreshToken);
        localStorage.setItem('userId', userData.user.id);
        localStorage.setItem('phoneNumber', userData.user.phoneNumber);
        setUser(userData.user);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);