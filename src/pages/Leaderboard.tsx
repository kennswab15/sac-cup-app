import { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { calculateMatchResult, getEventStandings, getMatchThruText, getLeaderTeam } from '@/lib/scoring';
import { FORMAT_LABELS, TEAM_CONFIG } from '@/lib/types';
import type { Round, Match } from '@/lib/types';

export default function Leaderboard() {
  const { event, players } = useEvent();
  const [selectedRound, setSelectedRound] = useState<string | 'all'>('all');
  const { team1Points, team2Points } = getEventStandings(event.rounds);
  const leader = getLeaderTeam(team1Points, team2Points);

  const displayRounds = selectedRound === 'all'
    ? event.rounds
    : event.rounds.filter(r => r.id === selectedRound);

  return (
    <div className="max-w-lg mx-auto">
      {/* Overall Score Banner */}
      <div className="bg-gradient-to-r from-navy to-navy-light text-white px-4 py-6 text-center">
        <p className="text-gold text-[10px] tracking-[3px] uppercase font-semibold mb-3">
          Overall Standings
        </p>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-xs text-white/60">{TEAM_CONFIG['morning-woods'].shortName}</p>
            <p className={`font-display text-4xl font-black ${leader === 'morning-woods' ? 'text-gold' : 'text-white'}`}>
              {team1Points % 1 === 0 ? team1Points : team1Points.toFixed(1)}
            </p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-xs text-white/60">{TEAM_CONFIG['chip-endels'].shortName}</p>
            <p className={`font-display text-4xl font-black ${leader === 'chip-endels' ? 'text-sac-red' : 'text-white'}`}>
              {team2Points % 1 === 0 ? team2Points : team2Points.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Round Filter */}
      <div className="px-4 py-3 bg-white border-b border-cream-dark overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedRound('all')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap transition-colors ${
              selectedRound === 'all'
                ? 'bg-navy text-white'
                : 'bg-cream text-sac-text-light hover:bg-cream-dark'
            }`}
          >
            All Rounds
          </button>
          {event.rounds.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRound(r.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap transition-colors ${
                selectedRound === r.id
                  ? 'bg-navy text-white'
                  : 'bg-cream text-sac-text-light hover:bg-cream-dark'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* Match Cards by Round */}
      <div className="px-4 py-4 space-y-6">
        {displayRounds.map(round => (
          <RoundSection key={round.id} round={round} players={players} />
        ))}
      </div>
    </div>
  );
}

function RoundSection({ round, players }: { round: Round; players: { id: string; name: string }[] }) {
  const rs = getEventStandings([round]);
  const playerName = (id: string) => players.find(p => p.id === id)?.name ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-lg font-bold text-navy">{round.name}</h3>
          <p className="text-[10px] text-sac-text-light tracking-wider uppercase">
            {FORMAT_LABELS[round.format]} &middot; {round.totalPoints} pts
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="text-usa">{rs.team1Points}</span>
          <span className="text-sac-text-light text-xs">-</span>
          <span className="text-euro">{rs.team2Points}</span>
        </div>
      </div>

      {round.format === 'scramble' ? (
        <ScrambleLeaderboard round={round} playerName={playerName} />
      ) : (
        <div className="space-y-2">
          {round.matches.map(match => (
            <MatchCard key={match.id} match={match} playerName={playerName} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScrambleLeaderboard({ round, playerName }: { round: Round; playerName: (id: string) => string }) {
  const pairs = round.matches.flatMap(match => [
    {
      playerIds: match.team1.playerIds,
      teamId: match.team1.teamId,
      points: match.manualResult?.team1Points ?? 0,
      total: match.holes.reduce((s, h) => s + (h.team1Score ?? 0), 0),
      hasScores: match.holes.some(h => h.team1Score != null),
    },
    {
      playerIds: match.team2.playerIds,
      teamId: match.team2.teamId,
      points: match.manualResult?.team2Points ?? 0,
      total: match.holes.reduce((s, h) => s + (h.team2Score ?? 0), 0),
      hasScores: match.holes.some(h => h.team2Score != null),
    },
  ]).sort((a, b) => b.points - a.points || a.total - b.total);

  const coursePar = round.matches[0]?.holes.reduce((s, h) => s + h.par, 0) ?? 71;

  let rank = 0;
  let prevPoints = -1;
  const ranked = pairs.map((p, i) => {
    if (p.points !== prevPoints) { rank = i + 1; prevPoints = p.points; }
    return { ...p, rank };
  });

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="bg-cream-dark/50 px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] text-sac-text-light tracking-wider uppercase font-semibold">
          Field Results
        </span>
        <div className="flex gap-4 text-[10px] text-sac-text-light tracking-wider uppercase font-semibold">
          <span>Score</span>
          <span className="w-8 text-center">Pts</span>
        </div>
      </div>
      <div className="divide-y divide-cream">
        {ranked.map((pair, i) => {
          const names = pair.playerIds.map(playerName).join(' / ');
          const teamCfg = TEAM_CONFIG[pair.teamId];
          const vsPar = pair.total - coursePar;
          const vsParStr = pair.hasScores ? (vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`) : '';
          const isTop3 = pair.rank <= 3;
          return (
            <div key={i} className={`px-3 py-2.5 flex items-center gap-3 ${isTop3 ? 'bg-gold/5' : ''}`}>
              <span className={`text-xs font-bold w-5 text-center ${isTop3 ? 'text-gold-dark' : 'text-sac-text-light'}`}>
                {pair.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isTop3 ? 'font-bold text-navy' : 'text-sac-text'}`}>
                  {names}
                </p>
                <p className="text-[10px] text-sac-text-light">{teamCfg.shortName}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  {pair.hasScores && (
                    <>
                      <p className="text-xs font-semibold text-sac-text">{pair.total}</p>
                      <p className="text-[10px] text-sac-text-light">{vsParStr}</p>
                    </>
                  )}
                </div>
                <div className={`text-lg font-display font-black w-8 text-center ${
                  pair.teamId === 'morning-woods' ? 'text-usa' : 'text-euro'
                }`}>
                  {pair.points}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchCard({ match, playerName }: { match: Match; playerName: (id: string) => string }) {
  const result = calculateMatchResult(match);
  const thru = getMatchThruText(match);

  const team1Names = match.team1.playerIds.map(playerName).join(' / ');
  const team2Names = match.team2.playerIds.map(playerName).join(' / ');

  const t1Winning = result.team1TotalPoints > result.team2TotalPoints;
  const t2Winning = result.team2TotalPoints > result.team1TotalPoints;
  const hasSegments = result.front9.team1Points + result.front9.team2Points + result.back9.team1Points + result.back9.team2Points > 0;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Match header */}
      <div className="bg-cream-dark/50 px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-sac-text-light tracking-wider uppercase font-semibold">
          Group {match.groupNumber}
          {match.teeTime && <span className="text-sac-text-light/70"> &middot; {match.teeTime}</span>}
          {match.startingHole && match.startingHole !== 1 && (
            <span className="text-sac-text-light/70"> &middot; Hole {match.startingHole}</span>
          )}
        </span>
        <span className={`text-[10px] font-semibold tracking-wider uppercase ${
          match.status === 'live' ? 'text-green-light' : 'text-sac-text-light'
        }`}>
          {match.status === 'live' && '● '}
          {thru}
        </span>
      </div>

      {/* Teams */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className={`text-sm truncate ${t1Winning ? 'font-bold text-usa' : 'text-sac-text'}`}>
              {team1Names}
            </p>
            <p className="text-[10px] text-sac-text-light">{TEAM_CONFIG[match.team1.teamId].shortName}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {hasSegments && (
              <div className="text-right text-[10px] text-sac-text-light space-y-0.5">
                <p>{result.front9.team1Points}</p>
                <p>{result.back9.team1Points}</p>
                <p>{result.overall.team1Points}</p>
              </div>
            )}
            <div className={`text-lg font-display font-black w-8 text-center ${t1Winning ? 'text-usa' : 'text-sac-text-light'}`}>
              {result.team1TotalPoints % 1 === 0 ? result.team1TotalPoints : result.team1TotalPoints.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="border-t border-cream my-1" />

        <div className="flex items-center justify-between mt-2">
          <div className="flex-1 min-w-0">
            <p className={`text-sm truncate ${t2Winning ? 'font-bold text-euro' : 'text-sac-text'}`}>
              {team2Names}
            </p>
            <p className="text-[10px] text-sac-text-light">{TEAM_CONFIG[match.team2.teamId].shortName}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {hasSegments && (
              <div className="text-right text-[10px] text-sac-text-light space-y-0.5">
                <p>{result.front9.team2Points}</p>
                <p>{result.back9.team2Points}</p>
                <p>{result.overall.team2Points}</p>
              </div>
            )}
            <div className={`text-lg font-display font-black w-8 text-center ${t2Winning ? 'text-euro' : 'text-sac-text-light'}`}>
              {result.team2TotalPoints % 1 === 0 ? result.team2TotalPoints : result.team2TotalPoints.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      {result.holesPlayed > 0 && (
        <div className="bg-navy/5 px-3 py-1.5 text-center">
          <p className="text-[10px] font-semibold text-navy tracking-wider uppercase">
            {result.matchStatusText}
          </p>
        </div>
      )}
    </div>
  );
}
