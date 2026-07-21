import { useAuth } from '../auth/components/AuthContext'
import DashboardPage from '../pages/DashboardPage'
import Landing from '../pages/Landing';

function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) return null; // ou un spinner

  return user ? <DashboardPage /> : <Landing/>;
}
export default HomeRoute;