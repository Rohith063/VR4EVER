import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  createSpace: (relationType: RelationshipType, partnerName: string, startDate: string) => Promise<void>;
  joinSpaceWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  sendPairRequest: (receiverUsername: string, type: RelationshipType, startDate?: string, message?: string) => Promise<{ success: boolean; error?: string }>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  disconnectRelationship: () => Promise<void>;
  updateRelationship: (updates: Partial<Relationship>) => Promise<void>;
  updateLocation: (lat: number, lng: number, accuracy?: number, batteryLevel?: number) => Promise<void>;
  toggleLocationSharing: (sharing: boolean) => Promise<void>;
  refreshRelationship: () => Promise<void>;
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
      const { data: relData, error: relError } = await supabase
        .from('relationships')
        .select('*')
        .or(`user_1.eq.${user.id},user_2.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      if (relError || !relData) {
        // Fallback to local storage if no database row found
        loadLocalRelationship();
        setLoading(false);
        return;
      }

      setRelationship(relData as Relationship);
      setIsDemoMode(false);

      // 2. Fetch Partner Profile
      const partnerId = relData.user_1 === user.id ? relData.user_2 : relData.user_1;
      const { data: partnerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .maybeSingle();

      if (partnerData) {
        setPartnerProfile(partnerData as Profile);
      } else {
        const partnerName = relData.user_1 === user.id ? relData.custom_nickname_2 : relData.custom_nickname_1;
        setPartnerProfile({
          id: partnerId,
          email: '',
          username: partnerName?.toLowerCase().replace(/\s+/g, '_') || 'partner',
          display_name: partnerName || 'Partner',
          is_online: false,
        });
      }

      // 3. Fetch Partner Location
      const { data: locData } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', partnerId)
        .maybeSingle();

      if (locData) {
        setPartnerLocation(locData as UserLocation);
      }

      // Fetch pending requests
      const { data: inReqs } = await supabase
        .from('relationship_requests')
        .select('*, sender_profile:profiles!relationship_requests_sender_id_fkey(*)')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (inReqs) setIncomingRequests(inReqs as RelationshipRequest[]);

      const { data: outReqs } = await supabase
        .from('relationship_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('status', 'pending');

      if (outReqs) setOutgoingRequests(outReqs as RelationshipRequest[]);
    } catch {
      loadLocalRelationship();
    } finally {
      setLoading(false);
    }
  }, [user, loadLocalRelationship]);

  useEffect(() => {
    fetchRelationship();
  }, [fetchRelationship]);

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
  const createSpace = async (relationType: RelationshipType, partnerName: string, startDate: string) => {
    const code = generatePairCode();
    const newRel: Relationship = {
      id: crypto.randomUUID(),
      user_1: user?.id || 'user_1',
      user_2: 'partner_' + code,
      relation_type: relationType,
      status: 'active',
      start_date: startDate,
      custom_nickname_1: profile?.display_name || 'Partner A',
      custom_nickname_2: partnerName,
      budget_limit: 5000,
      created_at: new Date().toISOString(),
    };

    const newPartner: Profile = {
      id: newRel.user_2,
      email: '',
      username: partnerName.toLowerCase().replace(/\s+/g, '_'),
      display_name: partnerName,
      is_online: false,
    };

    setRelationship(newRel);
    setPartnerProfile(newPartner);
    setPairCode(code);
    saveLocalRelationship(newRel, newPartner, code);

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

    // Check if cloud request exists with this pair_code
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

  // Send request by username
  const sendPairRequest = async (
    receiverUsername: string,
    type: RelationshipType,
    startDate?: string,
    message?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Must be logged in to send requests' };

    try {
      const { data: targetProfile, error: targetError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', receiverUsername.trim().toLowerCase())
        .maybeSingle();

      if (targetError || !targetProfile) {
        return { success: false, error: `User "@${receiverUsername}" not found` };
      }

      if (targetProfile.id === user.id) {
        return { success: false, error: "You cannot pair with yourself!" };
      }

      const code = generatePairCode();
      const newRequest: Partial<RelationshipRequest> = {
        sender_id: user.id,
        receiver_id: targetProfile.id,
        relation_type: type,
        start_date: startDate || new Date().toISOString().slice(0, 10),
        message: message || `Let's connect on 4ever!`,
        pair_code: code,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('relationship_requests')
        .insert([newRequest])
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      setOutgoingRequests((prev) => [data as RelationshipRequest, ...prev]);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  };

  const acceptRequest = async (requestId: string) => {
    if (!user) return;
    try {
      const { data: reqData, error: reqError } = await supabase
        .from('relationship_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (reqError || !reqData) return;

      // Create new active relationship
      const newRel: Partial<Relationship> = {
        user_1: reqData.sender_id,
        user_2: user.id,
        relation_type: reqData.relation_type,
        start_date: reqData.start_date || new Date().toISOString().slice(0, 10),
        status: 'active',
        budget_limit: 5000,
      };

      const { data: createdRel } = await supabase
        .from('relationships')
        .insert([newRel])
        .select()
        .single();

      // Mark request accepted
      await supabase
        .from('relationship_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (createdRel) {
        setRelationship(createdRel as Relationship);
        await fetchRelationship();
      }
    } catch {
      // ignore
    }
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

  const updateLocation = async (lat: number, lng: number, accuracy?: number, batteryLevel?: number) => {
    if (!user || !relationship) return;

    const loc: UserLocation = {
      user_id: user.id,
      relationship_id: relationship.id,
      latitude: lat,
      longitude: lng,
      accuracy,
      battery_level: batteryLevel,
      is_sharing: true,
      updated_at: new Date().toISOString(),
    };

    setMyLocation(loc);

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
