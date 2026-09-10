import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../layout/Sidebar';
import { Navbar } from '../layout/Navbar';
import { Spinner } from '../ui/Spinner';

import type { Role } from '../../types';

interface ProtectedRouteProps {
  requiredRole?: Role;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getRoleHome = (role?: string) => {
    if (role === 'SUPER_ADMIN') return '/superadmin/dashboard';
    if (role === 'COMPANY') return '/company/dashboard';
    return '/admin/dashboard';
  };

  // If a specific role is required and user does not have it, redirect to their role home
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={getRoleHome(user?.role)} replace />;
  }

  // If on general/tenant admin route (no requiredRole specified) but user is a COMPANY, redirect to company dashboard
  if (!requiredRole && user?.role === 'COMPANY') {
    return <Navigate to="/company/dashboard" replace />;
  }

  const subdomain = (user as any)?.subdomains?.[0]?.slug || 'demo';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          subdomain={subdomain}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
