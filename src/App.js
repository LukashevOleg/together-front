import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

import LoginPage      from './pages/loginPage/LoginPage';
import HomePage       from './pages/homePage/HomePage';
import IdeasPage      from './pages/ideasPage/IdeasPage';
import IdeasFeedPage  from './pages/ideasFeedPage/IdeasFeedPage';
import CreateIdeaPage from './pages/createIdeaPage/CreateIdeaPage';
import OnboardingPage  from './pages/onboardingPage/OnboardingPage';
import ProfilePage     from './pages/profilePage/ProfilePage';
import LubimkaPage        from './pages/lubimkaPage/LubimkaPage';
import PartnerProfilePage from './pages/partnerProfilePage/PartnerProfilePage';
import ChatsPage          from './pages/chatsPage/ChatsPage';
import AcceptInvitePage   from './pages/acceptInvitePage/AcceptInvitePage';
import IdeaDetailPage    from './pages/ideaDetailPage/IdeaDetailPage';
import DateModePage     from './pages/dateModePage/DateModePage';

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
        navigate(result.isNewUser ? '/onboarding' : '/', { replace: true });
    };

    return <LoginPage onAuthSuccess={handleAuthSuccess} />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<AuthRoute />} />

            <Route path="/join/:code" element={<AcceptInvitePage />} />

            <Route path="/onboarding"   element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
            <Route path="/profile"      element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/"             element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/ideas"        element={<PrivateRoute><IdeasPage /></PrivateRoute>} />
            <Route path="/ideas/feed"   element={<PrivateRoute><IdeasFeedPage /></PrivateRoute>} />
            <Route path="/ideas/create" element={<PrivateRoute><CreateIdeaPage /></PrivateRoute>} />
            <Route path="/lubimka"      element={<PrivateRoute><LubimkaPage /></PrivateRoute>} />
            <Route path="/partner"      element={<PrivateRoute><PartnerProfilePage /></PrivateRoute>} />
            <Route path="/spontaneous"  element={<PrivateRoute><DateModePage mode="spontaneous" /></PrivateRoute>} />
            <Route path="/planned"      element={<PrivateRoute><DateModePage mode="planned" /></PrivateRoute>} />
            <Route path="/chats"        element={<PrivateRoute><ChatsPage /></PrivateRoute>} />
            <Route path="/ideas/:id"    element={<PrivateRoute><IdeaDetailPage /></PrivateRoute>} />

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