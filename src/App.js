import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

import LoginPage      from './pages/loginPage/LoginPage';
import HomePage       from './pages/homePage/HomePage';
import IdeasPage      from './pages/ideasPage/IdeasPage';
import IdeasFeedPage  from './pages/ideasFeedPage/IdeasFeedPage';
import CreateIdeaPage from './pages/createIdeaPage/CreateIdeaPage';

import './styles/globals.css';

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuthContext();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AuthRoute() {
    const { login } = useAuthContext();
    const navigate = useNavigate();

    const handleAuthSuccess = (result) => {
        login(result);
        navigate(result.isNewUser ? '/welcome' : '/', { replace: true });
    };

    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<AuthRoute />} />

            <Route path="/" element={
                <PrivateRoute><HomePage /></PrivateRoute>
            } />
            <Route path="/ideas" element={
                <PrivateRoute><IdeasPage /></PrivateRoute>
            } />
            <Route path="/ideas/feed" element={
                <PrivateRoute><IdeasFeedPage /></PrivateRoute>
            } />
            <Route path="/ideas/create" element={
                <PrivateRoute><CreateIdeaPage /></PrivateRoute>
            } />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}