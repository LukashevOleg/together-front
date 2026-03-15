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
import SwipePage        from './pages/swipePage/SwipePage';
import CalendarPage     from './pages/calendarPage/CalendarPage';
import MatchesPage      from './pages/matchesPage/MatchesPage';
import InvitationsPage  from './pages/invitationsPage/InvitationsPage';

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
            <Route path="/spontaneous"  element={<PrivateRoute><DateModePage mode="spontaneous" /></PrivateRoute>} />
            <Route path="/planned"      element={<PrivateRoute><DateModePage mode="planned" /></PrivateRoute>} />
            <Route path="/swipe"        element={<PrivateRoute><SwipePage /></PrivateRoute>} />
            <Route path="/matches"      element={<PrivateRoute><MatchesPage /></PrivateRoute>} />
            <Route path="/invitations"  element={<PrivateRoute><InvitationsPage /></PrivateRoute>} />
            <Route path="/chats"        element={<PrivateRoute><ChatsPage /></PrivateRoute>} />
            <Route path="/calendar"     element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
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