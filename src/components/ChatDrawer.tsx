import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Camera,
  MapPin,
  Image as ImageIcon,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';
import { supabase } from '../lib/supabase';
import type { Message, MessageType } from '../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCamera: () => void;
  onOpenLocation: () => void;
}

const LOCAL_CHAT_KEY = '4ever_messages_v1';

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  onOpenCamera,
  onOpenLocation,
}) => {
  const { user } = useAuth();
  const { relationship, partnerProfile, isPartnerOnline, isDemoMode } = useRelationship();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load initial messages
  useEffect(() => {
    if (!relationship) return;

    // Load from local storage cache
    try {
      const cached = localStorage.getItem(`${LOCAL_CHAT_KEY}_${relationship.id}`);
      if (cached) {
        setMessages(JSON.parse(cached));
      }
    } catch {
      // ignore
    }

    // Fetch from Supabase
    const fetchCloudMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('relationship_id', relationship.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (!error && data) {
          setMessages(data as Message[]);
          localStorage.setItem(
            `${LOCAL_CHAT_KEY}_${relationship.id}`,
            JSON.stringify(data)
          );
        }
      } catch {
        // use local cache
      }
    };

    fetchCloudMessages();

    // 2. Realtime WebSocket subscription
    const channel = supabase
      .channel(`chat_${relationship.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `relationship_id=eq.${relationship.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const updated = [...prev, newMsg];
            localStorage.setItem(
              `${LOCAL_CHAT_KEY}_${relationship.id}`,
              JSON.stringify(updated)
            );
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [relationship]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async (
    type: MessageType = 'text',
    content: string = inputText,
    mediaUrl?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!content.trim() && !mediaUrl && type === 'text') return;
    if (!relationship) return;

    const currentUserId = user?.id || 'local_user';
    const newMsg: Message = {
      id: crypto.randomUUID(),
      relationship_id: relationship.id,
      sender_id: currentUserId,
      type,
      content: content.trim(),
      media_url: mediaUrl || null,
      metadata: (metadata as Message['metadata']) || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // Optimistic local update
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      localStorage.setItem(
        `${LOCAL_CHAT_KEY}_${relationship.id}`,
        JSON.stringify(updated)
      );
      return updated;
    });

    setInputText('');
    setSending(true);

    // Write to Supabase if connected
    if (user && !isDemoMode) {
      try {
        await supabase.from('messages').insert([newMsg]);
      } catch (err) {
        console.error('Failed to send message to cloud:', err);
      }
    }

    setSending(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        sendMessage('image', '', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="glass flex h-full w-full max-w-md flex-col border-l border-white/10 bg-zinc-950/95 shadow-2xl"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 font-bold text-amber-300">
                {partnerProfile?.display_name?.[0]?.toUpperCase() || 'P'}
                <div
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-900 ${
                    isPartnerOnline ? 'bg-emerald-500' : 'bg-zinc-500'
                  }`}
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {partnerProfile?.display_name || 'Partner'}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  {isPartnerOnline ? (
                    <span className="text-emerald-400 font-medium">● Online</span>
                  ) : (
                    'Last seen recently'
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                <MessageCircle className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm font-semibold text-zinc-400">Your Private Space Chat</p>
                <p className="text-xs text-zinc-500 max-w-[220px] mt-1">
                  Messages, photos, and location updates are synced directly between you two.
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = user ? msg.sender_id === user.id : msg.sender_id !== 'partner';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 shadow-md ${
                      isMe
                        ? 'gradient-golden text-zinc-950 font-medium rounded-tr-none'
                        : 'bg-zinc-900 border border-white/10 text-white rounded-tl-none'
                    }`}
                  >
                    {/* Image Bubble */}
                    {msg.type === 'image' && msg.media_url && (
                      <div className="mb-1.5 overflow-hidden rounded-xl cursor-pointer">
                        <img
                          src={msg.media_url}
                          alt="Photo"
                          className="max-h-60 w-full object-cover hover:scale-105 transition-transform"
                          onClick={() => setSelectedImage(msg.media_url || null)}
                        />
                      </div>
                    )}

                    {/* Location Bubble */}
                    {msg.type === 'location' && msg.metadata && (
                      <div className="flex items-center gap-2 mb-1 rounded-xl bg-black/20 p-2.5">
                        <MapPin className="h-5 w-5 text-sky-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold">Shared Location</p>
                          <a
                            href={`https://maps.google.com/?q=${msg.metadata.latitude},${msg.metadata.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] underline opacity-90 hover:opacity-100 block truncate"
                          >
                            Open in Maps ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}

                    {/* Timestamp & Read Checkmarks */}
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                        isMe ? 'text-zinc-800' : 'text-zinc-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && (
                        <CheckCheck className="h-3 w-3 text-zinc-800" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Bar */}
          <div className="border-t border-white/10 p-3 bg-zinc-900/60">
            <div className="flex items-center gap-1.5 mb-2">
              <button
                onClick={onOpenCamera}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-white/10 transition-colors"
              >
                <Camera className="h-3.5 w-3.5 text-amber-400" />
                Snap Photo
              </button>

              <button
                onClick={onOpenLocation}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-white/10 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-sky-400" />
                Send Location
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-white/10 transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type a sweet message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-xl gradient-golden text-zinc-950 font-bold shadow-lg hover:opacity-95 transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </motion.div>

        {/* Lightbox for clicked photos */}
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 cursor-pointer"
          >
            <img
              src={selectedImage}
              alt="Enlarged preview"
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
