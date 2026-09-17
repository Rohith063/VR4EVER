import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Heart,
  Sparkles,
  Calendar,
  GraduationCap,
  Wallet,
  Image,
  StickyNote,
  Copy,
  Check,
  RefreshCw,
  MapPin,
  Battery,
  Camera,
  MessageCircle,
  ArrowRight,
  Clock,
  Compass,
  KeyRound,
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';
import { useAuth } from '../context/AuthContext';
import {
  getQuotesForType,
  getTipsForType,
  getRelationEmoji,
  getRelationLabel,
  getDaysCountedTitle,
} from '../lib/quotes';
import { calculateDistance, calculateRelationshipTime } from '../lib/utils';

interface HomePageProps {
  onOpenChat: () => void;
  onOpenLocation: () => void;
  onOpenCamera: () => void;
  onOpenRequests: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenChat,
  onOpenLocation,
  onOpenCamera,
  onOpenRequests,
}) => {
  const { profile } = useAuth();
  const {
    relationship,
    partnerProfile,
    isPartnerOnline,
    partnerLocation,
    myLocation,
    pairCode,
  } = useRelationship();

  const relationType = relationship?.relation_type || 'couple';
  const quotes = getQuotesForType(relationType);
  const tips = getTipsForType(relationType);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [copiedPairCode, setCopiedPairCode] = useState(false);
  const [loveSent, setLoveSent] = useState(false);

  // Time calculations
  const time = relationship?.start_date
    ? calculateRelationshipTime(relationship.start_date)
    : { years: 0, months: 0, days: 1, totalDays: 1 };

  const partnerName =
    relationship?.custom_nickname_2 || partnerProfile?.display_name || 'Partner';

  const distanceKm =
    myLocation && partnerLocation && partnerLocation.is_sharing
      ? calculateDistance(
          myLocation.latitude,
          myLocation.longitude,
          partnerLocation.latitude,
          partnerLocation.longitude
        )
      : null;

  useEffect(() => {
    // Pick daily quote & tip based on day of month
    const day = new Date().getDate();
    setQuoteIndex(day % quotes.length);
    setTipIndex(day % tips.length);
  }, [quotes.length, tips.length]);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(quotes[quoteIndex]);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const handleSendLove = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f43f5e', '#ec4899', '#f59e0b', '#fbbf24'],
    });
    setLoveSent(true);
    setTimeout(() => setLoveSent(false), 3000);
  };

  // Next milestone calculation
  const nextMilestones = [50, 100, 200, 365, 500, 730, 1000];
  const nextTarget = nextMilestones.find((m) => m > time.totalDays) || time.totalDays + 100;
  const daysToNext = nextTarget - time.totalDays;
  const prevTarget = nextMilestones.filter((m) => m <= time.totalDays).pop() || 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((time.totalDays - prevTarget) / (nextTarget - prevTarget)) * 100))
  );

  return (
    <div className="space-y-8 pb-20 pt-4">
      {/* Hero Section */}
      {!relationship ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-amber-500/20 bg-gradient-to-b from-amber-500/15 via-black/40 to-black/60 shadow-2xl"
        >
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Welcome to 4EVER</span>
              </div>

              <div>
                <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
                  Build Your Relationship Space
                </h1>
                <p className="text-white/70 text-sm sm:text-base mt-2 leading-relaxed">
                  Welcome, <span className="text-amber-300 font-semibold">{profile?.display_name || 'Friend'}</span>! Connect with your partner, best friend, or sibling to unlock live chat, video calling, shared calendar, budget splitting, and memories.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <Link
                  to="/onboarding"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-black" />
                  <span>Add / Build Relationship</span>
                </Link>

                <button
                  type="button"
                  onClick={onOpenRequests}
                  className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>Enter Partner&apos;s Code</span>
                </button>
              </div>
            </div>

            {/* Quick Share Card */}
            <div className="w-full md:w-80 glass-card rounded-2xl border border-white/15 p-6 shadow-xl space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto border border-amber-500/30 font-serif font-bold text-xl">
                4E
              </div>
              <h4 className="text-sm font-semibold text-white">Your Pair Invite Code</h4>
              <p className="text-xs text-white/50">
                Share this code with your partner to pair instantly:
              </p>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-2xl font-bold tracking-widest text-amber-300 select-all">
                {pairCode || '4EVR01'}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pairCode || '4EVR01');
                  setCopiedPairCode(true);
                  setTimeout(() => setCopiedPairCode(false), 2000);
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedPairCode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Code Copied! Send to Partner</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Invite Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.section>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-white/10 bg-gradient-to-b from-amber-500/10 via-black/40 to-black/60 shadow-2xl"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                <span>{getRelationEmoji(relationType)}</span>
                <span>{getRelationLabel(relationType)} Space</span>
              </div>

              <div>
                <h1 className="font-serif text-4xl sm:text-6xl font-black tracking-tight text-white">
                  <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                    {time.totalDays}
                  </span>{' '}
                  <span className="text-white/90 text-3xl sm:text-5xl font-light">
                    {getDaysCountedTitle(relationType)}
                  </span>
                </h1>
                <p className="text-white/60 text-sm sm:text-base mt-2">
                  Since {relationship?.start_date ? new Date(relationship.start_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'today'} • {time.years > 0 ? `${time.years}y ` : ''}{time.months > 0 ? `${time.months}m ` : ''}{time.days}d
                </p>
              </div>

              {/* Quick action pill row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                <button
                  onClick={handleSendLove}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-950/40"
                >
                  <Heart className={`w-4 h-4 ${loveSent ? 'fill-rose-400 text-rose-400 scale-125' : 'text-rose-400'}`} />
                  <span>{loveSent ? 'Love Sent! 💖' : 'Send Hug & Love'}</span>
                </button>

                <button
                  onClick={onOpenChat}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-amber-300" />
                  <span>Open Chat</span>
                </button>

                <button
                  onClick={onOpenCamera}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  <span>Take Memory</span>
                </button>
              </div>
            </div>

            {/* Partner Live Card */}
            <div className="w-full md:w-80 glass-card rounded-2xl border border-white/15 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-medium text-white/50">Partner Live Status</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPartnerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'
                    }`}
                  />
                  <span className="text-xs text-white/70 font-medium">
                    {isPartnerOnline ? 'Active Now' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-amber-300/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-serif text-lg font-bold">
                  {partnerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white truncate">{partnerName}</h4>
                  <p className="text-xs text-white/40">
                    {profile?.display_name ? `Paired with ${profile.display_name}` : 'Paired Space'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <button
                  onClick={onOpenLocation}
                  className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex flex-col gap-1 text-left hover:bg-black/50 transition-colors"
                >
                  <span className="text-[10px] text-white/40 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> Distance
                  </span>
                  <span className="font-semibold text-white/90">
                    {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : 'Share location'}
                  </span>
                </button>

                <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-white/40 flex items-center gap-1">
                    <Battery className="w-3 h-3 text-emerald-400" /> Battery
                  </span>
                  <span className="font-semibold text-white/90">
                    {partnerLocation?.battery_level !== undefined
                      ? `${partnerLocation.battery_level}%`
                      : 'Synced'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Daily Quote & Tip Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Curated Quote */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl border border-white/10 p-6 flex flex-col justify-between relative shadow-lg group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-300/80 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Words of Affection
              </span>
              <span className="text-[10px] text-white/30">
                #{quoteIndex + 1} of {quotes.length}
              </span>
            </div>
            <p className="font-serif italic text-base sm:text-lg text-white/90 leading-relaxed">
              &ldquo;{quotes[quoteIndex]}&rdquo;
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
            <button
              onClick={handleNextQuote}
              className="text-xs text-white/60 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Another Quote
            </button>
            <button
              onClick={handleCopyQuote}
              className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedQuote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedQuote ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </motion.div>

        {/* Milestone Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl border border-white/10 p-6 flex flex-col justify-between shadow-lg"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-300/80 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Next Big Milestone
              </span>
              <span className="text-white/50">{daysToNext} days away</span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                {nextTarget} Days Milestone
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                You are {progressPercent}% of the way to celebrating day {nextTarget}!
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-white/40">
                <span>{prevTarget}d</span>
                <span className="font-semibold text-amber-300">{time.totalDays} days</span>
                <span>{nextTarget}d</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 text-xs text-white/60 italic flex items-center gap-2">
            <span>💡 Tip:</span>
            <span>{tips[tipIndex]}</span>
          </div>
        </motion.div>
      </div>

      {/* Features Quick-Launch Grid */}
      <section className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" /> Space Modules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/calendar"
            className="glass-card rounded-2xl border border-white/10 p-5 hover:border-amber-400/40 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white text-sm">Calendar & Dates</h4>
              <p className="text-xs text-white/50 mt-1">
                Track college exams, romantic dates, hangouts, and anniversary reminders.
              </p>
            </div>
          </Link>

          <Link
            to="/study"
            className="glass-card rounded-2xl border border-white/10 p-5 hover:border-amber-400/40 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-blue-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white text-sm">Study Planner</h4>
              <p className="text-xs text-white/50 mt-1">
                Set daily focus goals, shared study tasks, and motivate each other.
              </p>
            </div>
          </Link>

          <Link
            to="/budget"
            className="glass-card rounded-2xl border border-white/10 p-5 hover:border-amber-400/40 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white text-sm">Budget & Splitter</h4>
              <p className="text-xs text-white/50 mt-1">
                Visual charts, fair expense settlement, and monthly budget protection.
              </p>
            </div>
          </Link>

          <Link
            to="/memories"
            className="glass-card rounded-2xl border border-white/10 p-5 hover:border-amber-400/40 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                <Image className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white text-sm">Memory Journal</h4>
              <p className="text-xs text-white/50 mt-1">
                Save photos, anniversary milestones, and dream trip bucket lists.
              </p>
            </div>
          </Link>

          <Link
            to="/notes"
            className="glass-card rounded-2xl border border-white/10 p-5 hover:border-amber-400/40 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-300 group-hover:scale-105 transition-transform">
                <StickyNote className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-rose-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white text-sm">Sticky Notes</h4>
              <p className="text-xs text-white/50 mt-1">
                Leave cute colorful love notes, reminders, and pinned secret messages.
              </p>
            </div>
          </Link>

          <div
            onClick={onOpenRequests}
            className="glass-card rounded-2xl border border-white/10 p-5 hover:border-amber-400/40 transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white text-sm">Pair Code & Requests</h4>
              <p className="text-xs text-white/50 mt-1">
                Share invite codes, add friends by username, and accept partner requests.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
