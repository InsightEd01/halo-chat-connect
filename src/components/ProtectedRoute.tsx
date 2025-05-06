
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-wispa-500 animate-spin" />
        <span className="ml-2 text-wispa-500">Loading...</span>
      </div>
    );
  }
  
  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Allow access to protected routes
  return <Outlet />;
}
