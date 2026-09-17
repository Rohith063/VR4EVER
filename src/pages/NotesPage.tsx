import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  StickyNote as NoteIcon,
  Plus,
  Trash2,
  Pin,
  X,
  User,
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { StickyNote } from '../types';

const LOCAL_STORAGE_NOTES = '4ever_notes_v1';

const COLOR_MAP: Record<
  StickyNote['color'],
  { bg: string; border: string; text: string; pinColor: string; name: string }
> = {
  golden: {
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
    text: 'text-amber-200',
    pinColor: 'text-amber-400',
    name: 'Warm Gold',
  },
  rose: {
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/40',
    text: 'text-rose-200',
    pinColor: 'text-rose-400',
    name: 'Soft Rose',
  },
  sky: {
    bg: 'bg-sky-950/40',
    border: 'border-sky-500/40',
    text: 'text-sky-200',
    pinColor: 'text-sky-400',
    name: 'Pastel Sky',
  },
  mint: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/40',
    text: 'text-emerald-200',
    pinColor: 'text-emerald-400',
    name: 'Fresh Mint',
  },
};

export const NotesPage: React.FC = () => {
  const { relationship } = useRelationship();
  const { user, profile } = useAuth();

  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // New Note form
  const [content, setContent] = useState('');
  const [color, setColor] = useState<StickyNote['color']>('golden');
  const [isPinned, setIsPinned] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_NOTES);
      if (stored) setNotes(JSON.parse(stored));
    } catch {
      // ignore
    }

    if (relationship?.id) {
      try {
        const { data, error } = await supabase
          .from('sticky_notes')
          .select('*')
          .eq('relationship_id', relationship.id)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setNotes(data as StickyNote[]);
          localStorage.setItem(LOCAL_STORAGE_NOTES, JSON.stringify(data));
        }
      } catch {
        // fallback
      }
    }
  }, [relationship]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const saveNotes = (updated: StickyNote[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const authorName = profile?.display_name || 'You';

    const newNote: StickyNote = {
      id: crypto.randomUUID(),
      relationship_id: relationship?.id || 'local_rel',
      author_id: user?.id || 'me',
      author_name: authorName,
      content: content.trim(),
      color,
      is_pinned: isPinned,
      created_at: new Date().toISOString(),
    };

    const updated = [newNote, ...notes];
    saveNotes(updated);

    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.6 },
    });

    if (relationship?.id && user) {
      try {
        await supabase.from('sticky_notes').insert([newNote]);
      } catch {
        // ignore
      }
    }

    setContent('');
    setIsPinned(false);
    setModalOpen(false);
  };

  const handleTogglePin = async (note: StickyNote) => {
    const updated = notes.map((n) =>
      n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n
    );
    saveNotes(updated);

    if (relationship?.id && user) {
      try {
        await supabase
          .from('sticky_notes')
          .update({ is_pinned: !note.is_pinned })
          .eq('id', note.id);
      } catch {
        // ignore
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);

    if (relationship?.id && user) {
      try {
        await supabase.from('sticky_notes').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
  };

  // Sort notes: pinned first, then newest
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned === b.is_pinned) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return a.is_pinned ? -1 : 1;
  });

  return (
    <div className="space-y-8 pb-20 pt-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-2.5">
            <NoteIcon className="w-7 h-7 text-amber-400" />
            <span>Sticky Love Notes</span>
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Leave sweet reminders, inside jokes, and pinned thoughts for each other.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Drop a Note
        </button>
      </div>

      {/* Sticky Notes Board Grid */}
      {sortedNotes.length === 0 ? (
        <div className="glass-card rounded-3xl border border-white/10 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300">
            <NoteIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">Your board is empty</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Drop your first note! It can be a cute compliment, a reminder to drink water, or what movie you want to watch next.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs inline-flex items-center gap-1.5 transition-all hover:bg-amber-400 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Write First Sticky Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNotes.map((note) => {
            const colorCfg = COLOR_MAP[note.color] || COLOR_MAP.golden;

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-3xl border p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 relative group ${colorCfg.bg} ${colorCfg.border}`}
              >
                {/* Pin marker */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePin(note)}
                    className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                      note.is_pinned ? colorCfg.pinColor : 'text-white/30'
                    }`}
                    title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
                  >
                    <Pin className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-white/30 hover:text-rose-400 p-1 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <p
                  className={`font-serif text-base sm:text-lg leading-relaxed whitespace-pre-wrap ${colorCfg.text}`}
                >
                  {note.content}
                </p>

                {/* Footer Attribution */}
                <div className="flex items-center justify-between text-[11px] text-white/40 pt-3 border-t border-white/10">
                  <span className="flex items-center gap-1.5 font-medium text-white/80">
                    <User className="w-3 h-3 text-white/50" />
                    {note.author_name}
                  </span>

                  <span>
                    {new Date(note.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Note Modal */}
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
                <h3 className="text-base font-semibold text-white">Drop a Sticky Note</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Your Note Message
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write a sweet note, an inside joke, or something cute..."
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50 resize-none font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Sticky Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(COLOR_MAP) as Array<StickyNote['color']>).map((col) => {
                      const cfg = COLOR_MAP[col];
                      const isSelected = color === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setColor(col)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs transition-all ${
                            cfg.bg
                          } ${cfg.border} ${isSelected ? 'ring-2 ring-amber-400' : 'opacity-70 hover:opacity-100'}`}
                        >
                          <span className={`text-[10px] font-semibold ${cfg.text}`}>
                            {cfg.name.split(' ')[1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinCheckbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="pinCheckbox" className="text-xs text-white/70 cursor-pointer">
                    Pin this note to the top of the board
                  </label>
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
                    Post Note
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
