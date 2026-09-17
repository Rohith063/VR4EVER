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
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ChatDrawer } from './components/ChatDrawer';
import { LocationModal } from './components/LocationModal';
import { CameraModal } from './components/CameraModal';
import { RequestsModal } from './components/RequestsModal';

import { HomePage } from './pages/HomePage';
import { CalendarPage } from './pages/CalendarPage';
import { StudyPage } from './pages/StudyPage';
import { BudgetPage } from './pages/BudgetPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { NotesPage } from './pages/NotesPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';

const AppLayout: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { relationship, loading: relLoading } = useRelationship();
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

  // Not logged in -> redirect to auth
  if (!user && location.pathname !== '/auth') {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but at /auth -> redirect to home or onboarding
  if (user && location.pathname === '/auth') {
    return <Navigate to={relationship ? '/' : '/onboarding'} replace />;
  }

  // No active relationship and not on onboarding -> redirect to onboarding
  if (user && !relationship && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  const isAuthOrOnboarding =
    location.pathname === '/auth' || location.pathname === '/onboarding';

  return (
    <div className="min-h-screen bg-[#0c0d11] text-white flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Global Navbar */}
      {!isAuthOrOnboarding && (
        <Navbar
          onOpenChat={() => setChatOpen(true)}
          onOpenLocation={() => setLocationOpen(true)}
          onOpenCamera={() => setCameraOpen(true)}
          onOpenRequests={() => setRequestsOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${!isAuthOrOnboarding ? 'max-w-7xl w-full mx-auto px-4 sm:px-6' : ''}`}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

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
      {!isAuthOrOnboarding && <BottomNav />}

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
    <AuthProvider>
      <RelationshipProvider>
        <Router>
          <AppLayout />
        </Router>
      </RelationshipProvider>
    </AuthProvider>
  );
}
