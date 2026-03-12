import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

export default function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuthContext();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}