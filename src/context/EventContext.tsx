import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { SacEvent, Player, Match, Round, HoleScore } from '@/lib/types';
import { calculateMatchResult } from '@/lib/scoring';
import { isConfigured } from '@/lib/firebase';
import {
  subscribeToEvent, subscribeToRounds, subscribeToMatches,
  subscribeToPlayers, updateHoleScoreInFirestore, updateMatchStatusInFirestore,
} from '@/lib/firestore';
import { DEMO_EVENT, DEMO_PLAYERS } from '@/data/demo';

interface EventContextValue {
  event: SacEvent;
  players: Player[];
  loading: boolean;
  firebaseConnected: boolean;
  getPlayer: (id: string) => Player | undefined;
  getMatch: (matchId: string) => Match | undefined;
  updateHoleScore: (matchId: string, hole: number, team1Score: number | null, team2Score: number | null) => void;
  updateMatchStatus: (matchId: string, status: Match['status']) => void;
}

const EventContext = createContext<EventContextValue | null>(null);

const EVENT_ID = 'sac-2026';

export function EventProvider({ children }: { children: ReactNode }) {
  const [event, setEvent] = useState<SacEvent>(DEMO_EVENT);
  const [players, setPlayers] = useState<Player[]>(DEMO_PLAYERS);
  const [loading, setLoading] = useState(isConfigured);

  // Firestore real-time sync
  useEffect(() => {
    if (!isConfigured) return;

    let eventMeta: Omit<SacEvent, 'rounds'> | null = null;
    let roundsMeta: Omit<Round, 'matches'>[] = [];
    let allMatches: Match[] = [];
    let ready = { event: false, rounds: false, matches: false };

    function rebuild() {
      if (!ready.event || !ready.rounds || !ready.matches || !eventMeta) return;

      const rounds: Round[] = roundsMeta.map(r => ({
        ...r,
        matches: allMatches
          .filter(m => m.roundId === r.id)
          .sort((a, b) => a.groupNumber - b.groupNumber),
      }));

      setEvent({ ...eventMeta, rounds });
      setLoading(false);
    }

    const unsubs = [
      subscribeToEvent(EVENT_ID, meta => {
        eventMeta = meta;
        ready.event = true;
        rebuild();
      }),
      subscribeToRounds(EVENT_ID, rounds => {
        roundsMeta = rounds;
        ready.rounds = true;
        rebuild();
      }),
      subscribeToMatches(EVENT_ID, matches => {
        allMatches = matches;
        ready.matches = true;
        rebuild();
      }),
      subscribeToPlayers(p => {
        if (p.length > 0) setPlayers(p);
      }),
    ];

    return () => unsubs.forEach(fn => fn());
  }, []);

  const getPlayer = useCallback(
    (id: string) => players.find(p => p.id === id),
    [players],
  );

  const getMatch = useCallback(
    (matchId: string): Match | undefined => {
      for (const round of event.rounds) {
        const match = round.matches.find(m => m.id === matchId);
        if (match) return match;
      }
      return undefined;
    },
    [event],
  );

  const updateHoleScore = useCallback(
    (matchId: string, holeNum: number, team1Score: number | null, team2Score: number | null) => {
      // Optimistic local update
      setEvent(prev => ({
        ...prev,
        rounds: prev.rounds.map(round => ({
          ...round,
          matches: round.matches.map(match => {
            if (match.id !== matchId) return match;
            const updatedHoles: HoleScore[] = match.holes.map(h =>
              h.hole === holeNum ? { ...h, team1Score, team2Score } : h,
            );
            const updatedMatch = { ...match, holes: updatedHoles };
            updatedMatch.result = calculateMatchResult(updatedMatch);

            // Push to Firestore in background
            if (isConfigured) {
              updateHoleScoreInFirestore(matchId, updatedHoles);
            }

            return updatedMatch;
          }),
        })),
      }));
    },
    [],
  );

  const updateMatchStatus = useCallback(
    (matchId: string, status: Match['status']) => {
      setEvent(prev => ({
        ...prev,
        rounds: prev.rounds.map(round => ({
          ...round,
          matches: round.matches.map(match =>
            match.id === matchId ? { ...match, status } : match,
          ),
        })),
      }));
      if (isConfigured) {
        updateMatchStatusInFirestore(matchId, status);
      }
    },
    [],
  );

  return (
    <EventContext.Provider
      value={{
        event,
        players,
        loading,
        firebaseConnected: isConfigured,
        getPlayer,
        getMatch,
        updateHoleScore,
        updateMatchStatus,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within EventProvider');
  return ctx;
}
