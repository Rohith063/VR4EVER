import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Shield, Battery, RefreshCw, Send } from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';
import { calculateDistance } from '../lib/utils';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendLocationToChat?: (lat: number, lng: number, address?: string) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onSendLocationToChat,
}) => {
  const {
    partnerProfile,
    partnerLocation,
    myLocation,
    updateLocation,
    toggleLocationSharing,
    isPartnerOnline,
  } = useRelationship();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let batteryLevel: number | undefined;

        // Try getting battery status if API available
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nav = navigator as any;
          if (nav.getBattery) {
            const battery = await nav.getBattery();
            batteryLevel = Math.round(battery.level * 100);
          }
        } catch {
          // ignore
        }

        await updateLocation(latitude, longitude, accuracy, batteryLevel);
        setLoading(false);
      },
      (err) => {
        console.error('Geo error:', err);
        setError('Location permission denied or unavailable');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    if (isOpen && !myLocation) {
      fetchCurrentLocation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (myLocation && partnerLocation && partnerLocation.is_sharing) {
      const dist = calculateDistance(
        myLocation.latitude,
        myLocation.longitude,
        partnerLocation.latitude,
        partnerLocation.longitude
      );
      setDistanceKm(dist);
    } else {
      setDistanceKm(null);
    }
  }, [myLocation, partnerLocation]);

  const handleShareInChat = () => {
    if (myLocation && onSendLocationToChat) {
      onSendLocationToChat(myLocation.latitude, myLocation.longitude);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card relative w-full max-w-md overflow-hidden border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <Navigation className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Distance & Location Radar</h3>
                <p className="text-[10px] text-zinc-400">Live distance & shared check-ins</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Distance Radar Card */}
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 to-transparent p-6 text-center">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
              
              {distanceKm !== null ? (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[2px] text-sky-400">
                    Distance Apart
                  </span>
                  <div className="font-display my-2 text-5xl font-black text-white">
                    {distanceKm} <span className="text-lg font-normal text-sky-300">km</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    {distanceKm < 0.5
                      ? '💛 You two are right next to each other!'
                      : distanceKm < 5
                      ? '🚗 Close by in the same area'
                      : '✈️ Miles apart, but close at heart'}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  <div className="font-display text-2xl font-bold text-zinc-300">
                    {partnerLocation?.is_sharing === false
                      ? `${partnerProfile?.display_name || 'Partner'} paused location`
                      : 'Waiting for coordinates...'}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Both users must allow location sharing to calculate distance.
                  </p>
                </div>
              )}
            </div>

            {/* Partner Status Pill */}
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/60 p-3">
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {partnerProfile?.display_name || 'Partner'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPartnerOnline
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isPartnerOnline ? 'Active Now' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {partnerLocation
                      ? `Updated ${new Date(partnerLocation.updated_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'No location ping yet'}
                  </p>
                </div>
              </div>

              {partnerLocation?.battery_level !== undefined && (
                <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
                  <Battery className="h-4 w-4" />
                  {partnerLocation.battery_level}%
                </div>
              )}
            </div>

            {/* My Location Status & Sharing Switch */}
            <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">My Sharing Status</span>
                </div>
                <button
                  onClick={() => toggleLocationSharing(!(myLocation?.is_sharing ?? true))}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    myLocation?.is_sharing ?? true
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {myLocation?.is_sharing ?? true ? 'Sharing Active' : 'Paused (Hidden)'}
                </button>
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={fetchCurrentLocation}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Locating...' : 'Refresh Location'}
              </button>

              <button
                onClick={handleShareInChat}
                disabled={!myLocation}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl gradient-golden py-2.5 text-xs font-bold text-black shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Drop Pin in Chat
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
