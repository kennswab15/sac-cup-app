import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Player } from '@/lib/types';
import { CHAIRMAN_PLAYER_ID } from '@/lib/types';

interface UserContextValue {
  currentUser: Player | null;
  storedPlayerId: string | null;
  isIdentified: boolean;
  isAdmin: boolean;
  setCurrentUser: (player: Player) => void;
  clearIdentity: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = 'sac-cup-player-id';

function readStoredId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [storedPlayerId, setStoredPlayerId] = useState<string | null>(readStoredId);
  const [player, setPlayer] = useState<Player | null>(null);

  const setCurrentUser = useCallback((p: Player) => {
    setPlayer(p);
    setStoredPlayerId(p.id);
    try { localStorage.setItem(STORAGE_KEY, p.id); } catch {}
  }, []);

  const clearIdentity = useCallback(() => {
    setPlayer(null);
    setStoredPlayerId(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <UserContext.Provider value={{
      currentUser: player,
      storedPlayerId,
      isIdentified: player !== null,
      isAdmin: player?.id === CHAIRMAN_PLAYER_ID,
      setCurrentUser,
      clearIdentity,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
