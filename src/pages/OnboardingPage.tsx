import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Heart,
  Sparkles,
  Users,
  Copy,
  Check,
  ArrowRight,
  KeyRound,
  Calendar,
  AlertCircle,
  Home,
  UserCheck,
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';
import { useAuth } from '../context/AuthContext';
import type { RelationshipType } from '../types';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    relationship,
    pairCode,
    createSpace,
    joinSpaceWithCode,
    disconnectRelationship,
  } = useRelationship();

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [partnerName, setPartnerName] = useState('');
  const [relationType, setRelationType] = useState<RelationshipType>('couple');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      setErrorMsg("Please enter your partner's name or nickname");
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      await createSpace(relationType, partnerName.trim(), startDate);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#f43f5e', '#ec4899'],
      });
      setJustCreated(true);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim().length !== 6) {
      setErrorMsg('Pair code must be exactly 6 characters');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await joinSpaceWithCode(joinCodeInput.trim().toUpperCase());
      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
        setTimeout(() => navigate('/'), 1200);
      } else {
        setErrorMsg(res.error || 'Failed to join space with this code');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!pairCode) return;
    navigator.clipboard.writeText(pairCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0c0d11] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* If user already has an active space and just visited onboarding */}
        {relationship && !justCreated ? (
          <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-300 shadow-xl shadow-amber-500/15">
              <UserCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-white">
                You&apos;re already connected!
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Connected with <span className="text-amber-300 font-semibold">{relationship.custom_nickname_2 || 'Partner'}</span> in a <span className="capitalize">{relationship.relation_type}</span> space.
              </p>
            </div>

            {pairCode && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-xs text-white/50 block">Your Space Pair Code</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-2xl font-bold tracking-widest text-amber-300">
                    {pairCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Home className="w-4 h-4" /> Go to Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to disconnect from this space?')) {
                    disconnectRelationship();
                  }
                }}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-white/60 hover:text-rose-300 text-sm font-medium transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : justCreated ? (
          /* Success Screen after Space Creation */
          <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-300 shadow-xl shadow-emerald-500/20">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Space Created Successfully!
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Share this Pair Code with your partner so they can join your universe.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
              <span className="text-xs uppercase tracking-widest text-amber-400/80 font-bold">
                Pairing Code
              </span>
              <div className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-amber-300 select-all">
                {pairCode}
              </div>
              <p className="text-xs text-white/40">
                They can enter this code in 4EVER to sync both accounts instantly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <span>Enter Space</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Onboarding Flow (Create or Join) */
          <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-lg shadow-amber-500/10 mb-1">
                <Heart className="w-6 h-6 fill-amber-300 text-amber-300" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                Connect Your Space
              </h2>
              <p className="text-xs text-white/50">
                Welcome, {profile?.display_name || 'Friend'}! Set up your space to get started.
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'create'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Create New Space
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('join');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'join'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Join with Pair Code
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    What type of relationship is this?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'couple', label: 'Couple', icon: Heart },
                        { id: 'bestfriends', label: 'Besties', icon: Sparkles },
                        { id: 'siblings', label: 'Siblings', icon: Users },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      const isSelected = relationType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRelationType(item.id)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                              : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-white/40'}`} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Partner / Friend&apos;s Name or Nickname
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g. Ananya or Sweetheart"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Special Date (Anniversary / Since)</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Creating space...' : 'Create Our Universe'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Enter Partner&apos;s 6-Character Pair Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      maxLength={6}
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. 7X9K2P"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-mono tracking-widest text-lg font-bold text-center uppercase focus:outline-none focus:border-amber-400/50"
                    />
                  </div>
                  <p className="text-[11px] text-white/40 mt-1.5 text-center">
                    Ask your partner for their 6-letter code from their 4EVER screen.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Connecting...' : 'Connect to Space'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
