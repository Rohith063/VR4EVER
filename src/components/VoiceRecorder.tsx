import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Send } from 'lucide-react';

interface VoiceRecorderProps {
  onAudioRecorded: (audioDataUrl: string, durationSec: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioRecorded,
  onCancel,
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((userStream) => {
        stream = userStream;
        const mediaRecorder = new MediaRecorder(userStream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              onAudioRecorded(reader.result as string, recordingTime);
            }
          };
          reader.readAsDataURL(audioBlob);

          // Stop mic tracks
          stream?.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();

        // Start timer
        timerRef.current = window.setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      })
      .catch(() => {
        // Fallback simulated recording if mic access blocked
        timerRef.current = window.setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleStopAndSend = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // Mock audio data URL for demo or fallback
      onAudioRecorded('data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAA', Math.max(1, recordingTime));
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    onCancel();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2 w-full animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
        <span className="font-mono text-xs font-bold text-amber-300">
          {formatTimer(recordingTime)}
        </span>
      </div>

      {/* Animated Waveform Bars */}
      <div className="flex-1 flex items-center justify-center gap-1 h-6 overflow-hidden px-2">
        {[8, 14, 22, 12, 18, 24, 10, 16, 20, 12, 18, 22, 10, 14].map((height, i) => (
          <div
            key={i}
            className="w-1 bg-amber-400/80 rounded-full animate-pulse"
            style={{
              height: `${height}px`,
              animationDelay: `${i * 70}ms`,
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCancelRecording}
          className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
          title="Cancel recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
          title="Send voice note"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
