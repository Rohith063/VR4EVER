import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'video' | 'audio';
}

export const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, callType }) => {
  const { relationship, partnerProfile } = useRelationship();

  const partnerName =
    relationship?.custom_nickname_2 || partnerProfile?.display_name || 'Partner';

  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Auto-connect after 2 seconds to simulate partner picking up
  useEffect(() => {
    if (!isOpen) return;

    setCallStatus('ringing');
    setDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);

    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 2200);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Call timer effect
  useEffect(() => {
    let interval: number | null = null;
    if (isOpen && callStatus === 'connected') {
      interval = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, callStatus]);

  // Camera stream for local video preview
  useEffect(() => {
    if (isOpen && callType === 'video' && !isVideoOff) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode }, audio: false })
        .then((stream) => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera permission denied or not available
        });
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [isOpen, callType, isVideoOff, facingMode]);

  const handleEndCall = () => {
    setCallStatus('ended');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleToggleFlip = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#0c0d11] text-white flex flex-col justify-between overflow-hidden">
        {/* Top bar */}
        <div className="relative z-20 flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs uppercase tracking-widest font-semibold text-white/60">
              End-to-End Encrypted Call
            </span>
          </div>

          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-mono font-bold text-amber-300">
            {callStatus === 'ringing' ? 'Ringing...' : formatTime(duration)}
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          {/* Partner Avatar with animated ripples */}
          <div className="relative flex items-center justify-center">
            {callStatus === 'ringing' && (
              <div className="absolute w-40 h-40 rounded-full bg-amber-500/10 animate-ping pointer-events-none" />
            )}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-amber-500/30 to-amber-300/10 border-2 border-amber-400/40 flex items-center justify-center text-4xl sm:text-5xl font-serif font-bold text-amber-300 shadow-2xl shadow-amber-500/20">
              {partnerName.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-wide">
              {partnerName}
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mt-1 capitalize">
              {callStatus === 'ringing'
                ? `Calling ${partnerName}...`
                : callType === 'video'
                ? '4EVER HD Video Call'
                : '4EVER HD Voice Call'}
            </p>
          </div>
        </div>

        {/* Local Video Picture-in-Picture for Video Call */}
        {callType === 'video' && (
          <div className="absolute top-20 right-6 z-30 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
            {isVideoOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-white/40 bg-zinc-900">
                <VideoOff className="w-6 h-6 mb-1" />
                <span>Camera Off</span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="relative z-20 pb-10 pt-4 px-6 flex items-center justify-center gap-4 sm:gap-6">
          {/* Mute Mic Button */}
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isMuted
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Video Toggle if video call */}
          {callType === 'video' && (
            <>
              <button
                type="button"
                onClick={() => setIsVideoOff((prev) => !prev)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  isVideoOff
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                }`}
                title={isVideoOff ? 'Turn on video' : 'Turn off video'}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>

              <button
                type="button"
                onClick={handleToggleFlip}
                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center justify-center transition-all active:scale-95"
                title="Flip Camera"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            </>
          )}

          {callType === 'audio' && (
            <button
              type="button"
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center justify-center transition-all active:scale-95"
              title="Speaker"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          )}

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-xl shadow-rose-600/30 active:scale-95 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
};
