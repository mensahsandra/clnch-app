import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import NavSidebar from './components/NavSidebar';
import FastCaptureFAB from './components/FastCaptureFAB';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ChatsPage from './pages/ChatsPage';
import DiscoverPage from './pages/DiscoverPage';
import SettingsPage from './pages/SettingsPage';
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

      {/* Global floating action button */}
      <FastCaptureFAB />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SidebarProvider>
          <OpportunitiesProvider>
            <MonitoringProvider>
              <FastCaptureProvider>
                <WorkspaceProvider>
                  <Layout />
                </WorkspaceProvider>
              </FastCaptureProvider>
            </MonitoringProvider>
          </OpportunitiesProvider>
        </SidebarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
