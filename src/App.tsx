import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Heart } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RelationshipProvider, useRelationship } from './context/RelationshipContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLockProvider } from './context/AppLockContext';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ChatDrawer } from './components/ChatDrawer';
import { LocationModal } from './components/LocationModal';
import { CameraModal } from './components/CameraModal';
import { RequestsModal } from './components/RequestsModal';
import { AppLockModal } from './components/AppLockModal';

import { HomePage } from './pages/HomePage';
import { CalendarPage } from './pages/CalendarPage';
import { StudyPage } from './pages/StudyPage';
import { BudgetPage } from './pages/BudgetPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { NotesPage } from './pages/NotesPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const AppLayout: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: relLoading } = useRelationship();
  const location = useLocation();

  // Modals state
  const [chatOpen, setChatOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);

  // Loading spinner
  if (authLoading || relLoading) {
    return (
      <div className="min-h-screen bg-[#0c0d11] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 animate-pulse shadow-xl shadow-amber-500/20">
          <Heart className="w-7 h-7 fill-amber-300" />
        </div>
        <p className="text-xs text-white/50 tracking-widest font-serif uppercase">
          Loading 4EVER...
        </p>
      </div>
    );
  }

  // Allow admin and auth routes anytime
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Not logged in -> redirect to auth (unless admin)
  if (!user && location.pathname !== '/auth' && !isAdminRoute) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but at /auth -> redirect to home dashboard
  if (user && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="min-h-screen bg-[#0c0d11] text-white flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Couple Passcode Lock Screen (if enabled) */}
      <AppLockModal />

      {/* Global Navbar */}
      {!isAuthPage && (
        <Navbar
          onOpenChat={() => setChatOpen(true)}
          onOpenLocation={() => setLocationOpen(true)}
          onOpenCamera={() => setCameraOpen(true)}
          onOpenRequests={() => setRequestsOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${!isAuthPage ? 'max-w-7xl w-full mx-auto px-4 sm:px-6' : ''}`}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />

          <Route
            path="/"
            element={
              <HomePage
                onOpenChat={() => setChatOpen(true)}
                onOpenLocation={() => setLocationOpen(true)}
                onOpenCamera={() => setCameraOpen(true)}
                onOpenRequests={() => setRequestsOpen(true)}
              />
            }
          />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/memories" element={<MemoriesPage />} />
          <Route path="/notes" element={<NotesPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      {!isAuthPage && <BottomNav />}

      {/* Global Modals */}
      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onOpenCamera={() => {
          setChatOpen(false);
          setCameraOpen(true);
        }}
        onOpenLocation={() => {
          setChatOpen(false);
          setLocationOpen(true);
        }}
      />
      <LocationModal isOpen={locationOpen} onClose={() => setLocationOpen(false)} />
      <CameraModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onPhotoCaptured={() => {
          setCameraOpen(false);
          setChatOpen(true);
        }}
      />
      <RequestsModal isOpen={requestsOpen} onClose={() => setRequestsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppLockProvider>
        <AuthProvider>
          <RelationshipProvider>
            <Router>
              <AppLayout />
            </Router>
          </RelationshipProvider>
        </AuthProvider>
      </AppLockProvider>
    </ThemeProvider>
  );
}
