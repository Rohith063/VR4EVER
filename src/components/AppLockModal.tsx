import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, Shield, Heart } from 'lucide-react';
import { useAppLock } from '../context/AppLockContext';

export const AppLockModal: React.FC = () => {
  const { isLockEnabled, isUnlocked, unlock } = useAppLock();
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset pin when screen opens
  useEffect(() => {
    setPin('');
    setErrorMsg('');
  }, [isUnlocked]);

  // Don't render if lock is disabled or already unlocked
  if (!isLockEnabled || isUnlocked) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 4) {
        // Auto-check PIN
        setTimeout(() => {
          const success = unlock(newPin);
          if (!success) {
            setErrorShake(true);
            setErrorMsg('Incorrect passcode');
            setTimeout(() => {
              setErrorShake(false);
              setPin('');
            }, 600);
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin((prev) => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-[#0c0d11] text-white flex flex-col items-center justify-between p-6 sm:p-10 select-none">
        {/* Glow ambient */}
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col items-center space-y-3 pt-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/10 mb-2">
            <Lock className="w-7 h-7" />
          </div>

          <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-amber-400/80 font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Couple Privacy Lock</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Enter 4-Digit Passcode
          </h1>
          <p className="text-xs text-white/50 max-w-xs">
            Your space is password-protected. Enter your PIN to open your universe.
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <motion.div
          animate={errorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center space-y-4 my-6"
        >
          <div className="flex items-center gap-4">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                    isFilled
                      ? 'bg-amber-400 border-amber-300 scale-110 shadow-lg shadow-amber-400/30'
                      : 'border-white/30 bg-white/5'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium tracking-wide animate-pulse">
              {errorMsg}
            </p>
          )}
        </motion.div>

        {/* Mobile Keypad (1 - 9, Delete, 0) */}
        <div className="w-full max-w-xs grid grid-cols-3 gap-4 pb-8">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-500/20 active:scale-95 border border-white/10 text-xl font-semibold flex items-center justify-center transition-all cursor-pointer text-white"
            >
              {num}
            </button>
          ))}

          {/* Bottom row: Empty / Heart, 0, Delete */}
          <div className="flex items-center justify-center text-white/30">
            <Heart className="w-5 h-5 fill-current opacity-30" />
          </div>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-500/20 active:scale-95 border border-white/10 text-xl font-semibold flex items-center justify-center transition-all cursor-pointer text-white"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            title="Delete digit"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
};
