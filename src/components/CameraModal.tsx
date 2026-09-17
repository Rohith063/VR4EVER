import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RefreshCw, Sparkles, Download, Send } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured?: (photoDataUrl: string, caption?: string) => void;
}

type FilterPreset = 'normal' | 'warm' | 'vintage' | 'bw';

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onPhotoCaptured }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterPreset>('normal');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startCamera = async (mode: 'user' | 'environment') => {
    try {
      setError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please allow camera permissions or try uploading a photo.');
    }
  };

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera(facingMode);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const switchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Apply color filter on canvas
    if (filter === 'warm') {
      ctx.filter = 'sepia(0.2) saturate(1.3) contrast(1.1)';
    } else if (filter === 'vintage') {
      ctx.filter = 'sepia(0.5) contrast(0.9) brightness(1.1)';
    } else if (filter === 'bw') {
      ctx.filter = 'grayscale(1) contrast(1.2)';
    }

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(dataUrl);

    // Stop stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    setCaption('');
    startCamera(facingMode);
  };

  const handleSend = () => {
    if (capturedPhoto && onPhotoCaptured) {
      onPhotoCaptured(capturedPhoto, caption);
    }
    onClose();
  };

  const downloadPhoto = () => {
    if (!capturedPhoto) return;
    const a = document.createElement('a');
    a.href = capturedPhoto;
    a.download = `4ever_moment_${Date.now()}.jpg`;
    a.click();
  };

  const getFilterStyle = () => {
    if (filter === 'warm') return 'sepia-[0.2] saturate-[1.3] contrast-[1.1]';
    if (filter === 'vintage') return 'sepia-[0.5] contrast-[0.9] brightness-[1.1]';
    if (filter === 'bw') return 'grayscale contrast-[1.2]';
    return '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card relative w-full max-w-lg overflow-hidden border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-amber-400" />
              <span className="font-semibold text-white">4ever Moments</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Viewfinder Area */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-black flex items-center justify-center">
            {error ? (
              <div className="p-6 text-center text-sm text-rose-300">
                <p>{error}</p>
                <button
                  onClick={() => startCamera(facingMode)}
                  className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
                >
                  Retry Camera
                </button>
              </div>
            ) : capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Captured moment"
                className={`h-full w-full object-cover ${getFilterStyle()}`}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                } ${getFilterStyle()}`}
              />
            )}

            {/* In-viewfinder Controls */}
            {!capturedPhoto && !error && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={switchCamera}
                  className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
                  title="Switch Camera"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          {!capturedPhoto && !error && (
            <div className="flex items-center justify-center gap-2 border-t border-white/5 bg-black/40 px-4 py-2.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400/80 mr-1" />
              {(
                [
                  { id: 'normal', label: 'Original' },
                  { id: 'warm', label: 'Warm Glow' },
                  { id: 'vintage', label: 'Vintage' },
                  { id: 'bw', label: 'Noir (B&W)' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    filter === f.id
                      ? 'bg-amber-400 text-black font-semibold'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="border-t border-white/10 p-4">
            {capturedPhoto ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Write a sweet caption or memory note..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/60 transition-colors"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={retake}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={downloadPhoto}
                    className="rounded-xl border border-white/10 p-2.5 text-zinc-300 hover:bg-white/5 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSend}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-xl gradient-golden py-2.5 text-xs font-bold text-black shadow-lg hover:opacity-95 transition-opacity"
                  >
                    <Send className="h-4 w-4" />
                    Share with Partner
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  onClick={takeSnapshot}
                  disabled={!!error}
                  className="group relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/80 p-1 transition-transform active:scale-95 disabled:opacity-50"
                >
                  <div className="h-full w-full rounded-full gradient-golden transition-transform group-hover:scale-90" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
