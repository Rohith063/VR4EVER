import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Send, Check, Heart, Users, Sparkles, Copy, AlertCircle } from 'lucide-react';
import { useRelationship } from '../context/RelationshipContext';
import type { RelationshipType } from '../types';

interface RequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestsModal: React.FC<RequestsModalProps> = ({ isOpen, onClose }) => {
  const { incomingRequests, outgoingRequests, pairCode, sendPairRequest, acceptRequest, declineRequest } = useRelationship();

  const [activeTab, setActiveTab] = useState<'incoming' | 'send'>('incoming');
  const [partnerUsername, setPartnerUsername] = useState('');
  const [relationType, setRelationType] = useState<RelationshipType>('couple');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [customMessage, setCustomMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!pairCode) return;
    navigator.clipboard.writeText(pairCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!partnerUsername.trim()) {
      setErrorMessage('Please enter partner username');
      return;
    }

    setSubmitting(true);
    const result = await sendPairRequest(
      partnerUsername.trim().replace(/^@/, ''),
      relationType,
      startDate,
      customMessage.trim() || undefined
    );

    setSubmitting(false);
    if (result.success) {
      setSuccessMessage(`Request sent to @${partnerUsername.trim().replace(/^@/, '')}!`);
      setPartnerUsername('');
      setCustomMessage('');
    } else {
      setErrorMessage(result.error || 'Failed to send request');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white tracking-wide">Connect & Pair</h3>
                <p className="text-xs text-white/50">Pair with your partner or best friend</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 bg-white/5 p-1 gap-1">
            <button
              onClick={() => {
                setActiveTab('incoming');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                activeTab === 'incoming'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Requests Received
              {incomingRequests.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {incomingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('send');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'send'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Send Request
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'incoming' ? (
              <div className="space-y-4">
                {incomingRequests.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-white/80 font-medium">No pending incoming requests</p>
                    <p className="text-xs text-white/40 max-w-xs mx-auto">
                      When your partner sends a pairing invite by username or pair code, you can accept it right here!
                    </p>
                  </div>
                ) : (
                  incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {req.sender_profile?.display_name || 'Someone'}
                            </span>
                            <span className="text-xs text-white/40">
                              @{req.sender_profile?.username || 'user'}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {req.relation_type}
                            </span>
                            {req.start_date && (
                              <span className="text-xs text-white/50">
                                Since {new Date(req.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {req.message && (
                        <p className="text-xs italic text-white/70 bg-black/20 p-2.5 rounded-lg border border-white/5">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => acceptRequest(req.id)}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/30"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Connection
                        </button>
                        <button
                          onClick={() => declineRequest(req.id)}
                          className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white/60 hover:text-white text-xs font-medium transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {outgoingRequests.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Outgoing Pending Requests
                    </h4>
                    <div className="space-y-2">
                      {outgoingRequests.map((out) => (
                        <div
                          key={out.id}
                          className="p-3 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="text-white/80 font-medium">Request to User</span>
                            <span className="ml-2 text-white/40 capitalize">({out.relation_type})</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                            Awaiting response
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Partner&apos;s Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-white/40 text-sm">@</span>
                    <input
                      type="text"
                      value={partnerUsername}
                      onChange={(e) => setPartnerUsername(e.target.value)}
                      placeholder="e.g. ananya_24"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Connection Space Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'couple', label: 'Couple', icon: Heart },
                        { id: 'bestfriends', label: 'Best Friends', icon: Sparkles },
                        { id: 'siblings', label: 'Siblings', icon: Users },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      const isSelected = relationType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRelationType(item.id)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                              : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-white/40'}`} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Anniversary / Since Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Personal Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="e.g. Come join our personal 4EVER universe!"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Sending...' : 'Send Pairing Request'}
                </button>
              </form>
            )}

            {/* Direct Pair Code Box */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" /> Your Pair Code
                </span>
                <span className="text-[10px] text-white/40">Share with partner to join directly</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2 px-3 rounded-xl bg-black/40 border border-white/10 font-mono text-center tracking-widest text-base font-bold text-amber-300">
                  {pairCode || '4EVR01'}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
