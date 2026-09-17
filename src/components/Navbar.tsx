import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Bell,
  Search,
  LayoutGrid,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';
import { useSocial } from '../context/SocialContext';
import { calculateRelationshipTime } from '../lib/utils';

interface NavbarProps {
  onOpenHub?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHub }) => {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();
  const { relationship, partnerProfile, isPartnerOnline } = useRelationship();
  const {
    unreadNotificationsCount,
    unreadMessagesCount,
    setIsNotificationsOpen,
    setIsMessagesOpen,
  } = useSocial();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const partnerName =
    relationship?.custom_nickname_2 || partnerProfile?.display_name || 'Partner';

  const timeTogether = relationship?.start_date
    ? calculateRelationshipTime(relationship.start_date)
    : null;

  const navLinks = [
    { name: 'Home', path: '/', icon: Heart },
    { name: 'Feeds', path: '/feeds', icon: Sparkles },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0c0d11]/90 backdrop-blur-xl">
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

          {relationship ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 fill-rose-300" />
                <span>{relationship.relation_type}</span>
              </span>
              {timeTogether && (
                <span className="text-xs text-amber-400/90 font-medium">
                  {timeTogether.days}d together
                </span>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
              <Link
                to="/search"
                className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Find Someone</span>
              </Link>
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
          {onOpenHub && (
            <button
              type="button"
              onClick={onOpenHub}
              className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-white/40" />
              <span>Space Hub</span>
            </button>
          )}
        </nav>

        {/* Right Tools (Clean Instagram Style: Notifications, DMs & Profile) */}
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
            </div>
          )}

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            title="Notifications"
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce shadow-md shadow-rose-500/40">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Direct Messages Icon */}
          <button
            type="button"
            onClick={() => setIsMessagesOpen(true)}
            title="Direct Messages"
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center shadow-md shadow-amber-500/40">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 sm:px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-amber-400 to-amber-600 text-black font-bold flex items-center justify-center text-[11px] uppercase ring-1 ring-white/20">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                ) : (
                  profile?.display_name?.slice(0, 1) || 'U'
                )}
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
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 transition-colors"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Settings & Appearance</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors border-t border-white/10 pt-2 cursor-pointer"
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
