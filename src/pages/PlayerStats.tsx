import { useState, useMemo } from 'react';
import { useEvent } from '@/context/EventContext';
import { calculateMatchResult } from '@/lib/scoring';
import { TEAM_CONFIG, FORMAT_LABELS } from '@/lib/types';
import type { Match, Round, Player, TeamId } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MatchDetail {
  round: Round;
  match: Match;
  myPoints: number;
  opponentPoints: number;
  partnerNames: string[];
  opponentNames: string[];
}

interface Stats {
  player: Player;
  matchesPlayed: number;
  wins: number;
  losses: number;
  halves: number;
  totalPoints: number;
  matches: MatchDetail[];
}

function getPlayerStats(player: Player, rounds: Round[], allPlayers: Player[]): Stats {
  const details: MatchDetail[] = [];
  let wins = 0, losses = 0, halves = 0, totalPoints = 0;
  const name = (id: string) => allPlayers.find(p => p.id === id)?.name ?? id;

  for (const round of rounds) {
    for (const match of round.matches) {
      const onT1 = match.team1.playerIds.includes(player.id);
      const onT2 = match.team2.playerIds.includes(player.id);
      if (!onT1 && !onT2) continue;

      const result = calculateMatchResult(match);
      const myPts = onT1 ? result.team1TotalPoints : result.team2TotalPoints;
      const oppPts = onT1 ? result.team2TotalPoints : result.team1TotalPoints;
      totalPoints += myPts;

      if (myPts > oppPts) wins++;
      else if (myPts < oppPts) losses++;
      else halves++;

      const mySide = onT1 ? match.team1 : match.team2;
      const oppSide = onT1 ? match.team2 : match.team1;

      details.push({
        round,
        match,
        myPoints: myPts,
        opponentPoints: oppPts,
        partnerNames: mySide.playerIds.filter(id => id !== player.id).map(name),
        opponentNames: oppSide.playerIds.map(name),
      });
    }
  }

  return { player, matchesPlayed: details.length, wins, losses, halves, totalPoints, matches: details };
}

export default function PlayerStats() {
  const { event, players } = useEvent();
  const [filter, setFilter] = useState<'all' | TeamId>('all');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const stats = useMemo(() => {
    return players
      .map(p => getPlayerStats(p, event.rounds, players))
      .sort((a, b) => b.totalPoints - a.totalPoints || a.player.name.localeCompare(b.player.name));
  }, [players, event.rounds]);

  const filtered = filter === 'all' ? stats : stats.filter(s => s.player.team === filter);

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-navy to-navy-light text-white px-4 py-5 text-center">
        <h1 className="font-display text-xl font-bold">Player Stats</h1>
        <p className="text-white/50 text-xs mt-1">Individual records & points</p>
      </div>

      <div className="px-4 py-3 bg-white border-b border-cream-dark">
        <div className="flex gap-2">
          {(['all', 'morning-woods', 'chip-endels'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap transition-colors ${
                filter === f
                  ? f === 'morning-woods' ? 'bg-usa text-white'
                    : f === 'chip-endels' ? 'bg-euro text-white'
                    : 'bg-navy text-white'
                  : 'bg-cream text-sac-text-light hover:bg-cream-dark'
              }`}
            >
              {f === 'all' ? 'All Players' : TEAM_CONFIG[f].shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {filtered.map((s, rank) => {
          const expanded = expandedPlayer === s.player.id;
          return (
            <div key={s.player.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedPlayer(expanded ? null : s.player.id)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: TEAM_CONFIG[s.player.team].color }}
                    >
                      {s.player.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-sac-text-light font-bold">#{rank + 1}</span>
                        <p className="font-semibold text-sm text-navy truncate">{s.player.name}</p>
                      </div>
                      <p className="text-[10px] text-sac-text-light">
                        {TEAM_CONFIG[s.player.team].shortName} &middot; {s.player.handicap} HCP &middot; {s.matchesPlayed} matches
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className={`font-display text-lg font-black ${
                        s.player.team === 'morning-woods' ? 'text-usa' : 'text-euro'
                      }`}>
                        {s.totalPoints % 1 === 0 ? s.totalPoints : s.totalPoints.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-sac-text-light">
                        {s.wins}W-{s.losses}L-{s.halves}H
                      </p>
                    </div>
                    {expanded
                      ? <ChevronUp className="w-4 h-4 text-sac-text-light" />
                      : <ChevronDown className="w-4 h-4 text-sac-text-light" />
                    }
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="border-t border-cream px-4 pb-3">
                  {s.matches.map(m => (
                    <div key={m.match.id} className="py-2 border-b border-cream-dark/30 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-sac-text-light tracking-wider uppercase font-semibold">
                            {m.round.name} &middot; {FORMAT_LABELS[m.match.format]}
                          </p>
                          <p className="text-xs text-sac-text mt-0.5 truncate">
                            {m.partnerNames.length > 0 && (
                              <span>w/ {m.partnerNames.join(', ')} </span>
                            )}
                            <span className="text-sac-text-light">vs </span>
                            {m.opponentNames.join(' / ')}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className={`font-display font-bold text-sm ${
                            m.myPoints > m.opponentPoints ? 'text-green'
                              : m.myPoints < m.opponentPoints ? 'text-sac-red'
                              : 'text-sac-text'
                          }`}>
                            {m.myPoints % 1 === 0 ? m.myPoints : m.myPoints.toFixed(1)}
                            <span className="text-sac-text-light font-normal">
                              -{m.opponentPoints % 1 === 0 ? m.opponentPoints : m.opponentPoints.toFixed(1)}
                            </span>
                          </span>
                          <p className="text-[10px] text-sac-text-light">
                            {m.myPoints > m.opponentPoints ? 'W' : m.myPoints < m.opponentPoints ? 'L' : 'H'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {s.matches.length === 0 && (
                    <p className="text-sm text-sac-text-light py-2">No matches played</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
