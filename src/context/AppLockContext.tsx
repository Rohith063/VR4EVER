import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppLockContextType {
  isLockEnabled: boolean;
  isUnlocked: boolean;
  enableLock: (pin: string) => void;
  disableLock: () => void;
  unlock: (pin: string) => boolean;
  lockNow: () => void;
  changePin: (newPin: string) => void;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

const STORAGE_LOCK_ENABLED = '4ever_lock_enabled';
const STORAGE_LOCK_PIN = '4ever_lock_pin';

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLockEnabled, setIsLockEnabled] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_LOCK_ENABLED) === 'true';
  });

  const [savedPin, setSavedPin] = useState<string>(() => {
    return localStorage.getItem(STORAGE_LOCK_PIN) || '';
  });

  // If lock is enabled, start as locked; if disabled, unlocked
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const enabled = localStorage.getItem(STORAGE_LOCK_ENABLED) === 'true';
    return !enabled;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_LOCK_ENABLED, String(isLockEnabled));
    if (savedPin) {
      localStorage.setItem(STORAGE_LOCK_PIN, savedPin);
    } else {
      localStorage.removeItem(STORAGE_LOCK_PIN);
    }
  }, [isLockEnabled, savedPin]);

  const enableLock = (pin: string) => {
    setSavedPin(pin);
    setIsLockEnabled(true);
    setIsUnlocked(true);
  };

  const disableLock = () => {
    setIsLockEnabled(false);
    setSavedPin('');
    setIsUnlocked(true);
  };

  const unlock = (pin: string): boolean => {
    if (!isLockEnabled || pin === savedPin) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lockNow = () => {
    if (isLockEnabled) {
      setIsUnlocked(false);
    }
  };

  const changePin = (newPin: string) => {
    setSavedPin(newPin);
  };

  return (
    <AppLockContext.Provider
      value={{
        isLockEnabled,
        isUnlocked,
        enableLock,
        disableLock,
        unlock,
        lockNow,
        changePin,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
};

export const useAppLock = () => {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
};
