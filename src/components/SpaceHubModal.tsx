import React from 'react';
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
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';

interface SpaceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpaceHubModal: React.FC<SpaceHubModalProps> = ({ isOpen, onClose }) => {
  const { relationship } = useRelationship();

  if (!isOpen) return null;

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
      desc: 'PIN passcode, storage & 2FA',
      path: '/settings',
      icon: Settings,
      color: 'from-zinc-500/20 to-zinc-600/10 text-zinc-300 border-zinc-500/30',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card w-full max-w-lg rounded-3xl border border-white/15 shadow-2xl p-6 space-y-6"
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
                    ? `Connected in a ${relationship.relation_type} space`
                    : 'Shared tools for love, growth & planning'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr border flex items-center justify-center shadow-md ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">{item.desc}</p>
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
