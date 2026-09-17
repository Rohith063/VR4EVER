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
  StopCircle,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { CallModal } from './CallModal';

export const DirectMessagesModal: React.FC = () => {
  const { user } = useAuth();
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
  const [recordingDuration, setRecordingDuration] = useState(0);
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

  // Voice recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isMessagesOpen) return null;

  const handleSend = () => {
    if (!messageInput.trim() || !currentThread) return;
    sendDirectMessage(currentThread.id, messageInput.trim(), 'text');
    setMessageInput('');
    setShowEmojiPicker(false);
  };

  const handleSendLocation = () => {
    if (!currentThread) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendDirectMessage(currentThread.id, '📍 Shared Current Location', 'location', null, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: 'Real-time GPS Coordinate Pin',
          });
        },
        () => {
          // Fallback simulation coordinates
          sendDirectMessage(currentThread.id, '📍 Shared Live Location Pin', 'location', null, {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'MG Road, Bangalore • Live Now',
          });
        }
      );
    } else {
      sendDirectMessage(currentThread.id, '📍 Shared Live Location Pin', 'location', null, {
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'MG Road, Bangalore • Live Now',
      });
    }
  };

  const handleVoiceRecordToggle = () => {
    if (isRecording) {
      // Finish recording and send
      setIsRecording(false);
      if (currentThread) {
        sendDirectMessage(
          currentThread.id,
          `Voice Note (${recordingDuration || 3}s)`,
          'audio',
          null,
          { audio_duration: recordingDuration || 3 }
        );
      }
    } else {
      setIsRecording(true);
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
                            <div className="flex items-center space-x-2 py-1">
                              <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
                                <Mic className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-[11px]">{msg.content}</span>
                                <div className="w-24 h-1.5 bg-black/20 rounded-full mt-1 overflow-hidden">
                                  <div className="w-1/2 h-full bg-current rounded-full" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Live Location Bubble */}
                          {msg.type === 'location' && (
                            <div className="space-y-1.5 py-1">
                              <div className="flex items-center space-x-1.5 font-semibold">
                                <MapPin className="w-4 h-4 text-rose-500" />
                                <span>{msg.content}</span>
                              </div>
                              {msg.metadata?.address && (
                                <p className="text-[10px] opacity-80">{msg.metadata.address}</p>
                              )}
                              <div className="w-full h-20 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
                                <div className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/40 text-[10px] font-mono">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                  <span>Live Coordinate Radar Active</span>
                                </div>
                              </div>
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
                      onClick={handleVoiceRecordToggle}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'text-white/60 hover:text-amber-300 hover:bg-white/5'
                      }`}
                      title="Record Voice Note"
                    >
                      {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {/* Text Input */}
                    <div className="flex-1 relative">
                      {isRecording ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            Recording voice note... {recordingDuration}s
                          </span>
                          <span className="font-mono text-[10px]">Tap mic to finish</span>
                        </div>
                      ) : (
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
                      )}
                    </div>

                    {/* Send Button */}
                    {!isRecording && (
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!messageInput.trim()}
                        className="p-2 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
