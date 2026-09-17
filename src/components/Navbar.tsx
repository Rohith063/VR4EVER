import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Heart,
  Camera,
  MapPin,
  MessageCircle,
  Users,
  Calendar,
  GraduationCap,
  Wallet,
  Image,
  StickyNote,
  LogOut,
  Sparkles,
  ChevronDown,
  Sun,
  Moon,
  Settings as SettingsIcon,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';
import { useTheme } from '../context/ThemeContext';
import { calculateDistance, calculateRelationshipTime } from '../lib/utils';

interface NavbarProps {
  onOpenChat: () => void;
  onOpenLocation: () => void;
  onOpenCamera: () => void;
  onOpenRequests: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenChat,
  onOpenLocation,
  onOpenCamera,
  onOpenRequests,
}) => {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    relationship,
    partnerProfile,
    isPartnerOnline,
    partnerLocation,
    myLocation,
    incomingRequests,
    disconnectRelationship,
  } = useRelationship();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Compute live distance if both have shared coordinates
  const distanceKm =
    myLocation && partnerLocation && partnerLocation.is_sharing
      ? calculateDistance(
          myLocation.latitude,
          myLocation.longitude,
          partnerLocation.latitude,
          partnerLocation.longitude
        )
      : null;

  const partnerName =
    relationship?.custom_nickname_2 || partnerProfile?.display_name || 'Partner';

  const timeTogether = relationship?.start_date
    ? calculateRelationshipTime(relationship.start_date)
    : null;

  const navLinks = [
    { name: 'Home', path: '/', icon: Heart },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Study', path: '/study', icon: GraduationCap },
    { name: 'Budget', path: '/budget', icon: Wallet },
    { name: 'Memories', path: '/memories', icon: Image },
    { name: 'Notes', path: '/notes', icon: StickyNote },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0c0d11]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Relationship Info */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/30 to-amber-300/10 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform shadow-lg shadow-amber-500/10">
              <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
            </div>
            <span className="font-serif text-xl tracking-wider font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
              4EVER
            </span>
          </Link>

          {relationship && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-white/70 capitalize">
                {relationship.relation_type}
              </span>
              {timeTogether && (
                <span className="text-xs text-amber-400/90 font-medium">
                  {timeTogether.days}d together
                </span>
              )}
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-white/40'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Tools & Partner Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Partner status capsule (if paired) */}
          {relationship && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
              <div className="relative flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center text-[10px] font-bold uppercase">
                  {partnerName.slice(0, 2)}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0c0d11] ${
                    isPartnerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'
                  }`}
                  title={isPartnerOnline ? 'Online now' : 'Offline'}
                />
              </div>

              <span className="font-medium text-white/90 max-w-[90px] truncate">
                {partnerName}
              </span>

              {distanceKm !== null && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                  {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
                </span>
              )}
            </div>
          )}

          {/* Quick Action Tools */}
          <button
            onClick={onOpenChat}
            title="Open Chat"
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenLocation}
            title="Live Location"
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95"
          >
            <MapPin className="w-4 h-4" />
            {partnerLocation?.is_sharing && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={onOpenCamera}
            title="Camera & Filters"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenRequests}
            title="Pairing & Requests"
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95"
          >
            <Users className="w-4 h-4" />
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                {incomingRequests.length}
              </span>
            )}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Settings Link */}
          <Link
            to="/settings"
            title="Settings & Privacy"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95 hidden sm:flex"
          >
            <SettingsIcon className="w-4 h-4" />
          </Link>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 sm:px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-black font-bold flex items-center justify-center text-[11px] uppercase">
                {profile?.display_name?.slice(0, 1) || 'U'}
              </div>
              <ChevronDown className="w-3 h-3 text-white/50 hidden sm:block" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card border border-white/15 shadow-2xl p-2 z-50 space-y-1 text-xs">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="font-semibold text-white truncate">
                      {profile?.display_name || 'Guest User'}
                    </p>
                    <p className="text-[11px] text-white/40 truncate">
                      @{profile?.username || 'user'}
                    </p>
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 transition-colors"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Settings & Privacy Lock</span>
                  </Link>

                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-amber-300 font-medium transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Staff Admin Portal</span>
                  </Link>

                  <Link
                    to="/onboarding"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Manage Space & Code</span>
                  </Link>

                  {relationship && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        if (confirm('Disconnect from current partner space?')) {
                          disconnectRelationship();
                        }
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-300 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Leave Space</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors border-t border-white/10 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
