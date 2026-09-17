import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Heart,
  BookOpen,
  Sparkles,
  Clock,
  X,
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../types';

const EVENT_CONFIG = {
  date: { label: 'Date', icon: Heart, bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  college: { label: 'College / Exam', icon: BookOpen, bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  special: { label: 'Special / Milestone', icon: Sparkles, bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

const LOCAL_STORAGE_EVENTS = '4ever_calendar_events_v1';

export const CalendarPage: React.FC = () => {
  const { relationship } = useRelationship();
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().slice(0, 10));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // New event form state
  const [newDate, setNewDate] = useState(selectedDay);
  const [newType, setNewType] = useState<'date' | 'college' | 'special'>('date');
  const [newNote, setNewNote] = useState('');

  // Load events
  const loadEvents = useCallback(async () => {
    // 1. Check local storage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_EVENTS);
      if (stored) {
        setEvents(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    // 2. Fetch from Supabase if relationship exists
    if (relationship?.id) {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('relationship_id', relationship.id)
          .order('event_date', { ascending: true });

        if (!error && data && data.length > 0) {
          setEvents(data as CalendarEvent[]);
          localStorage.setItem(LOCAL_STORAGE_EVENTS, JSON.stringify(data));
        }
      } catch {
        // use local
      }
    }
  }, [relationship]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const saveEvents = (updated: CalendarEvent[]) => {
    setEvents(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_EVENTS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const eventItem: CalendarEvent = {
      id: crypto.randomUUID(),
      relationship_id: relationship?.id || 'local_rel',
      event_date: newDate,
      event_type: newType,
      note: newNote.trim(),
      created_by: user?.id,
      created_at: new Date().toISOString(),
    };

    const updated = [...events, eventItem];
    saveEvents(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('calendar_events').insert([eventItem]);
      } catch {
        // ignore
      }
    }

    setNewNote('');
    setModalOpen(false);
  };

  const handleDeleteEvent = async (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    saveEvents(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('calendar_events').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Events on selected day
  const selectedDayEvents = events.filter((ev) => ev.event_date === selectedDay);

  // Upcoming events
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events
    .filter((ev) => ev.event_date >= todayStr)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-20 pt-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-amber-400" />
            <span>Shared Calendar</span>
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Never miss a date, college submission, or relationship milestone.
          </p>
        </div>

        <button
          onClick={() => {
            setNewDate(selectedDay);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid (2 cols on large) */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-6">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-white tracking-wide">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-white/40 pb-2 border-b border-white/10">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 rounded-xl bg-transparent" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDay === dateStr;
              const isToday = dateStr === todayStr;
              const dayEvents = events.filter((ev) => ev.event_date === dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`h-16 sm:h-20 p-1.5 rounded-2xl border flex flex-col justify-between text-left transition-all relative ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-lg shadow-amber-500/10'
                      : isToday
                      ? 'border-white/30 bg-white/5 text-white'
                      : 'border-white/5 bg-black/20 hover:bg-white/5 text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold'
                          : ''
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-amber-300 font-bold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny event tags */}
                  <div className="flex flex-wrap gap-1 overflow-hidden max-h-8">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className={`text-[9px] px-1 py-0.2 rounded truncate max-w-full ${
                          EVENT_CONFIG[ev.event_type].bg
                        }`}
                      >
                        {ev.note}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-white/40">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Selected Day & Upcoming */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs text-white/50 block">Events on</span>
                <h3 className="font-semibold text-white text-sm">
                  {new Date(selectedDay + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                onClick={() => {
                  setNewDate(selectedDay);
                  setModalOpen(true);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                title="Add to this day"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <p className="text-xs text-white/40 py-6 text-center italic">
                No events marked for this date. Click &quot;Add Event&quot; to plan a date or exam!
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map((ev) => {
                  const cfg = EVENT_CONFIG[ev.event_type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} flex items-center gap-1`}>
                            <Icon className="w-3 h-3" />
                            <span>{cfg.label}</span>
                          </span>
                        </div>
                        <p className="text-xs text-white/90 font-medium">{ev.note}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="text-white/30 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Upcoming Milestones</span>
            </h3>

            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-white/40 py-4 text-center">No upcoming events ahead.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingEvents.map((ev) => {
                  const cfg = EVENT_CONFIG[ev.event_type];
                  return (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium text-white/90 truncate max-w-[140px]">{ev.note}</p>
                        <span className="text-[10px] text-white/40 block">
                          {new Date(ev.event_date + 'T00:00:00').toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] border ${cfg.bg}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
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
                <h3 className="text-base font-semibold text-white">Add Calendar Event</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Event Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['date', 'college', 'special'] as const).map((type) => {
                      const cfg = EVENT_CONFIG[type];
                      const Icon = cfg.icon;
                      const isSelected = newType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewType(type)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-medium transition-all ${
                            isSelected
                              ? `${cfg.bg} border-amber-400 shadow-sm`
                              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[11px]">{cfg.label.split('/')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Event Description / Note
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. Candlelight Dinner or Endsem Exam"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
                  />
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
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs transition-all shadow-lg shadow-amber-500/20"
                  >
                    Save Event
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
