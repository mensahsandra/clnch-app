import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import NavSidebar from './components/NavSidebar';
import FastCaptureFAB from './components/FastCaptureFAB';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ChatsPage from './pages/ChatsPage';
import DiscoverPage from './pages/DiscoverPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import OnboardingWizard from './pages/OnboardingWizard';
import SpotlightTour from './components/SpotlightTour';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { OpportunitiesProvider } from './context/OpportunitiesContext';
import { FastCaptureProvider } from './context/FastCaptureContext';
import { MonitoringProvider } from './context/MonitoringContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';

function Layout() {
  const location = useLocation();
  const { width } = useSidebar();
  const isChatPage = location.pathname.startsWith('/chat/');

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <NavSidebar />
      <div
        className="flex-1 min-w-0 flex flex-col overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        {isChatPage ? (
          <Routes>
            <Route path="/chat/:id" element={<ChatPage />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<HomePage filterMode="all" />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/applied" element={<HomePage filterMode="applied" />} />
            <Route path="/pending" element={<HomePage filterMode="pending" />} />
            <Route path="/history" element={<HomePage filterMode="history" />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        )}
      </div>
      <FastCaptureFAB />
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { completed, loading: onboardingLoading } = useOnboarding();

  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  if (!completed) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/auth" element={<Navigate to="/onboarding" replace />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="/*" element={<Layout />} />
      </Routes>
      <SpotlightTour />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <OnboardingProvider>
            <SidebarProvider>
              <OpportunitiesProvider>
                <MonitoringProvider>
                  <FastCaptureProvider>
                    <WorkspaceProvider>
                      <AppRoutes />
                    </WorkspaceProvider>
                  </FastCaptureProvider>
                </MonitoringProvider>
              </OpportunitiesProvider>
            </SidebarProvider>
          </OnboardingProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
