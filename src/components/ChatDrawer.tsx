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
  Phone,
  Video as VideoIcon,
  Mic,
  Smile,
  Paperclip,
  Play,
  Pause,
  FileText,
  Download,
  Film,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';
import { supabase } from '../lib/supabase';
import type { Message, MessageType } from '../types';
import { VoiceRecorder } from './VoiceRecorder';
import { EmojiPicker } from './EmojiPicker';
import { CallModal } from './CallModal';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCamera: () => void;
  onOpenLocation: () => void;
}

const LOCAL_CHAT_KEY = '4ever_messages_v1';

// Custom Audio Bubble Component
const AudioMessageBubble: React.FC<{ url: string; duration?: number; isMe: boolean }> = ({
  url,
  duration = 5,
  isMe,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[200px]">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-90 ${
          isMe ? 'bg-black text-amber-300' : 'bg-amber-500 text-black'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        {/* Progress Bar & Waveform */}
        <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all ${
              isMe ? 'bg-black/70' : 'bg-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] opacity-75 font-mono">
          <span>{Math.floor(currentTime)}s</span>
          <span>{Math.floor(duration)}s</span>
        </div>
      </div>
    </div>
  );
};

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  onOpenCamera,
  onOpenLocation,
}) => {
  const { user } = useAuth();
  const { relationship, partnerProfile, isPartnerOnline } = useRelationship();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Modals & Popovers
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [callModal, setCallModal] = useState<{ open: boolean; type: 'video' | 'audio' }>({
    open: false,
    type: 'video',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load initial messages
  useEffect(() => {
    if (!relationship) return;

    try {
      const cached = localStorage.getItem(`${LOCAL_CHAT_KEY}_${relationship.id}`);
      if (cached) {
        setMessages(JSON.parse(cached));
      }
    } catch {
      // ignore
    }

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
          localStorage.setItem(`${LOCAL_CHAT_KEY}_${relationship.id}`, JSON.stringify(data));
        }
      } catch {
        // use local cache
      }
    };

    fetchCloudMessages();

    // Realtime channel
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
            localStorage.setItem(`${LOCAL_CHAT_KEY}_${relationship.id}`, JSON.stringify(updated));
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

  const partnerName =
    relationship?.custom_nickname_2 || partnerProfile?.display_name || 'Partner';

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
      localStorage.setItem(`${LOCAL_CHAT_KEY}_${relationship.id}`, JSON.stringify(updated));
      return updated;
    });

    setInputText('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    setIsRecordingVoice(false);
    setSending(true);

    if (user) {
      try {
        await supabase.from('messages').insert([newMsg]);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }

    setSending(false);
  };

  // Upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        sendMessage('image', '', reader.result as string, {
          fileName: file.name,
          fileSize: file.size,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        sendMessage('video', file.name, reader.result as string, {
          fileName: file.name,
          fileSize: file.size,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        sendMessage('file', file.name, reader.result as string, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'document',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAudioRecorded = (audioDataUrl: string, durationSec: number) => {
    sendMessage('audio', 'Voice Note', audioDataUrl, { duration: durationSec });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="glass flex h-full w-full max-w-md flex-col border-l border-white/10 bg-zinc-950/95 shadow-2xl relative"
        >
          {/* Top Header with Video / Audio Call Launcher */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-zinc-900/70">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 font-bold text-amber-300 font-serif border border-amber-500/30">
                {partnerName[0]?.toUpperCase() || 'P'}
                <div
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 ${
                    isPartnerOnline ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white truncate max-w-[130px]">
                  {partnerName}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  {isPartnerOnline ? (
                    <span className="text-emerald-400 font-medium">● Active now</span>
                  ) : (
                    'Connected space'
                  )}
                </p>
              </div>
            </div>

            {/* Calling & Close Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCallModal({ open: true, type: 'audio' })}
                className="p-2 rounded-xl text-white/70 hover:text-amber-300 hover:bg-white/10 transition-colors"
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCallModal({ open: true, type: 'video' })}
                className="p-2 rounded-xl text-white/70 hover:text-amber-300 hover:bg-white/10 transition-colors"
                title="Start Video Call"
              >
                <VideoIcon className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors ml-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500 py-12">
                <MessageCircle className="h-12 w-12 mb-2 opacity-30 text-amber-400" />
                <p className="text-sm font-semibold text-zinc-300">Your Private Space Chat</p>
                <p className="text-xs text-zinc-500 max-w-[240px] mt-1">
                  Send voice notes, videos, photos, and location pins directly to {partnerName}.
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
                    className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                      isMe
                        ? 'gradient-golden text-zinc-950 font-medium rounded-tr-none'
                        : 'bg-zinc-900 border border-white/10 text-white rounded-tl-none'
                    }`}
                  >
                    {/* Photo Bubble */}
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

                    {/* Video Bubble */}
                    {msg.type === 'video' && msg.media_url && (
                      <div className="mb-1.5 overflow-hidden rounded-xl bg-black">
                        <video
                          src={msg.media_url}
                          controls
                          playsInline
                          className="max-h-64 w-full rounded-xl object-contain"
                        />
                      </div>
                    )}

                    {/* Audio / Voice Note Bubble */}
                    {msg.type === 'audio' && msg.media_url && (
                      <AudioMessageBubble
                        url={msg.media_url}
                        duration={msg.metadata?.duration}
                        isMe={isMe}
                      />
                    )}

                    {/* Document / PDF File Bubble */}
                    {msg.type === 'file' && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">
                            {msg.metadata?.fileName || msg.content || 'Document'}
                          </p>
                          <span className="text-[10px] opacity-70 block">
                            {msg.metadata?.fileSize
                              ? `${Math.round(msg.metadata.fileSize / 1024)} KB`
                              : 'File'}
                          </span>
                        </div>
                        {msg.media_url && (
                          <a
                            href={msg.media_url}
                            download={msg.metadata?.fileName || 'download'}
                            className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
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
                            Open in Google Maps ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.type === 'text' && msg.content && (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}

                    {/* Timestamp & Read Receipts */}
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
                      {isMe && <CheckCheck className="h-3 w-3 text-zinc-800" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Menu Popup */}
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-20 left-4 z-50 glass-card rounded-2xl border border-white/15 p-2 shadow-2xl bg-[#14151a] grid grid-cols-5 gap-1.5 text-center text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    onOpenCamera();
                    setShowAttachMenu(false);
                  }}
                  className="p-2.5 rounded-xl hover:bg-white/10 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-white/80">Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="p-2.5 rounded-xl hover:bg-white/10 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-white/80">Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    videoInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="p-2.5 rounded-xl hover:bg-white/10 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center">
                    <Film className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-white/80">Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="p-2.5 rounded-xl hover:bg-white/10 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-white/80">PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenLocation();
                    setShowAttachMenu(false);
                  }}
                  className="p-2.5 rounded-xl hover:bg-white/10 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-white/80">Pin</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji Tray */}
          {showEmojiPicker && (
            <EmojiPicker
              onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoUpload}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleDocUpload}
          />

          {/* Bottom Chat Bar */}
          <div className="border-t border-white/10 p-3 bg-zinc-900/80">
            {isRecordingVoice ? (
              <VoiceRecorder
                onAudioRecorded={handleAudioRecorded}
                onCancel={() => setIsRecordingVoice(false)}
              />
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Plus / Paperclip attachment button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu((prev) => !prev);
                    setShowEmojiPicker(false);
                  }}
                  className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Attach media or document"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Emoji button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker((prev) => !prev);
                    setShowAttachMenu(false);
                  }}
                  className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Insert emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder={`Message ${partnerName}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400 transition-colors"
                />

                {/* If text exists, show Send button; otherwise show Mic button */}
                {inputText.trim() ? (
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex h-10 w-10 items-center justify-center rounded-xl gradient-golden text-zinc-950 font-bold shadow-lg hover:opacity-95 transition-opacity disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-amber-500/20 text-white hover:text-amber-300 transition-colors cursor-pointer"
                    title="Record voice note"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </form>
            )}
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

        {/* 1-on-1 Calling Modal */}
        <CallModal
          isOpen={callModal.open}
          callType={callModal.type}
          onClose={() => setCallModal({ open: false, type: 'video' })}
        />
      </div>
    </AnimatePresence>
  );
};
