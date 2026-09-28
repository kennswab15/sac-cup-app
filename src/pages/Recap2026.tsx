import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { RECAP_2026_EVENT, RECAP_2026_PLAYERS } from '@/data/recap2026';
import { getEventStandings, calculateMatchResult } from '@/lib/scoring';
import { FORMAT_LABELS, TEAM_CONFIG } from '@/lib/types';
import type { Round, Match, TeamId } from '@/lib/types';

const name = (id: string) => RECAP_2026_PLAYERS.find(p => p.id === id)?.name ?? id;

function MatchRow({ match }: { match: Match }) {
  const result = calculateMatchResult(match);
  const t1Names = match.team1.playerIds.map(name).join(' / ');
  const t2Names = match.team2.playerIds.map(name).join(' / ');
  const t1Pts = result.team1TotalPoints;
  const t2Pts = result.team2TotalPoints;

  return (
    <div className="flex items-center justify-between py-2 border-b border-cream-dark/30 last:border-0 text-xs">
      <div className="flex-1 min-w-0">
        <span className={t1Pts > t2Pts ? 'font-bold text-usa' : 'text-sac-text'}>{t1Names}</span>
      </div>
      <div className="shrink-0 mx-2 text-center w-16 font-display font-bold">
        <span className={t1Pts > t2Pts ? 'text-usa' : 'text-sac-text'}>
          {t1Pts % 1 === 0 ? t1Pts : t1Pts.toFixed(1)}
        </span>
        <span className="text-sac-text-light mx-1">–</span>
        <span className={t2Pts > t1Pts ? 'text-euro' : 'text-sac-text'}>
          {t2Pts % 1 === 0 ? t2Pts : t2Pts.toFixed(1)}
        </span>
      </div>
      <div className="flex-1 min-w-0 text-right">
        <span className={t2Pts > t1Pts ? 'font-bold text-euro' : 'text-sac-text'}>{t2Names}</span>
      </div>
    </div>
  );
}

