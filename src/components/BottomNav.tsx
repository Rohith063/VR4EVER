import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Heart,
  Calendar,
  GraduationCap,
  Wallet,
  Image,
  StickyNote,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { pathname } = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Heart },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Study', path: '/study', icon: GraduationCap },
    { name: 'Budget', path: '/budget', icon: Wallet },
    { name: 'Memories', path: '/memories', icon: Image },
    { name: 'Notes', path: '/notes', icon: StickyNote },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0d11]/90 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all relative ${
              isActive
                ? 'text-amber-300 font-semibold'
                : 'text-white/45 hover:text-white/80'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2px]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            {isActive && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-amber-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
