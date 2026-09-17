import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { StudyTask } from '../types';

const LOCAL_STORAGE_STUDY = '4ever_study_tasks_v1';

export const StudyPage: React.FC = () => {
  const { relationship, partnerProfile } = useRelationship();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week'>('today');
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState<'30min' | '1hr' | '2hr' | 'flex'>('1hr');
  const [newCategory, setNewCategory] = useState<'today' | 'tomorrow' | 'week'>('today');
  const [assignedType, setAssignedType] = useState<'me' | 'partner' | 'both'>('both');

  // Pomodoro timer state
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Load study tasks
  const loadTasks = useCallback(async () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_STUDY);
      if (stored) setTasks(JSON.parse(stored));
    } catch {
      // ignore
    }

    if (relationship?.id) {
      try {
        const { data, error } = await supabase
          .from('study_tasks')
          .select('*')
          .eq('relationship_id', relationship.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setTasks(data as StudyTask[]);
          localStorage.setItem(LOCAL_STORAGE_STUDY, JSON.stringify(data));
        }
      } catch {
        // use local
      }
    }
  }, [relationship]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const saveTasks = (updated: StudyTask[]) => {
    setTasks(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_STUDY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Pomodoro effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = window.setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleToggleTask = async (task: StudyTask) => {
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
    );
    saveTasks(updated);

    if (!task.is_completed) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#10b981', '#fbbf24'],
      });
    }

    if (relationship?.id && user) {
      try {
        await supabase
          .from('study_tasks')
          .update({ is_completed: !task.is_completed })
          .eq('id', task.id);
      } catch {
        // ignore
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('study_tasks').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let assignedId: string | null = null;
    if (assignedType === 'me' && user) assignedId = user.id;
    else if (assignedType === 'partner' && partnerProfile) assignedId = partnerProfile.id;

    const taskItem: StudyTask = {
      id: crypto.randomUUID(),
      relationship_id: relationship?.id || 'local_rel',
      title: newTitle.trim(),
      duration: newDuration,
      category: newCategory,
      is_completed: false,
      assigned_to: assignedId,
      created_at: new Date().toISOString(),
    };

    const updated = [taskItem, ...tasks];
    saveTasks(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('study_tasks').insert([taskItem]);
      } catch {
        // ignore
      }
    }

    setNewTitle('');
    setModalOpen(false);
  };

  // Stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = tasks.filter((t) => t.category === activeTab);

  const partnerDisplayName = partnerProfile?.display_name || 'Partner';

  return (
    <div className="space-y-8 pb-20 pt-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-blue-400" />
            <span>Study & Accountability</span>
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Stay focused, hit your goals together, and track study tasks.
          </p>
        </div>

        <button
          onClick={() => {
            setNewCategory(activeTab);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Top Banner: Stats & Pomodoro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Progress Card */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Shared Completion Rate
            </span>
            <span className="text-xs text-white/60">
              {completedTasks} of {totalTasks} finished
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-bold text-white font-serif">{completionRate}%</h2>
              <span className="text-xs text-emerald-400 font-medium">
                {completionRate >= 80 ? '🔥 On Fire!' : completionRate >= 50 ? '⚡ Great Momentum' : '🌱 Starting Out'}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-[11px] text-white/40 block">Your Assigned Tasks</span>
              <span className="text-lg font-bold text-white">
                {tasks.filter((t) => t.assigned_to === user?.id || !t.assigned_to).length}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-[11px] text-white/40 block">{partnerDisplayName}&apos;s Tasks</span>
              <span className="text-lg font-bold text-white">
                {tasks.filter((t) => t.assigned_to === partnerProfile?.id || !t.assigned_to).length}
              </span>
            </div>
          </div>
        </div>

        {/* Co-Focus Pomodoro Clock */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl flex flex-col justify-between items-center text-center space-y-4">
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-2 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Focus Timer
            </span>
            <span>25 Min Block</span>
          </div>

          <div className="my-2">
            <span className="font-mono text-5xl font-black tracking-wider text-white">
              {formatTimer(pomodoroSeconds)}
            </span>
            <p className="text-[11px] text-white/40 mt-1">Study sprint together</p>
          </div>

          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => setTimerRunning((prev) => !prev)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                timerRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{timerRunning ? 'Pause' : 'Start Sprint'}</span>
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setPomodoroSeconds(25 * 60);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-6">
        {/* Tab Filters */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex gap-2">
            {(['today', 'tomorrow', 'week'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'week' ? 'This Week' : tab}
              </button>
            ))}
          </div>

          <span className="text-xs text-white/40">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {/* Task Items */}
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-medium text-white/80">No study tasks planned for {activeTab}</p>
            <p className="text-xs text-white/40">
              Add assignments, chapters to read, or exam revision topics!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  task.is_completed
                    ? 'bg-white/5 border-white/5 opacity-60'
                    : 'bg-black/30 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="shrink-0 text-white/60 hover:text-blue-400 transition-colors"
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <h4
                      className={`text-sm font-medium ${
                        task.is_completed ? 'line-through text-white/40' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h4>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {task.duration}
                      </span>

                      <span className="text-[10px] text-white/40 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {task.assigned_to === user?.id
                          ? 'You'
                          : task.assigned_to === partnerProfile?.id
                          ? partnerDisplayName
                          : 'Both'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">Add Study Goal</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Goal / Subject / Task
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Complete Operating Systems Chapter 4"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Timeframe
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as 'today' | 'tomorrow' | 'week')}
                      className="w-full px-3 py-2 rounded-xl bg-[#14151a] border border-white/10 text-white text-xs focus:outline-none focus:border-blue-400/50"
                    >
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="week">This Week</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">
                      Duration
                    </label>
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value as '30min' | '1hr' | '2hr' | 'flex')}
                      className="w-full px-3 py-2 rounded-xl bg-[#14151a] border border-white/10 text-white text-xs focus:outline-none focus:border-blue-400/50"
                    >
                      <option value="30min">30 min</option>
                      <option value="1hr">1 hour</option>
                      <option value="2hr">2 hours</option>
                      <option value="flex">Flexible</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Assigned To
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'me', label: 'Me' },
                      { id: 'partner', label: partnerDisplayName },
                      { id: 'both', label: 'Both' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAssignedType(item.id as 'me' | 'partner' | 'both')}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                          assignedType === item.id
                            ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/20"
                  >
                    Add Task
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
