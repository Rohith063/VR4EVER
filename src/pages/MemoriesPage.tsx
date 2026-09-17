import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  X,
  Target,
  Plane,
  Upload,
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatINR } from '../lib/utils';
import type { Memory, Goal } from '../types';

const LOCAL_STORAGE_MEMORIES = '4ever_memories_v1';
const LOCAL_STORAGE_GOALS = '4ever_goals_v1';

export const MemoriesPage: React.FC = () => {
  const { relationship } = useRelationship();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'memories' | 'goals'>('memories');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Modals
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  // New Memory form
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [tag, setTag] = useState('date');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [locationName, setLocationName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // New Goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  // Load memories & goals
  const loadData = useCallback(async () => {
    try {
      const storedM = localStorage.getItem(LOCAL_STORAGE_MEMORIES);
      if (storedM) setMemories(JSON.parse(storedM));
      const storedG = localStorage.getItem(LOCAL_STORAGE_GOALS);
      if (storedG) setGoals(JSON.parse(storedG));
    } catch {
      // ignore
    }

    if (relationship?.id) {
      try {
        const { data: memData } = await supabase
          .from('memories')
          .select('*')
          .eq('relationship_id', relationship.id)
          .order('memory_date', { ascending: false });

        if (memData && memData.length > 0) {
          setMemories(memData as Memory[]);
          localStorage.setItem(LOCAL_STORAGE_MEMORIES, JSON.stringify(memData));
        }

        const { data: goalData } = await supabase
          .from('goals')
          .select('*')
          .eq('relationship_id', relationship.id);

        if (goalData && goalData.length > 0) {
          setGoals(goalData as Goal[]);
          localStorage.setItem(LOCAL_STORAGE_GOALS, JSON.stringify(goalData));
        }
      } catch {
        // fallback
      }
    }
  }, [relationship]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveMemories = (updated: Memory[]) => {
    setMemories(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_MEMORIES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const saveGoals = (updated: Goal[]) => {
    setGoals(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_GOALS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Image file handler (reads local image as base64 for instant display and persistence)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMemory: Memory = {
      id: crypto.randomUUID(),
      relationship_id: relationship?.id || 'local_rel',
      created_by: user?.id || 'me',
      title: title.trim(),
      story: story.trim(),
      tag,
      memory_date: memoryDate,
      photos: photoUrl ? [photoUrl] : [],
      location_name: locationName.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    const updated = [newMemory, ...memories];
    saveMemories(updated);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    if (relationship?.id && user) {
      try {
        await supabase.from('memories').insert([newMemory]);
      } catch {
        // ignore
      }
    }

    setTitle('');
    setStory('');
    setPhotoUrl('');
    setLocationName('');
    setMemoryModalOpen(false);
  };

  const handleDeleteMemory = async (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    saveMemories(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('memories').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!goalTitle.trim() || isNaN(target) || target <= 0) return;

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      relationship_id: relationship?.id || 'local_rel',
      title: goalTitle.trim(),
      target_amount: target,
      saved_amount: 0,
      created_at: new Date().toISOString(),
    };

    const updated = [...goals, newGoal];
    saveGoals(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('goals').insert([newGoal]);
      } catch {
        // ignore
      }
    }

    setGoalTitle('');
    setTargetAmount('');
    setGoalModalOpen(false);
  };

  const handleDepositGoal = async (goal: Goal, amount: number) => {
    const updatedAmount = Math.min(goal.target_amount, goal.saved_amount + amount);
    const updated = goals.map((g) =>
      g.id === goal.id ? { ...g, saved_amount: updatedAmount } : g
    );
    saveGoals(updated);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#f59e0b'],
    });

    if (relationship?.id && user) {
      try {
        await supabase
          .from('goals')
          .update({ saved_amount: updatedAmount })
          .eq('id', goal.id);
      } catch {
        // ignore
      }
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    saveGoals(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('goals').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="space-y-8 pb-20 pt-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-2.5">
            <ImageIcon className="w-7 h-7 text-purple-400" />
            <span>Memories & Dream Trips</span>
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Capture precious moments and save up for dream adventures together.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'memories' ? (
            <button
              onClick={() => setMemoryModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Memory
            </button>
          ) : (
            <button
              onClick={() => setGoalModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10 max-w-md">
        <button
          onClick={() => setActiveTab('memories')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'memories'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Journal & Gallery ({memories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'goals'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Plane className="w-4 h-4" />
          <span>Dream Goals ({goals.length})</span>
        </button>
      </div>

      {/* Content: Memories Tab */}
      {activeTab === 'memories' ? (
        memories.length === 0 ? (
          <div className="glass-card rounded-3xl border border-white/10 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">No memories saved yet</h3>
            <p className="text-xs text-white/50 max-w-md mx-auto">
              Save photos from your favorite dates, cafe hangouts, or funny moments so you can reminisce forever.
            </p>
            <button
              onClick={() => setMemoryModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all hover:bg-purple-400"
            >
              <Plus className="w-4 h-4" /> Create First Memory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((mem) => (
              <motion.div
                key={mem.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl flex flex-col justify-between group"
              >
                {mem.photos && mem.photos.length > 0 && (
                  <div
                    onClick={() => setZoomPhoto(mem.photos[0])}
                    className="h-52 w-full bg-black/40 overflow-hidden relative cursor-pointer group"
                  >
                    <img
                      src={mem.photos[0]}
                      alt={mem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-[11px] text-white/80 font-medium">Click to expand</span>
                    </div>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {mem.tag}
                      </span>

                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="text-white/30 hover:text-rose-400 p-1 transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-base font-semibold text-white mt-2">{mem.title}</h3>
                    {mem.story && (
                      <p className="text-xs text-white/60 mt-1 leading-relaxed line-clamp-3">
                        {mem.story}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(mem.memory_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {mem.location_name && (
                      <span className="flex items-center gap-1 text-amber-300/80">
                        <MapPin className="w-3 h-3" />
                        {mem.location_name}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        /* Content: Dream Goals Tab */
        goals.length === 0 ? (
          <div className="glass-card rounded-3xl border border-white/10 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">No dream goals created</h3>
            <p className="text-xs text-white/50 max-w-md mx-auto">
              Plan your next trip to Goa, a weekend staycation, or an anniversary gift together!
            </p>
            <button
              onClick={() => setGoalModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs inline-flex items-center gap-1.5 transition-all hover:bg-amber-400"
            >
              <Plus className="w-4 h-4" /> Add Dream Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const percent = Math.min(
                100,
                Math.round((goal.saved_amount / goal.target_amount) * 100)
              );
              return (
                <div
                  key={goal.id}
                  className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">
                        Bucket List Goal
                      </span>
                      <h3 className="text-base font-semibold text-white mt-1">{goal.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-white/30 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-white font-serif">
                        ₹{formatINR(goal.saved_amount)}
                      </span>
                      <span className="text-xs text-white/40">of ₹{formatINR(goal.target_amount)}</span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-white/50">
                      <span>{percent}% reached</span>
                      <span>₹{formatINR(Math.max(0, goal.target_amount - goal.saved_amount))} to go</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleDepositGoal(goal, 500)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      + Add ₹500
                    </button>
                    <button
                      onClick={() => handleDepositGoal(goal, 1000)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      + Add ₹1,000
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Lightbox photo zoom modal */}
      <AnimatePresence>
        {zoomPhoto && (
          <div
            onClick={() => setZoomPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={zoomPhoto}
              alt="Memory Zoom"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        )}
      </AnimatePresence>

      {/* Add Memory Modal */}
      <AnimatePresence>
        {memoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">Save Memory</h3>
                <button
                  onClick={() => setMemoryModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMemory} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Memory Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Rainy evening at our favourite cafe"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    The Story / Note
                  </label>
                  <textarea
                    rows={3}
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="What made this moment special..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-purple-400/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={memoryDate}
                      onChange={(e) => setMemoryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Tag
                    </label>
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#14151a] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400/50"
                    >
                      <option value="date">Date</option>
                      <option value="trip">Trip</option>
                      <option value="milestone">Milestone</option>
                      <option value="funny">Funny</option>
                      <option value="random">Random</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Marine Drive, Mumbai"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-purple-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Attach Photo
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {photoUrl && (
                      <span className="text-xs text-emerald-400 font-medium">
                        ✓ Photo attached
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMemoryModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-500/20"
                  >
                    Save Memory
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {goalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">Add Bucket List Goal</h3>
                <button
                  onClick={() => setGoalModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Goal / Dream Trip Title
                  </label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Manali Snow Trip or Anniversary Dinner"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGoalModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs transition-all shadow-lg shadow-amber-500/20"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
