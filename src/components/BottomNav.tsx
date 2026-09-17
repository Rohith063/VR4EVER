import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Heart,
  Sparkles,
  Search,
  LayoutGrid,
  User,
} from 'lucide-react';

interface BottomNavProps {
  onOpenHub?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenHub }) => {
  const { pathname } = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Heart },
    { name: 'Feeds', path: '/feeds', icon: Sparkles },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Hub', path: '#hub', icon: LayoutGrid, isAction: true },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-[#0c0d11]/90 backdrop-blur-xl border-t border-white/10 px-3 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = !item.isAction && pathname === item.path;

        if (item.isAction) {
          return (
            <button
              key={item.name}
              type="button"
              onClick={onOpenHub}
              className="flex flex-col items-center py-1 px-3 rounded-xl text-white/55 hover:text-amber-300 transition-all cursor-pointer"
            >
              <Icon className="w-5 h-5 stroke-2" />
              <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            </button>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
              isActive
                ? 'text-amber-300 font-semibold'
                : 'text-white/55 hover:text-white/90'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3px]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            {isActive && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
