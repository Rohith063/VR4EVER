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
import { SocialProvider, useSocial } from './context/SocialContext';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AppLockModal } from './components/AppLockModal';
import { SpaceHubModal } from './components/SpaceHubModal';
import { DirectMessagesModal } from './components/DirectMessagesModal';
import { NotificationsModal } from './components/NotificationsModal';
import { UserProfileModal } from './components/UserProfileModal';

import { HomePage } from './pages/HomePage';
import { FeedsPage } from './pages/FeedsPage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
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
  const { setIsMessagesOpen, setIsNotificationsOpen } = useSocial();
  const location = useLocation();

  const [hubOpen, setHubOpen] = useState(false);

  // Allow admin and auth routes anytime
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Loading spinner
  if ((authLoading || relLoading) && !isAdminRoute) {
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
    <div
      className={`min-h-screen flex flex-col selection:bg-amber-500/30 selection:text-amber-200 ${
        isAdminRoute ? 'bg-[#101217]' : 'app-container bg-[#0c0d11] text-white'
      }`}
    >
      {/* Couple Passcode Lock Screen (if enabled) */}
      {!isAdminRoute && <AppLockModal />}

      {/* Global Navbar */}
      {!isAuthPage && !isAdminRoute && (
        <Navbar onOpenHub={() => setHubOpen(true)} />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 ${
          !isAuthPage && !isAdminRoute ? 'max-w-7xl w-full mx-auto px-4 sm:px-6 pb-24 lg:pb-8' : ''
        }`}
      >
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />

          <Route
            path="/"
            element={
              <HomePage
                onOpenChat={() => setIsMessagesOpen(true)}
                onOpenLocation={() => setHubOpen(true)}
                onOpenCamera={() => {}}
                onOpenRequests={() => setIsNotificationsOpen(true)}
              />
            }
          />
          <Route path="/feeds" element={<FeedsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/memories" element={<MemoriesPage />} />
          <Route path="/notes" element={<NotesPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      {!isAuthPage && !isAdminRoute && <BottomNav onOpenHub={() => setHubOpen(true)} />}

      {/* Global Space Hub Launcher Modal */}
      <SpaceHubModal isOpen={hubOpen} onClose={() => setHubOpen(false)} />

      {/* Direct Messages Modal (Instagram DMs) */}
      <DirectMessagesModal />

      {/* In-App Notifications Modal */}
      <NotificationsModal />

      {/* Full Instagram-style Friend / User Profile Modal */}
      <UserProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppLockProvider>
        <AuthProvider>
          <RelationshipProvider>
            <SocialProvider>
              <Router>
                <AppLayout />
              </Router>
            </SocialProvider>
          </RelationshipProvider>
        </AuthProvider>
      </AppLockProvider>
    </ThemeProvider>
  );
}
