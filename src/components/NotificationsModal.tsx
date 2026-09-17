import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  Heart,
  UserPlus,
  Check,
  Sparkles,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markAllNotificationsRead,
    acceptNotificationRequest,
    declineNotificationRequest,
    openUserProfile,
  } = useSocial();

  if (!isNotificationsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#121319] border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#14161f]/80 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-amber-300" />
              <span className="font-bold text-base tracking-tight text-white">Notifications</span>
              {notifications.some((n) => !n.is_read) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-[11px] text-amber-300/80 hover:text-amber-300 font-medium cursor-pointer"
              >
                Mark read
              </button>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const isCoupleReq = notif.type === 'couple_request';
                const isFriendReq = notif.type === 'friend_request';
                const isPending = notif.request_status === 'pending';

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCoupleReq
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : !notif.is_read
                        ? 'bg-white/10 border-amber-500/30'
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          openUserProfile(notif.from_user_id);
                        }}
                        className="relative flex-shrink-0 cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-amber-400 transition-all">
                          {notif.from_user_avatar ? (
                            <img
                              src={notif.from_user_avatar}
                              alt={notif.from_user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center font-bold text-xs text-amber-300">
                              {notif.from_user_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                            isCoupleReq
                              ? 'bg-rose-500 text-white'
                              : isFriendReq
                              ? 'bg-blue-500 text-white'
                              : 'bg-amber-500 text-black'
                          }`}
                        >
                          {isCoupleReq ? (
                            <Heart className="w-2.5 h-2.5 fill-white" />
                          ) : isFriendReq ? (
                            <UserPlus className="w-2.5 h-2.5" />
                          ) : (
                            <Sparkles className="w-2.5 h-2.5" />
                          )}
                        </div>
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white leading-snug">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              openUserProfile(notif.from_user_id);
                            }}
                            className="font-semibold hover:text-amber-300 cursor-pointer mr-1"
                          >
                            @{notif.from_user_username}
                          </button>
                          <span className="text-white/80">{notif.content}</span>
                        </p>
                        <p className="text-[10px] text-white/40 mt-1">
                          {new Date(notif.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>

                        {/* Actions for requests */}
                        {(isCoupleReq || isFriendReq) && (
                          <div className="mt-2.5 flex items-center space-x-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => acceptNotificationRequest(notif.id)}
                                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center space-x-1 shadow-md cursor-pointer transition-all active:scale-95 ${
                                    isCoupleReq
                                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                                      : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>{isCoupleReq ? 'Accept Forever ❤️' : 'Accept'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => declineNotificationRequest(notif.id)}
                                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium cursor-pointer transition-colors"
                                >
                                  Decline
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                {notif.request_status === 'accepted' ? 'Accepted' : 'Declined'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-white/40">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No notifications right now</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
