import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type {
  Relationship,
  Profile,
  RelationshipRequest,
  RelationshipType,
  UserLocation,
} from '../types';
import { generatePairCode } from '../lib/utils';

interface RelationshipContextType {
  relationship: Relationship | null;
  partnerProfile: Profile | null;
  partnerLocation: UserLocation | null;
  myLocation: UserLocation | null;
  isPartnerOnline: boolean;
  incomingRequests: RelationshipRequest[];
  outgoingRequests: RelationshipRequest[];
  pairCode: string;
  loading: boolean;
  isDemoMode: boolean;
  createSpace: (relationType: RelationshipType, partnerName: string, startDate: string, targetPartnerProfile?: Profile) => Promise<void>;
  joinSpaceWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  sendPairRequest: (receiverUsername: string, type: RelationshipType, startDate?: string, message?: string) => Promise<{ success: boolean; error?: string }>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  disconnectRelationship: () => Promise<void>;
  updateRelationship: (updates: Partial<Relationship>) => Promise<void>;
  updateLocation: (lat: number, lng: number, accuracy?: number, batteryLevel?: number) => Promise<void>;
  toggleLocationSharing: (sharing: boolean) => Promise<void>;
  refreshRelationship: () => Promise<void>;
  setRelationshipDirectly: (rel: Relationship, partner: Profile) => void;
}

const RelationshipContext = createContext<RelationshipContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = '4ever_relationship_v1';

const getOrCreatePairCode = (): string => {
  try {
    const stored = localStorage.getItem('4ever_my_pair_code');
    if (stored && stored.length === 6) return stored;
    const newCode = generatePairCode();
    localStorage.setItem('4ever_my_pair_code', newCode);
    return newCode;
  } catch {
    return generatePairCode();
  }
};

