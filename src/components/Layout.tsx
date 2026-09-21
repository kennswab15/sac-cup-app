import { NavLink, Outlet } from 'react-router-dom';
import { PenLine, BarChart3, MessageCircle, Settings, Trophy, LogOut, Users } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { TEAM_CONFIG } from '@/lib/types';

const NAV_ITEMS = [
  { to: '/', icon: Trophy, label: 'Home', adminOnly: false },
  { to: '/leaderboard', icon: BarChart3, label: 'Board', adminOnly: false },
  { to: '/stats', icon: Users, label: 'Stats', adminOnly: false },
  { to: '/scoring', icon: PenLine, label: 'Score', adminOnly: false },
  { to: '/chat', icon: MessageCircle, label: 'Chat', adminOnly: false },
  { to: '/admin', icon: Settings, label: 'Admin', adminOnly: true },
];

export default function Layout() {
  const { currentUser, isAdmin, clearIdentity } = useUser();
  const teamConfig = currentUser ? TEAM_CONFIG[currentUser.team] : null;

  const visibleNav = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Top header */}
      <header className="bg-navy text-white px-4 py-3 flex items-center justify-between no-print sticky top-0 z-50 shadow-lg">
        <NavLink to="/" className="flex items-center gap-2">
          <img src="/sac-cup-logo.png" alt="SAC Cup" className="w-9 h-9 rounded-full object-cover" />
          <span className="font-display font-bold text-sm tracking-widest uppercase">
            SAC Cup
          </span>
        </NavLink>
        {currentUser && teamConfig && (
          <div className="flex items-center gap-2">
            <span className={`text-[8px] px-1.5 py-0.5 rounded-sm font-bold tracking-wider uppercase ${
              currentUser.team === 'morning-woods'
                ? 'bg-white/15 text-white'
                : 'bg-euro/40 text-white'
            }`}>
              {teamConfig.shortName}
            </span>
            <span className="text-[10px] text-white/60">
              {currentUser.name}
            </span>
            <button
              onClick={clearIdentity}
              className="ml-1 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom nav - mobile-first */}
      <nav className="fixed bottom-0 left-0 right-0 bg-navy border-t border-gold/20 no-print z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-[10px] tracking-wider uppercase transition-colors ${
                  isActive ? 'text-gold' : 'text-white/50 hover:text-white/80'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