function RoundCard({ round, t1Pts, t2Pts }: { round: Round; t1Pts: number; t2Pts: number }) {
  const [open, setOpen] = useState(false);
  const winner = t1Pts > t2Pts ? 'morning-woods' : t2Pts > t1Pts ? 'chip-endels' : null;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-navy text-sm">{round.name}</p>
            <p className="text-[10px] text-sac-text-light tracking-wider uppercase">
              {FORMAT_LABELS[round.format]} &middot; {round.matches.length} matches
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2 font-display font-bold text-sm">
                <span className="text-usa">{t1Pts % 1 === 0 ? t1Pts : t1Pts.toFixed(1)}</span>
                <span className="text-sac-text-light">–</span>
                <span className="text-euro">{t2Pts % 1 === 0 ? t2Pts : t2Pts.toFixed(1)}</span>
              </div>
              {winner && (
                <p className={`text-[9px] font-semibold ${winner === 'morning-woods' ? 'text-usa' : 'text-euro'}`}>
                  {TEAM_CONFIG[winner].shortName} wins round
                </p>
              )}
            </div>
            {open ? <ChevronUp className="w-4 h-4 text-sac-text-light" /> : <ChevronDown className="w-4 h-4 text-sac-text-light" />}
          </div>
        </div>
      </button>
      {open && (
        <div className="border-t border-cream px-4 pb-3">
          {round.matches.map(m => <MatchRow key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
}

interface PlayerTotal { id: string; name: string; team: TeamId; points: number }

export default function Recap2026() {
  const event = RECAP_2026_EVENT;
  const { team1Points, team2Points, roundStandings } = useMemo(() => getEventStandings(event.rounds), []);

  const playerTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const round of event.rounds) {
      for (const match of round.matches) {
        const result = calculateMatchResult(match);
        for (const pid of match.team1.playerIds) map.set(pid, (map.get(pid) ?? 0) + result.team1TotalPoints);
        for (const pid of match.team2.playerIds) map.set(pid, (map.get(pid) ?? 0) + result.team2TotalPoints);
      }
    }
    const list: PlayerTotal[] = [];
    for (const p of RECAP_2026_PLAYERS) {
      list.push({ id: p.id, name: p.name, team: p.team, points: map.get(p.id) ?? 0 });
    }
    list.sort((a, b) => b.points - a.points);
    return list;
  }, []);

  const winner: TeamId = team2Points > team1Points ? 'chip-endels' : 'morning-woods';

  return (
    <div>
      {/* Back link */}
      <div className="px-4 pt-3">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-sac-text-light hover:text-navy">
          <ArrowLeft className="w-3 h-3" /> Back to 2027
        </Link>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-green text-white px-4 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(201,168,76,0.08)_0%,transparent_50%)]" />
        <div className="relative z-10">
          <img src="/sac-cup-logo.png" alt="The SAC Cup" className="w-20 h-20 rounded-full mx-auto mb-3 shadow-lg border-2 border-gold/30" />
          <p className="text-gold text-[10px] tracking-[4px] uppercase font-medium mb-1">2026 Results</p>
          <h1 className="font-display text-3xl font-black tracking-wide">The SAC Cup</h1>
          <p className="text-white/40 text-xs mt-1">Solina Golf Club &middot; Sept 17–19</p>
        </div>
      </section>

      {/* Final Score */}
      <section className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto">
          <div className="bg-navy px-4 py-2 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-gold" />
              <p className="text-gold text-[10px] tracking-[3px] uppercase font-semibold">Final Results</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-6 px-4 gap-4">
            <div className="text-center flex-1">
              <p className="font-display text-sm text-usa font-semibold">{TEAM_CONFIG['morning-woods'].name}</p>
              <p className="font-display text-5xl font-black text-usa mt-1">
                {team1Points % 1 === 0 ? team1Points : team1Points.toFixed(1)}
              </p>
            </div>
            <div className="text-sac-text-light text-sm italic font-display">vs</div>
            <div className="text-center flex-1">
              <p className="font-display text-sm text-euro font-semibold">{TEAM_CONFIG['chip-endels'].name}</p>
              <p className="font-display text-5xl font-black text-euro mt-1">
                {team2Points % 1 === 0 ? team2Points : team2Points.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="border-t border-cream-dark px-4 py-3 text-center">
            <p className={`font-display font-bold text-sm ${TEAM_CONFIG[winner].textClass}`}>
              {TEAM_CONFIG[winner].name} Win!
            </p>
          </div>
        </div>
      </section>

      {/* Round Results */}
      <section className="px-4 py-6 max-w-lg mx-auto">
        <h2 className="font-display text-lg font-bold text-navy mb-3">Round Results</h2>
        <div className="space-y-3">
          {roundStandings.map(({ round, team1Points: rT1, team2Points: rT2 }) => (
            <RoundCard key={round.id} round={round} t1Pts={rT1} t2Pts={rT2} />
          ))}
        </div>
      </section>

      {/* Player Leaderboard */}
      <section className="px-4 pb-8 max-w-lg mx-auto">
        <h2 className="font-display text-lg font-bold text-navy mb-3">Player Points</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-[2rem_1fr_3rem] gap-x-2 px-4 py-2 border-b border-cream-dark text-[10px] text-sac-text-light tracking-wider uppercase font-semibold">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Pts</span>
          </div>
          {playerTotals.map((p, i) => (
            <div key={p.id} className={`grid grid-cols-[2rem_1fr_3rem] gap-x-2 px-4 py-2 text-xs ${i % 2 === 0 ? 'bg-white' : 'bg-cream/30'}`}>
              <span className="text-sac-text-light font-bold">{i + 1}</span>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                  style={{ backgroundColor: TEAM_CONFIG[p.team].color }}
                >
                  {p.name.split(' ').map(n => n[0]).join('')}
                </span>
                <span className="truncate font-medium text-navy">{p.name}</span>
              </div>
              <span className={`text-right font-display font-bold ${p.team === 'morning-woods' ? 'text-usa' : 'text-euro'}`}>
                {p.points % 1 === 0 ? p.points : p.points.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
