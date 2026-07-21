import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // ou un spinner si tu veux

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}