import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuthContext } from './context/AuthContext';
import PrivateRoute from './components/routing/PrivateRoute';
import AuthPage from './components/auth/AuthPage';
import HomePage from './pages/HomePage';
import WelcomePage from './pages/WelcomePage';

function AuthRoute() {
    const { login } = useAuthContext();
    const navigate = useNavigate();

    const handleAuthSuccess = (result) => {
        login(result);
        navigate(result.isNewUser ? '/welcome' : '/', { replace: true });
    };

    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login"   element={<AuthRoute />} />
                    <Route path="/welcome" element={<PrivateRoute><WelcomePage /></PrivateRoute>} />
                    <Route path="/"        element={<PrivateRoute><HomePage /></PrivateRoute>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}