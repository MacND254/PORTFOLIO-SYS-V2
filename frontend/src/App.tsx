import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Spinner } from './components/ui/Spinner';
import { extractSubdomainFromHostname } from './utils/url';

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage').then((m) => ({ default: m.OAuthCallbackPage })));
const OAuthOnboardingPage = lazy(() => import('./pages/OAuthOnboardingPage').then((m) => ({ default: m.OAuthOnboardingPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage })));
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
const InterviewManagerPage = lazy(() =>
  import('./pages/admin/InterviewManagerPage').then((m) => ({ default: m.InterviewManagerPage }))
);
const MessagesManagerPage = lazy(() =>
  import('./pages/admin/MessagesManagerPage').then((m) => ({ default: m.MessagesManagerPage }))
);
const AnalyticsPage = lazy(() =>
  import('./pages/admin/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const UserSettingsPage = lazy(() =>
  import('./pages/admin/UserSettingsPage').then((m) => ({ default: m.UserSettingsPage }))
);
const TenantNotificationsPage = lazy(() =>
  import('./pages/admin/TenantNotificationsPage').then((m) => ({ default: m.TenantNotificationsPage }))
);

// Super Admin pages
const SuperAdminDashboard = lazy(() =>
  import('./pages/superadmin/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard }))
);
const SuperAdminNotificationsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminNotificationsPage').then((m) => ({ default: m.SuperAdminNotificationsPage }))
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
const SuperAdminAnalyticsPage = lazy(() =>
  import('./pages/superadmin/SuperAdminAnalyticsPage').then((m) => ({ default: m.SuperAdminAnalyticsPage }))
);
const MaintenancePage = lazy(() =>
  import('./pages/MaintenancePage').then((m) => ({ default: m.MaintenancePage }))
);

// Company Partner pages
const CompanyRegisterPage = lazy(() =>
  import('./pages/CompanyRegisterPage').then((m) => ({ default: m.CompanyRegisterPage }))
);
const CompanyInvitesPage = lazy(() =>
  import('./pages/superadmin/CompanyInvitesPage').then((m) => ({ default: m.CompanyInvitesPage }))
);
const CompanyDashboardPage = lazy(() =>
  import('./pages/company/CompanyDashboardPage').then((m) => ({ default: m.CompanyDashboardPage }))
);
const JobPostingsPage = lazy(() =>
  import('./pages/company/JobPostingsPage').then((m) => ({ default: m.JobPostingsPage }))
);
const CreateJobPage = lazy(() =>
  import('./pages/company/CreateJobPage').then((m) => ({ default: m.CreateJobPage }))
);
const JobMatchesPage = lazy(() =>
  import('./pages/company/JobMatchesPage').then((m) => ({ default: m.JobMatchesPage }))
);
const CompanyProfilePage = lazy(() =>
  import('./pages/company/CompanyProfilePage').then((m) => ({ default: m.CompanyProfilePage }))
);
const CompanyNotificationsPage = lazy(() =>
  import('./pages/company/CompanyNotificationsPage').then((m) => ({ default: m.CompanyNotificationsPage }))
);

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

function App() {
  const hostnameSubdomain = typeof window !== 'undefined' ? extractSubdomainFromHostname(window.location.hostname) : null;

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes - Subdomain host serves portfolio on root / */}
            <Route path="/" element={hostnameSubdomain ? <PublicPortfolioPage /> : <LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/oauth" element={<OAuthOnboardingPage />} />
            <Route path="/register/company" element={<CompanyRegisterPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Public Portfolio Viewer — /p/:subdomain for dev; production uses subdomain DNS */}
            <Route path="/p/:subdomain" element={<PublicPortfolioPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />

            {/* Tenant Admin Routes — accessible by ADMIN and SUPER_ADMIN */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/cv-import" element={<CvImportPage />} />
              <Route path="/admin/customizer" element={<CustomizerPage />} />
              <Route path="/admin/profile" element={<ProfileEditorPage />} />
              <Route path="/admin/account" element={<UserSettingsPage />} />
              <Route path="/admin/reviews" element={<ReviewsManagerPage />} />
              <Route path="/admin/interviews" element={<InterviewManagerPage />} />
              <Route path="/admin/messages" element={<MessagesManagerPage />} />
              <Route path="/admin/notifications" element={<TenantNotificationsPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Super Admin Routes (SUPER_ADMIN role required) */}
            <Route element={<ProtectedRoute requiredRole="SUPER_ADMIN" />}>
              <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/notifications" element={<SuperAdminNotificationsPage />} />
              <Route path="/superadmin/themes" element={<ThemeManagerPage />} />
              <Route path="/superadmin/users" element={<UserManagementPage />} />
              <Route path="/superadmin/system-health" element={<SystemHealthPage />} />
              <Route path="/superadmin/audit-logs" element={<AuditLogsPage />} />
              <Route path="/superadmin/settings" element={<SystemSettingsPage />} />
              <Route path="/superadmin/companies" element={<CompanyInvitesPage />} />
              <Route path="/superadmin/analytics" element={<SuperAdminAnalyticsPage />} />
            </Route>

            {/* Company Partner Routes */}
            <Route element={<ProtectedRoute requiredRole="COMPANY" />}>
              <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />
              <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
              <Route path="/company/jobs" element={<JobPostingsPage />} />
              <Route path="/company/jobs/new" element={<CreateJobPage />} />
              <Route path="/company/jobs/:id/edit" element={<CreateJobPage />} />
              <Route path="/company/jobs/:id/matches" element={<JobMatchesPage />} />
              <Route path="/company/profile" element={<CompanyProfilePage />} />
              <Route path="/company/notifications" element={<CompanyNotificationsPage />} />
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
