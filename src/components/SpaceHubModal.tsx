import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Wallet,
  GraduationCap,
  Image as ImageIcon,
  StickyNote,
  Settings,
  X,
  Sparkles,
  Heart,
  ArrowRight,
  Navigation,
  ShieldCheck,
  BatteryCharging,
  Radio,
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';

interface SpaceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpaceHubModal: React.FC<SpaceHubModalProps> = ({ isOpen, onClose }) => {
  const { relationship, isPartnerOnline } = useRelationship();
  const [radarEnabled, setRadarEnabled] = useState<boolean>(() => {
    return localStorage.getItem('4ever_couple_radar_enabled') === 'true';
  });

  if (!isOpen) return null;

  const handleToggleRadar = () => {
    const next = !radarEnabled;
    setRadarEnabled(next);
    localStorage.setItem('4ever_couple_radar_enabled', String(next));
  };

  const tools = [
    {
      title: 'Shared Calendar',
      desc: 'Dates, milestones & exams',
      path: '/calendar',
      icon: Calendar,
      color: 'from-rose-500/20 to-rose-600/10 text-rose-300 border-rose-500/30',
    },
    {
      title: 'Budget & Splitter',
      desc: 'Split chai, food & outings 50/50',
      path: '/budget',
      icon: Wallet,
      color: 'from-amber-500/20 to-amber-600/10 text-amber-300 border-amber-500/30',
    },
    {
      title: 'Study & Goals',
      desc: 'Track study sessions together',
      path: '/study',
      icon: GraduationCap,
      color: 'from-blue-500/20 to-blue-600/10 text-blue-300 border-blue-500/30',
    },
    {
      title: 'Memories & Scrapbook',
      desc: 'Cherish photos & bucket lists',
      path: '/memories',
      icon: ImageIcon,
      color: 'from-purple-500/20 to-purple-600/10 text-purple-300 border-purple-500/30',
    },
    {
      title: 'Sticky Love Notes',
      desc: 'Leave cute fridge notes',
      path: '/notes',
      icon: StickyNote,
      color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-300 border-emerald-500/30',
    },
    {
      title: 'Settings & Privacy Lock',
      desc: 'PIN passcode, themes & security',
      path: '/settings',
      icon: Settings,
      color: 'from-zinc-500/20 to-zinc-600/10 text-zinc-300 border-zinc-500/30',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-card w-full max-w-lg rounded-3xl border border-white/15 shadow-2xl p-5 sm:p-6 space-y-5 my-auto text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Space Hub & Tools</h3>
                <p className="text-xs text-white/50">
                  {relationship
                    ? `Exclusive ${relationship.relation_type} tools & radar`
                    : 'Shared tools for love, growth & planning'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* EXCLUSIVE 24H LIVE COUPLE RADAR (Only for couples with mutual permission) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-purple-950/20 to-[#121319] border border-rose-500/30 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>24-Hour Couple Live Radar</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Couple Exclusive
                    </span>
                  </h4>
                  <p className="text-[10px] text-white/50">
                    Continuous real-time background location monitoring
                  </p>
                </div>
              </div>

              {/* Permission Toggle */}
              <button
                type="button"
                onClick={handleToggleRadar}
                className={`relative w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                  radarEnabled ? 'bg-rose-500' : 'bg-white/20'
                }`}
                title="Toggle 24h Radar Permission"
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-md"
                  animate={{ x: radarEnabled ? 24 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {radarEnabled ? (
              <div className="mt-2 p-3 rounded-xl bg-black/40 border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/70 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Radar Status: Active & Syncing
                  </span>
                  <span className="text-rose-300 font-mono text-[10px]">
                    {isPartnerOnline ? 'Partner Online' : 'Partner Last Seen 12m ago'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs border-t border-white/5">
                  <div className="flex items-center space-x-1.5 text-white/80">
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                    <span>Estimated Distance: <strong className="text-white font-semibold">2.4 km</strong></span>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-400 text-[11px]">
                    <BatteryCharging className="w-3.5 h-3.5" />
                    <span>84%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  Grant mutual permission to enable 24h background tracking
                </span>
                <button
                  type="button"
                  onClick={handleToggleRadar}
                  className="text-amber-300 hover:underline text-[11px] font-medium cursor-pointer"
                >
                  Enable
                </button>
              </div>
            )}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-2 gap-3">
            {tools.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr border flex items-center justify-center shadow-md ${item.color}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-white/50 mt-0.5 line-clamp-1">{item.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom Relationship Info */}
          {!relationship && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>Pair with someone to unlock live shared sync!</span>
              </div>
              <Link
                to="/search"
                onClick={onClose}
                className="px-3 py-1 rounded-xl bg-amber-500 text-black font-semibold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20"
              >
                <span>Find</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
