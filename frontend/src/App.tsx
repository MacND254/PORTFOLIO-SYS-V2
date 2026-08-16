import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Spinner } from './components/ui/Spinner';

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const PublicPortfolioPage = lazy(() =>
  import('./pages/PublicPortfolioPage').then((m) => ({ default: m.PublicPortfolioPage }))
);

// Admin pages
const DashboardPage = lazy(() =>
  import('./pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const CvImportPage = lazy(() =>
  import('./pages/admin/CvImportPage').then((m) => ({ default: m.CvImportPage }))
);
const CustomizerPage = lazy(() =>
  import('./pages/admin/CustomizerPage').then((m) => ({ default: m.CustomizerPage }))
);
const ProfileEditorPage = lazy(() =>
  import('./pages/admin/ProfileEditorPage').then((m) => ({ default: m.ProfileEditorPage }))
);
const ReviewsManagerPage = lazy(() =>
  import('./pages/admin/ReviewsManagerPage').then((m) => ({ default: m.ReviewsManagerPage }))
);
const MessagesManagerPage = lazy(() =>
  import('./pages/admin/MessagesManagerPage').then((m) => ({ default: m.MessagesManagerPage }))
);
const AnalyticsPage = lazy(() =>
  import('./pages/admin/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);

// Super Admin pages
const SuperAdminDashboard = lazy(() =>
  import('./pages/superadmin/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard }))
);
const ThemeManagerPage = lazy(() =>
  import('./pages/superadmin/ThemeManagerPage').then((m) => ({ default: m.ThemeManagerPage }))
);
const UserManagementPage = lazy(() =>
  import('./pages/superadmin/UserManagementPage').then((m) => ({ default: m.UserManagementPage }))
);
const SystemHealthPage = lazy(() =>
  import('./pages/superadmin/SystemHealthPage').then((m) => ({ default: m.SystemHealthPage }))
);
const AuditLogsPage = lazy(() =>
  import('./pages/superadmin/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage }))
);
const SystemSettingsPage = lazy(() =>
  import('./pages/superadmin/SystemSettingsPage').then((m) => ({ default: m.SystemSettingsPage }))
);
const MaintenancePage = lazy(() =>
  import('./pages/MaintenancePage').then((m) => ({ default: m.MaintenancePage }))
);

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Public Portfolio Viewer — /p/:subdomain for dev; production uses subdomain DNS */}
            <Route path="/p/:subdomain" element={<PublicPortfolioPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />

            {/* Tenant Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/cv-import" element={<CvImportPage />} />
              <Route path="/admin/customizer" element={<CustomizerPage />} />
              <Route path="/admin/profile" element={<ProfileEditorPage />} />
              <Route path="/admin/reviews" element={<ReviewsManagerPage />} />
              <Route path="/admin/messages" element={<MessagesManagerPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Super Admin Routes (SUPER_ADMIN role required) */}
            <Route element={<ProtectedRoute requiredRole="SUPER_ADMIN" />}>
              <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/themes" element={<ThemeManagerPage />} />
              <Route path="/superadmin/users" element={<UserManagementPage />} />
              <Route path="/superadmin/system-health" element={<SystemHealthPage />} />
              <Route path="/superadmin/audit-logs" element={<AuditLogsPage />} />
              <Route path="/superadmin/settings" element={<SystemSettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
