import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EventProvider, useEvent } from '@/context/EventContext';
import { UserProvider, useUser } from '@/context/UserContext';
import Layout from '@/components/Layout';
import PlayerPicker from '@/components/PlayerPicker';
import Home from '@/pages/Home';
import Leaderboard from '@/pages/Leaderboard';
import Scoring from '@/pages/Scoring';
import Chat from '@/pages/Chat';
import Admin from '@/pages/Admin';
import Scorecards from '@/pages/Scorecards';
import PlayerStats from '@/pages/PlayerStats';
import Projections from '@/pages/Projections';

function IdentityResolver({ children }: { children: React.ReactNode }) {
  const { players, loading } = useEvent();
  const { currentUser, storedPlayerId, setCurrentUser } = useUser();

  useEffect(() => {
    if (currentUser || !storedPlayerId || players.length === 0) return;
    const found = players.find(p => p.id === storedPlayerId);
    if (found) setCurrentUser(found);
  }, [players, storedPlayerId, currentUser, setCurrentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <img src="/sac-cup-logo.png" alt="The SAC Cup" className="w-16 h-16 rounded-full mx-auto mb-4 animate-pulse" />
          <p className="text-sac-text-light text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <PlayerPicker />;
  }

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useUser();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <EventProvider>
          <IdentityResolver>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/scoring" element={<Scoring />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
                <Route path="/scorecards" element={<AdminGuard><Scorecards /></AdminGuard>} />
                <Route path="/stats" element={<PlayerStats />} />
                <Route path="/projections" element={<Projections />} />
              </Route>
            </Routes>
          </IdentityResolver>
        </EventProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
