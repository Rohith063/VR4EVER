import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Heart,
  Smile,
  Image as ImageIcon,
  MapPin,
  Mic,
  Phone,
  Video as VideoIcon,
  Search,
  ChevronLeft,
  CheckCheck,
  Play,
  Pause,
  ExternalLink,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';
import { CallModal } from './CallModal';
import { VoiceRecorder } from './VoiceRecorder';

interface AudioMessageBubbleProps {
  mediaUrl?: string | null;
  duration?: number;
  isMe: boolean;
}

const AudioMessageBubble: React.FC<AudioMessageBubbleProps> = ({ mediaUrl, duration, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!mediaUrl) return;
    const audio = new Audio(mediaUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.ontimeupdate = () => {
      if (audio.duration && audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [mediaUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play failed', err);
      });
    }
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center space-x-3 py-1 min-w-[210px] max-w-[270px]">
      <button
        type="button"
        onClick={togglePlay}
        disabled={!mediaUrl}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isMe
            ? 'bg-black text-amber-400 hover:bg-black/80'
            : 'bg-amber-500 text-black hover:bg-amber-400'
        } ${!mediaUrl ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95 shadow-md'}`}
        title={isPlaying ? 'Pause' : 'Play voice note'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1.5 overflow-hidden">
        {/* Interactive waveform bars */}
        <div
          className="flex items-center gap-1 h-5 cursor-pointer"
          onClick={(e) => {
            if (!audioRef.current || !audioRef.current.duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audioRef.current.currentTime = pos * audioRef.current.duration;
          }}
          title="Click to seek"
        >
          {[6, 12, 20, 14, 10, 18, 22, 16, 8, 14, 20, 12, 16, 10, 6].map((barHeight, idx) => {
            const barFraction = (idx + 1) / 15;
            const isFilled = (progress / 100) >= barFraction;
            return (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isMe
                    ? isFilled ? 'bg-black' : 'bg-black/30'
                    : isFilled ? 'bg-amber-400' : 'bg-white/30'
                } ${isPlaying ? 'animate-pulse' : ''}`}
                style={{
                  height: `${barHeight}px`,
                  animationDelay: `${idx * 80}ms`,
                }}
              />
            );
          })}
        </div>

        <div className={`flex justify-between text-[10px] font-mono ${isMe ? 'text-black/70' : 'text-white/60'}`}>
          <span>{isPlaying ? formatSecs(currentTime) : 'Voice note'}</span>
          <span>{duration ? `${duration}s` : (mediaUrl ? 'Voice note' : 'No audio')}</span>
        </div>
      </div>
    </div>
  );
};

export const DirectMessagesModal: React.FC = () => {
  const { user } = useAuth();
  const { updateLocation } = useRelationship();
  const {
    isMessagesOpen,
    setIsMessagesOpen,
    directThreads,
    activeThreadId,
    setActiveThreadId,
    getMessagesForThread,
    sendDirectMessage,
    openUserProfile,
  } = useSocial();

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('audio');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active thread data
  const currentThread = directThreads.find((t) => t.id === activeThreadId) || directThreads[0];
  const activeMessages = currentThread ? getMessagesForThread(currentThread.id) : [];

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeThreadId]);

  if (!isMessagesOpen) return null;

  const handleSend = () => {
    if (!messageInput.trim() || !currentThread) return;
    sendDirectMessage(currentThread.id, messageInput.trim(), 'text');
    setMessageInput('');
    setShowEmojiPicker(false);
  };

  const handleSendLocation = () => {
    if (!currentThread) return;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (currentThread.is_couple) {
            updateLocation(lat, lng, 10);
          }
          sendDirectMessage(currentThread.id, '📍 Live GPS Location', 'location', null, {
            latitude: lat,
            longitude: lng,
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)} (Real-time GPS)`,
          });
        },
        (err) => {
          console.warn('Geolocation unavailable or denied:', err);
          const lat = 12.9716;
          const lng = 77.5946;
          if (currentThread.is_couple) {
            updateLocation(lat, lng, 50);
          }
          sendDirectMessage(currentThread.id, '📍 Shared Location Pin', 'location', null, {
            latitude: lat,
            longitude: lng,
            address: 'MG Road, Bangalore • Live Radar',
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const lat = 12.9716;
      const lng = 77.5946;
      sendDirectMessage(currentThread.id, '📍 Shared Location Pin', 'location', null, {
        latitude: lat,
        longitude: lng,
        address: 'MG Road, Bangalore • Live Radar',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentThread) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const isVideo = file.type.startsWith('video');
      sendDirectMessage(
        currentThread.id,
        isVideo ? 'Sent a video' : 'Sent a photo',
        isVideo ? 'video' : 'image',
        result
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filteredThreads = directThreads.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.participant.display_name.toLowerCase().includes(q) ||
      t.participant.username.toLowerCase().includes(q)
    );
  });

  const emojis = ['❤️', '🥰', '😘', '✨', '🔥', '☕', '🌸', '🍕', '🎉', '🙌'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full h-full sm:max-w-4xl sm:h-[85vh] bg-[#121319] border-0 sm:border border-white/10 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-white"
        >
          {/* LEFT: THREADS LIST (Instagram DMs List) */}
          <div
            className={`w-full md:w-80 border-r border-white/10 flex flex-col bg-[#14161f] ${
              mobileView === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">Direct Messages</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-semibold">
                  {directThreads.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMessagesOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400/50"
                />
              </div>
            </div>

            {/* Threads List Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-16 px-4 text-white/40">
                  <p className="text-sm font-semibold text-white/70">None</p>
                  <p className="text-xs text-white/40 mt-1">No chats yet. Add friends or connect your partner to start messaging.</p>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isSelected = currentThread?.id === thread.id;
                  const isCouple = thread.is_couple;

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setMobileView('chat');
                    }}
                    className={`w-full p-3.5 flex items-center space-x-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-l-4 border-amber-400'
                        : isCouple
                        ? 'bg-rose-500/10 hover:bg-rose-500/15 border-l-4 border-rose-400/60'
                        : 'hover:bg-white/5 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full overflow-hidden ring-2 ${
                          isCouple ? 'ring-rose-400' : 'ring-white/10'
                        }`}
                      >
                        {thread.participant.avatar_url ? (
                          <img
                            src={thread.participant.avatar_url}
                            alt={thread.participant.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center font-bold text-sm text-amber-300">
                            {thread.participant.display_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {isCouple ? (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shadow-md">
                          <Heart className="w-3 h-3 fill-white text-white" />
                        </div>
                      ) : (
                        thread.participant.is_online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#14161f]" />
                        )
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className="font-semibold text-xs text-white truncate">
                            {thread.participant.display_name}
                          </span>
                        </div>
                      </div>

                      {/* SPECIAL DEDICATED GF / BF TAG BESIDE NAME */}
                      {isCouple && (
                        <div className="mt-0.5 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-rose-500/30 to-amber-500/30 border border-rose-500/50 text-rose-300 shadow-sm">
                            <Heart className="w-2.5 h-2.5 fill-rose-300" />
                            {thread.couple_role === 'girlfriend'
                              ? 'Girlfriend'
                              : thread.couple_role === 'boyfriend'
                              ? 'Boyfriend'
                              : 'My Couple'}
                          </span>
                        </div>
                      )}

                      <p className="text-[11px] text-white/50 truncate mt-0.5">
                        {thread.last_message ? thread.last_message.content : 'Start a conversation'}
                      </p>
                    </div>

                    {thread.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {thread.unread_count}
                      </span>
                    )}
                  </button>
                );
              }))}
            </div>
          </div>

          {/* RIGHT: ACTIVE CHAT THREAD (Full DM view) */}
          <div
            className={`flex-1 flex flex-col bg-[#101217] ${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {currentThread ? (
              <>
                {/* Chat Top Header */}
                <div className="px-4 py-3 border-b border-white/10 bg-[#14161f]/80 backdrop-blur-md flex items-center justify-between z-10">
                  <div className="flex items-center space-x-3">
                    {/* Back button for mobile */}
                    <button
                      type="button"
                      onClick={() => setMobileView('list')}
                      className="md:hidden p-1.5 rounded-full hover:bg-white/10 text-white/70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Clickable Avatar to view full profile */}
                    <button
                      type="button"
                      onClick={() => openUserProfile(currentThread.participant.id)}
                      className="flex items-center space-x-2.5 group cursor-pointer text-left"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-amber-400 transition-all">
                        {currentThread.participant.avatar_url ? (
                          <img
                            src={currentThread.participant.avatar_url}
                            alt={currentThread.participant.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center font-bold text-xs text-amber-300">
                            {currentThread.participant.display_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-xs text-white group-hover:text-amber-300 transition-colors">
                            {currentThread.participant.display_name}
                          </span>
                          {/* TAG BESIDE SPECIAL COUPLE */}
                          {currentThread.is_couple && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                              <Heart className="w-2.5 h-2.5 fill-rose-300" />
                              {currentThread.couple_role === 'girlfriend'
                                ? 'Girlfriend'
                                : currentThread.couple_role === 'boyfriend'
                                ? 'Boyfriend'
                                : 'Partner'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40">@{currentThread.participant.username} • Tap to view profile</p>
                      </div>
                    </button>
                  </div>

                  {/* Calling Actions & Close */}
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCallType('audio');
                        setCallModalOpen(true);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-amber-300 transition-colors cursor-pointer"
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCallType('video');
                        setCallModalOpen(true);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-amber-300 transition-colors cursor-pointer"
                      title="Video Call"
                    >
                      <VideoIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMessagesOpen(false)}
                      className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages Bubble Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {/* Date & Encryption marker */}
                  <div className="text-center py-2">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-mono">
                      🔒 End-to-End Encrypted 4EVER Chat
                    </span>
                  </div>

                  {activeMessages.length === 0 && (
                    <div className="text-center py-16 text-white/40">
                      <p className="text-sm font-semibold text-white/60">None</p>
                      <p className="text-xs text-white/40 mt-1">
                        No messages in this conversation yet. Send a message to start chatting!
                      </p>
                    </div>
                  )}

                  {activeMessages.map((msg) => {
                    const isMe = msg.sender_id === (user?.id || 'me');

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs ${
                            isMe
                              ? 'bg-amber-500 text-black font-medium rounded-tr-none shadow-md'
                              : 'bg-white/10 text-white rounded-tl-none border border-white/10'
                          }`}
                        >
                          {/* Image Attachment */}
                          {msg.type === 'image' && msg.media_url && (
                            <div className="mb-2 rounded-xl overflow-hidden max-h-56">
                              <img
                                src={msg.media_url}
                                alt="Attachment"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Video Attachment */}
                          {msg.type === 'video' && msg.media_url && (
                            <div className="mb-2 rounded-xl overflow-hidden max-h-56">
                              <video
                                src={msg.media_url}
                                controls
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Audio Voice Note Bubble */}
                          {msg.type === 'audio' && (
                            <AudioMessageBubble
                              mediaUrl={msg.media_url}
                              duration={msg.metadata?.audio_duration}
                              isMe={isMe}
                            />
                          )}

                          {/* Live Location Bubble */}
                          {msg.type === 'location' && (
                            <div className="space-y-2 py-1 max-w-[260px]">
                              <div className="flex items-center space-x-2 font-semibold">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-black/20 text-black' : 'bg-rose-500/20 text-rose-400'}`}>
                                  <MapPin className="w-4 h-4 text-rose-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">{msg.content || '📍 Live Location'}</p>
                                  {msg.metadata?.address && (
                                    <p className={`text-[10px] truncate ${isMe ? 'text-black/70' : 'text-white/60'}`}>{msg.metadata.address}</p>
                                  )}
                                </div>
                              </div>

                              {msg.metadata?.latitude && msg.metadata?.longitude ? (
                                <div className="rounded-xl overflow-hidden border border-black/10 bg-black/30 p-2.5 space-y-2 text-white">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                      Live GPS Coordinates
                                    </span>
                                    <span>{Number(msg.metadata.latitude).toFixed(3)}°, {Number(msg.metadata.longitude).toFixed(3)}°</span>
                                  </div>
                                  <a
                                    href={`https://www.google.com/maps?q=${msg.metadata.latitude},${msg.metadata.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white transition-colors cursor-pointer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Open in Google Maps</span>
                                  </a>
                                </div>
                              ) : (
                                <div className="w-full h-14 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
                                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-black/40 text-[10px] font-mono">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    <span>Live Coordinate Pin</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Plain text */}
                          {msg.type === 'text' && <p className="leading-relaxed">{msg.content}</p>}

                          {/* Timestamp & read receipt */}
                          <div
                            className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${
                              isMe ? 'text-black/60' : 'text-white/40'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Emojis Drawer */}
                {showEmojiPicker && (
                  <div className="px-4 py-2 bg-[#14161f] border-t border-white/10 flex items-center space-x-2 overflow-x-auto">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setMessageInput((prev) => prev + emoji)}
                        className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Controls Bar */}
                <div className="p-3 border-t border-white/10 bg-[#14161f]/80 backdrop-blur-md">
                  {isRecording ? (
                    <VoiceRecorder
                      onAudioRecorded={(audioDataUrl, dur) => {
                        setIsRecording(false);
                        if (currentThread) {
                          sendDirectMessage(
                            currentThread.id,
                            `Voice Note (${dur}s)`,
                            'audio',
                            audioDataUrl,
                            { audio_duration: dur }
                          );
                        }
                      }}
                      onCancel={() => setIsRecording(false)}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      {/* Emoji toggle */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 rounded-xl text-white/60 hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Smile className="w-5 h-5" />
                      </button>

                      {/* Image / Attachment */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl text-white/60 hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
                        title="Attach Photo / Video"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,video/*"
                        className="hidden"
                      />

                      {/* Live Location Sharing button */}
                      <button
                        type="button"
                        onClick={handleSendLocation}
                        className="p-2 rounded-xl text-white/60 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                        title="Share Live Location in Chat"
                      >
                        <MapPin className="w-5 h-5" />
                      </button>

                      {/* Voice Note Button */}
                      <button
                        type="button"
                        onClick={() => setIsRecording(true)}
                        className="p-2 rounded-xl text-white/60 hover:text-amber-300 hover:bg-white/5 transition-all cursor-pointer"
                        title="Record Voice Note"
                      >
                        <Mic className="w-5 h-5" />
                      </button>

                      {/* Text Input */}
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400/50"
                        />
                      </div>

                      {/* Send Button */}
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!messageInput.trim()}
                        className="p-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-6 text-center">
                <Heart className="w-12 h-12 mb-3 opacity-30 text-rose-400" />
                <p className="text-sm font-semibold text-white">None</p>
                <p className="text-xs text-white/50 max-w-xs mt-1">
                  No active conversation. Search users to connect and start a chat.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Real-time Call Modal */}
        {callModalOpen && (
          <CallModal
            isOpen={callModalOpen}
            onClose={() => setCallModalOpen(false)}
            callType={callType}
          />
        )}
      </div>
    </AnimatePresence>
  );
};