export const RelationshipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<UserLocation | null>(null);
  const [myLocation, setMyLocation] = useState<UserLocation | null>(null);
  const [isPartnerOnline, setIsPartnerOnline] = useState<boolean>(false);
  const [incomingRequests, setIncomingRequests] = useState<RelationshipRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<RelationshipRequest[]>([]);
  const [pairCode, setPairCode] = useState<string>(getOrCreatePairCode);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const realtimeNetChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load from local storage for initial state or fallback
  const loadLocalRelationship = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRelationship(parsed.relationship);
        setPartnerProfile(parsed.partnerProfile);
        setPairCode(parsed.pairCode || getOrCreatePairCode());
        setIsDemoMode(true);
        return;
      }
    } catch {
      // ignore
    }
    setPairCode(getOrCreatePairCode());
  }, []);

  const saveLocalRelationship = (rel: Relationship | null, partner: Profile | null, code: string) => {
    try {
      if (rel) {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({ relationship: rel, partnerProfile: partner, pairCode: code })
        );
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  const fetchRelationship = useCallback(async () => {
    if (!user) {
      loadLocalRelationship();
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch active relationship from Supabase
      const { data: relData } = await supabase
        .from('relationships')
        .select('*')
        .or(`user_1.eq.${user.id},user_2.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      let activeRel: Relationship | null = (relData as Relationship) || null;

      // Fallback to shared all relationships
      if (!activeRel) {
        try {
          const allRelsRaw = localStorage.getItem('4ever_all_relationships_v1');
          if (allRelsRaw) {
            const allRels: Relationship[] = JSON.parse(allRelsRaw);
            const found = allRels.find(
              (r) => (r.user_1 === user.id || r.user_2 === user.id) && r.status === 'active'
            );
            if (found) activeRel = found;
          }
        } catch {}
      }

      if (!activeRel) {
        loadLocalRelationship();
        setLoading(false);
        return;
      }

      setRelationship(activeRel);
      setIsDemoMode(false);

      // 2. Fetch Partner Profile
      const partnerId = activeRel.user_1 === user.id ? activeRel.user_2 : activeRel.user_1;
      let partner: Profile | null = null;

      try {
        const cached = localStorage.getItem(`4ever_profile_${partnerId}`);
        if (cached) partner = JSON.parse(cached);
      } catch {}

      if (!partner) {
        try {
          const regRaw = localStorage.getItem('4ever_registered_profiles_v1');
          if (regRaw) {
            const list: Profile[] = JSON.parse(regRaw);
            partner = list.find((p) => p.id === partnerId) || null;
          }
        } catch {}
      }

      try {
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerId)
          .maybeSingle();
        if (partnerData) {
          partner = { ...(partner || {}), ...(partnerData as Profile) };
        }
      } catch {}

      if (!partner) {
        const partnerName = activeRel.user_1 === user.id ? activeRel.custom_nickname_2 : activeRel.custom_nickname_1;
        partner = {
          id: partnerId,
          email: '',
          username: partnerName?.toLowerCase().replace(/\s+/g, '_') || 'partner',
          display_name: partnerName || 'Partner',
          is_online: false,
        };
      }

      setPartnerProfile(partner);
      saveLocalRelationship(activeRel, partner, pairCode);

      // 3. Fetch Partner Location
      try {
        const { data: locData } = await supabase
          .from('user_locations')
          .select('*')
          .eq('user_id', partnerId)
          .maybeSingle();

        if (locData) {
          setPartnerLocation(locData as UserLocation);
        }
      } catch {}

      // 4. Fetch pending requests
      let combinedInReqs: RelationshipRequest[] = [];
      try {
        const localReqsRaw = localStorage.getItem('4ever_relationship_requests_v1');
        if (localReqsRaw) {
          const list: RelationshipRequest[] = JSON.parse(localReqsRaw);
          combinedInReqs = list.filter((r) => r.receiver_id === user.id && r.status === 'pending');
        }
      } catch {}

      try {
        const { data: inReqs } = await supabase
          .from('relationship_requests')
          .select('*')
          .eq('receiver_id', user.id)
          .eq('status', 'pending');

        if (inReqs) {
          inReqs.forEach((r: RelationshipRequest) => {
            if (!combinedInReqs.some((existing) => existing.id === r.id)) {
              combinedInReqs.push(r);
            }
          });
        }
      } catch {}

      setIncomingRequests(combinedInReqs);

      try {
        const { data: outReqs } = await supabase
          .from('relationship_requests')
          .select('*')
          .eq('sender_id', user.id)
          .eq('status', 'pending');

        if (outReqs) setOutgoingRequests(outReqs as RelationshipRequest[]);
      } catch {}
    } catch {
      loadLocalRelationship();
    } finally {
      setLoading(false);
    }
  }, [user, pairCode, loadLocalRelationship]);

  useEffect(() => {
    fetchRelationship();
  }, [fetchRelationship]);

  // Realtime network channel for requests, acceptance & live location
  useEffect(() => {
    const channel = supabase.channel('4ever_realtime_network_rel', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'social_event' }, ({ payload }) => {
        if (!payload) return;
        const myId = user?.id || profile?.id;
        if (!myId) return;

        // 1. Couple request received
        if (payload.type === 'couple_request' && payload.targetUserId === myId) {
          if (payload.request) {
            const incomingReq: RelationshipRequest = payload.request;
            setIncomingRequests((prev) => {
              if (prev.some((r) => r.id === incomingReq.id)) return prev;
              return [incomingReq, ...prev];
            });
          }
        }

        // 2. Couple request accepted by partner!
        if (payload.type === 'couple_accepted' && payload.targetUserId === myId) {
          if (payload.relationship && payload.partnerProfile) {
            setRelationship(payload.relationship);
            setPartnerProfile(payload.partnerProfile);
            setIsDemoMode(false);
            saveLocalRelationship(payload.relationship, payload.partnerProfile, pairCode);
            try {
              const allRelsRaw = localStorage.getItem('4ever_all_relationships_v1');
              const allRels: Relationship[] = allRelsRaw ? JSON.parse(allRelsRaw) : [];
              if (!allRels.some((r) => r.id === payload.relationship.id)) {
                allRels.unshift(payload.relationship);
                localStorage.setItem('4ever_all_relationships_v1', JSON.stringify(allRels));
              }
            } catch {}
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          }
        }

        // 3. Live GPS location update from partner
        if (payload.type === 'location_update' && payload.targetUserId === myId) {
          if (payload.location) {
            setPartnerLocation(payload.location);
          }
        }
      })
      .subscribe();

    realtimeNetChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, profile?.id, pairCode]);

  // Realtime Presence & Channels
  useEffect(() => {
    if (!relationship || !user) return;

    const channelName = `presence:relationship_${relationship.id}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const partnerId = relationship.user_1 === user.id ? relationship.user_2 : relationship.user_1;
        const partnerPresences = state[partnerId];
        setIsPartnerOnline(!!partnerPresences && partnerPresences.length > 0);
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
          filter: `relationship_id=eq.${relationship.id}`,
        },
        (payload) => {
          const loc = payload.new as UserLocation;
          if (loc.user_id !== user.id) {
            setPartnerLocation(loc);
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            display_name: profile?.display_name || 'User',
          });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [relationship, user, profile]);

  // Create space (Local + Cloud sync)
  const createSpace = async (
    relationType: RelationshipType,
    partnerName: string,
    startDate: string,
    targetPartnerProfile?: Profile
  ) => {
    const code = generatePairCode();
    const partnerId = targetPartnerProfile?.id || ('partner_' + code);

    const newRel: Relationship = {
      id: crypto.randomUUID(),
      user_1: user?.id || 'user_1',
      user_2: partnerId,
      relation_type: relationType,
      status: 'active',
      start_date: startDate,
      custom_nickname_1: profile?.display_name || 'Partner A',
      custom_nickname_2: partnerName,
      budget_limit: 5000,
      created_at: new Date().toISOString(),
    };

    const newPartner: Profile = targetPartnerProfile || {
      id: partnerId,
      email: '',
      username: partnerName.toLowerCase().replace(/\s+/g, '_'),
      display_name: partnerName,
      is_online: false,
    };

    setRelationship(newRel);
    setPartnerProfile(newPartner);
    setPairCode(code);
    saveLocalRelationship(newRel, newPartner, code);

    try {
      const allRelsRaw = localStorage.getItem('4ever_all_relationships_v1');
      const allRels: Relationship[] = allRelsRaw ? JSON.parse(allRelsRaw) : [];
      allRels.unshift(newRel);
      localStorage.setItem('4ever_all_relationships_v1', JSON.stringify(allRels));
    } catch {}

    // Try cloud write if logged in
    if (user) {
      try {
        await supabase.from('relationships').insert([newRel]);
      } catch {
        // Local fallback is already saved
      }
    }
  };

  // Join space via code
  const joinSpaceWithCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (code.length !== 6) {
      return { success: false, error: 'Pair code must be 6 characters' };
    }

    if (user) {
      try {
        const { data } = await supabase
          .from('relationship_requests')
          .select('*')
          .eq('pair_code', code.toUpperCase())
          .eq('status', 'pending')
          .maybeSingle();

        if (data) {
          await acceptRequest(data.id);
          return { success: true };
        }
      } catch {
        // fall through to local fallback
      }
    }

    // Local fallback join
    const fallbackRel: Relationship = {
      id: crypto.randomUUID(),
      user_1: 'partner_' + code,
      user_2: user?.id || 'user_current',
      relation_type: 'couple',
      status: 'active',
      start_date: new Date().toISOString().slice(0, 10),
      custom_nickname_1: 'Partner',
      custom_nickname_2: profile?.display_name || 'Me',
      budget_limit: 5000,
      created_at: new Date().toISOString(),
    };

    const fallbackPartner: Profile = {
      id: fallbackRel.user_1,
      email: '',
      username: 'partner_' + code.toLowerCase(),
      display_name: 'Partner',
      is_online: false,
    };

    setRelationship(fallbackRel);
    setPartnerProfile(fallbackPartner);
    setPairCode(code.toUpperCase());
    saveLocalRelationship(fallbackRel, fallbackPartner, code.toUpperCase());
    return { success: true };
  };

  // Send request by username or id
  const sendPairRequest = async (
    receiverUsernameOrId: string,
    type: RelationshipType,
    startDate?: string,
    message?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const myId = user?.id || profile?.id;
    if (!myId) return { success: false, error: 'Must be logged in to send requests' };

    try {
      const cleanTarget = receiverUsernameOrId.trim().toLowerCase().replace(/^@/, '');

      // 1. Search for target profile across registries
      let targetProfile: Profile | null = null;
      try {
        const regRaw = localStorage.getItem('4ever_registered_profiles_v1');
        if (regRaw) {
          const list: Profile[] = JSON.parse(regRaw);
          targetProfile = list.find(
            (p) => p.id === cleanTarget || p.username?.toLowerCase() === cleanTarget || (p.email && p.email.toLowerCase() === cleanTarget)
          ) || null;
        }
      } catch {}

      if (!targetProfile) {
        try {
          const socRaw = localStorage.getItem('4ever_real_users_v4');
          if (socRaw) {
            const list: Profile[] = JSON.parse(socRaw);
            targetProfile = list.find(
              (p) => p.id === cleanTarget || p.username?.toLowerCase() === cleanTarget || (p.email && p.email.toLowerCase() === cleanTarget)
            ) || null;
          }
        } catch {}
      }

      if (!targetProfile) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${cleanTarget},username.eq.${cleanTarget}`)
          .maybeSingle();
        if (data) targetProfile = data as Profile;
      }

      if (!targetProfile) {
        return { success: false, error: `User "@${receiverUsernameOrId}" not found` };
      }

      if (targetProfile.id === myId) {
        return { success: false, error: "You cannot pair with yourself!" };
      }

      const code = generatePairCode();
      const newRequest: RelationshipRequest = {
        id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        sender_id: myId,
        receiver_id: targetProfile.id,
        relation_type: type,
        start_date: startDate || new Date().toISOString().slice(0, 10),
        message: message || `Let's connect on 4ever!`,
        pair_code: code,
        status: 'pending',
        created_at: new Date().toISOString(),
        sender_profile: profile || undefined,
        receiver_profile: targetProfile,
      };

      setOutgoingRequests((prev) => [newRequest, ...prev]);

      try {
        const reqsRaw = localStorage.getItem('4ever_relationship_requests_v1');
        const reqs: RelationshipRequest[] = reqsRaw ? JSON.parse(reqsRaw) : [];
        reqs.unshift(newRequest);
        localStorage.setItem('4ever_relationship_requests_v1', JSON.stringify(reqs));
      } catch {}

      try {
        await supabase.from('relationship_requests').insert([newRequest]);
      } catch {}

      // Broadcast over Realtime so receiver immediately receives notification!
      realtimeNetChannelRef.current?.send({
        type: 'broadcast',
        event: 'social_event',
        payload: {
          type: 'couple_request',
          request: newRequest,
          sender: profile,
          targetUserId: targetProfile.id,
          relationType: type,
        },
      });

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  };

  const acceptRequest = async (requestId: string) => {
    const myId = user?.id || profile?.id;
    if (!myId) return;

    let reqData = incomingRequests.find((r) => r.id === requestId);
    if (!reqData) {
      try {
        const reqsRaw = localStorage.getItem('4ever_relationship_requests_v1');
        if (reqsRaw) {
          const list: RelationshipRequest[] = JSON.parse(reqsRaw);
          reqData = list.find((r) => r.id === requestId);
        }
      } catch {}
    }

    if (!reqData) {
      try {
        const { data } = await supabase.from('relationship_requests').select('*').eq('id', requestId).maybeSingle();
        if (data) reqData = data as RelationshipRequest;
      } catch {}
    }

    if (!reqData) return;

    const senderId = reqData.sender_id;
    let senderProfile: Profile | null = reqData.sender_profile || null;
    if (!senderProfile) {
      try {
        const regRaw = localStorage.getItem('4ever_registered_profiles_v1');
        if (regRaw) {
          const list: Profile[] = JSON.parse(regRaw);
          senderProfile = list.find((p) => p.id === senderId) || null;
        }
      } catch {}
    }
    if (!senderProfile) {
      senderProfile = {
        id: senderId,
        email: '',
        username: 'partner_' + senderId.slice(0, 5),
        display_name: 'Partner',
        is_online: true,
      };
    }

    const newRel: Relationship = {
      id: 'rel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_1: senderId,
      user_2: myId,
      relation_type: reqData.relation_type || 'couple',
      start_date: reqData.start_date || new Date().toISOString().slice(0, 10),
      status: 'active',
      custom_nickname_1: senderProfile.display_name,
      custom_nickname_2: profile?.display_name || 'Me',
      budget_limit: 5000,
      created_at: new Date().toISOString(),
    };

    setRelationship(newRel);
    setPartnerProfile(senderProfile);
    setIsDemoMode(false);
    saveLocalRelationship(newRel, senderProfile, pairCode);

    try {
      const allRelsRaw = localStorage.getItem('4ever_all_relationships_v1');
      const allRels: Relationship[] = allRelsRaw ? JSON.parse(allRelsRaw) : [];
      allRels.unshift(newRel);
      localStorage.setItem('4ever_all_relationships_v1', JSON.stringify(allRels));
    } catch {}

    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));

    try {
      const reqsRaw = localStorage.getItem('4ever_relationship_requests_v1');
      if (reqsRaw) {
        const list: RelationshipRequest[] = JSON.parse(reqsRaw);
        const updated = list.map((r) => (r.id === requestId ? { ...r, status: 'accepted' as const } : r));
        localStorage.setItem('4ever_relationship_requests_v1', JSON.stringify(updated));
      }
    } catch {}

    // Supabase sync
    try {
      await supabase.from('relationships').insert([newRel]);
      await supabase.from('relationship_requests').update({ status: 'accepted' }).eq('id', requestId);
      await supabase.from('profiles').update({
        relationship_partner_name: senderProfile.display_name,
        relationship_partner_username: senderProfile.username,
        relationship_role: reqData.relation_type === 'couple' ? 'girlfriend' : 'partner',
      }).eq('id', myId);
      await supabase.from('profiles').update({
        relationship_partner_name: profile?.display_name || 'Partner',
        relationship_partner_username: profile?.username || 'partner',
        relationship_role: reqData.relation_type === 'couple' ? 'boyfriend' : 'partner',
      }).eq('id', senderId);
    } catch {}

    // Broadcast couple_accepted to sender!
    realtimeNetChannelRef.current?.send({
      type: 'broadcast',
      event: 'social_event',
      payload: {
        type: 'couple_accepted',
        relationship: newRel,
        partnerProfile: profile,
        targetUserId: senderId,
      },
    });

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
  };

  const declineRequest = async (requestId: string) => {
    try {
      await supabase
        .from('relationship_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      // ignore
    }
  };

  const disconnectRelationship = async () => {
    if (relationship && user && !isDemoMode) {
      try {
        await supabase
          .from('relationships')
          .delete()
          .eq('id', relationship.id);
      } catch {
        // ignore
      }
    }
    setRelationship(null);
    setPartnerProfile(null);
    saveLocalRelationship(null, null, '');
    const newCode = generatePairCode();
    try {
      localStorage.setItem('4ever_my_pair_code', newCode);
    } catch {
      // ignore
    }
    setPairCode(newCode);
  };

  const updateRelationship = async (updates: Partial<Relationship>) => {
    if (!relationship) return;
    const updated = { ...relationship, ...updates };
    setRelationship(updated);
    saveLocalRelationship(updated, partnerProfile, pairCode);

    if (user && !isDemoMode) {
      try {
        await supabase
          .from('relationships')
          .update(updates)
          .eq('id', relationship.id);
      } catch {
        // ignore
      }
    }
  };

  const setRelationshipDirectly = useCallback(
    (rel: Relationship, partner: Profile) => {
      setRelationship(rel);
      setPartnerProfile(partner);
      setIsDemoMode(false);
      saveLocalRelationship(rel, partner, pairCode);
      try {
        const allRelsRaw = localStorage.getItem('4ever_all_relationships_v1');
        const allRels: Relationship[] = allRelsRaw ? JSON.parse(allRelsRaw) : [];
        if (!allRels.some((r) => r.id === rel.id)) {
          allRels.unshift(rel);
          localStorage.setItem('4ever_all_relationships_v1', JSON.stringify(allRels));
        }
      } catch {}
    },
    [pairCode]
  );

  const updateLocation = async (lat: number, lng: number, accuracy?: number, batteryLevel?: number) => {
    const myId = user?.id || profile?.id;
    if (!myId) return;

    const loc: UserLocation = {
      user_id: myId,
      relationship_id: relationship?.id || 'space_default',
      latitude: lat,
      longitude: lng,
      accuracy,
      battery_level: batteryLevel,
      is_sharing: true,
      updated_at: new Date().toISOString(),
    };

    setMyLocation(loc);

    // Realtime broadcast to partner!
    if (partnerProfile?.id) {
      realtimeNetChannelRef.current?.send({
        type: 'broadcast',
        event: 'social_event',
        payload: {
          type: 'location_update',
          location: loc,
          targetUserId: partnerProfile.id,
        },
      });
    }

    try {
      await supabase.from('user_locations').upsert(loc);
    } catch {
      // ignore
    }
  };

  const toggleLocationSharing = async (sharing: boolean) => {
    if (!user || !relationship || !myLocation) return;
    const updated = { ...myLocation, is_sharing: sharing, updated_at: new Date().toISOString() };
    setMyLocation(updated);
    try {
      await supabase.from('user_locations').upsert(updated);
    } catch {
      // ignore
    }
  };

  return (
    <RelationshipContext.Provider
      value={{
        relationship,
        partnerProfile,
        partnerLocation,
        myLocation,
        isPartnerOnline,
        incomingRequests,
        outgoingRequests,
        pairCode,
        loading,
        isDemoMode,
        createSpace,
        joinSpaceWithCode,
        sendPairRequest,
        acceptRequest,
        declineRequest,
        disconnectRelationship,
        updateRelationship,
        updateLocation,
        toggleLocationSharing,
        refreshRelationship: fetchRelationship,
        setRelationshipDirectly,
      }}
    >
      {children}
    </RelationshipContext.Provider>
  );
};

export const useRelationship = () => {
  const context = useContext(RelationshipContext);
  if (!context) {
    throw new Error('useRelationship must be used within a RelationshipProvider');
  }
  return context;
};
