import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, X, Check } from 'lucide-react';
import { useEvent } from '@/context/EventContext';
import { calculateMatchResult, getEventStandings, getMatchThruText, getLeaderTeam } from '@/lib/scoring';
import { FORMAT_LABELS, TEAM_CONFIG } from '@/lib/types';
import type { Round, Match, TeamId, RoundStandings } from '@/lib/types';

function formatPts(pts: number): string {
  return pts % 1 === 0 ? String(pts) : pts.toFixed(1);
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getLastName(name: string): string {
  const parts = name.split(' ');
  return parts[parts.length - 1];
}

function getDefaultRoundId(rounds: Round[], urlRound: string | null): string {
  if (urlRound && rounds.some(r => r.id === urlRound)) return urlRound;
  const live = rounds.find(r => r.status === 'live');
  if (live) return live.id;
  const complete = rounds.filter(r => r.status === 'complete');
  if (complete.length > 0) return complete[complete.length - 1].id;
  return rounds[0]?.id ?? '';
}

/* ─── Badges & Pills ─── */

function WinnerBadge({ team }: { team: TeamId }) {
  return (
    <span className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-[1.5px] uppercase text-white ${
      team === 'morning-woods' ? 'bg-usa' : 'bg-euro'
    }`}>
      Winner
    </span>
  );
}

function LeadingBadge({ team }: { team: TeamId }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-[1.5px] uppercase text-white/90 ${
      team === 'morning-woods' ? 'bg-usa/70' : 'bg-euro/70'
    }`}>
      Leading
    </span>
  );
}

function WinsPill({ team }: { team: TeamId }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-[1px] uppercase text-white ${
      team === 'morning-woods' ? 'bg-usa' : 'bg-euro'
    }`}>
      Wins
    </span>
  );
}

function HalvedPill() {
  return (
    <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-[1px] uppercase text-white bg-sac-text-light">
      Halved
    </span>
  );
}

/* ─── Score Banner ─── */

function ScoreBanner({
  team1Points, team2Points, totalPoints, leader, eventStatus,
}: {
  team1Points: number;
  team2Points: number;
  totalPoints: number;
  leader: TeamId | 'tied';
  eventStatus: string;
}) {
  const mwPct = totalPoints > 0 ? (team1Points / totalPoints) * 100 : 0;
  const cePct = totalPoints > 0 ? (team2Points / totalPoints) * 100 : 0;
  const showWinner = eventStatus === 'complete' && leader !== 'tied';
  const showLeading = eventStatus === 'live' && leader !== 'tied';

  return (
    <div className="bg-white border-b border-cream-dark">
      {/* Score row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {/* MW side */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-usa flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs tracking-wide">MW</span>
          </div>
          {showWinner && leader === 'morning-woods' && <WinnerBadge team="morning-woods" />}
          {showLeading && leader === 'morning-woods' && <LeadingBadge team="morning-woods" />}
        </div>

        {/* Scores center */}
        <div className="flex items-center gap-4">
          <span className={`font-display text-4xl font-black ${
            leader === 'morning-woods' ? 'text-usa' : 'text-sac-text'
          }`}>
            {formatPts(team1Points)}
          </span>
          <span className={`font-display text-4xl font-black ${
            leader === 'chip-endels' ? 'text-euro' : 'text-sac-text'
          }`}>
            {formatPts(team2Points)}
          </span>
        </div>

        {/* CE side */}
        <div className="flex items-center gap-2">
          {showWinner && leader === 'chip-endels' && <WinnerBadge team="chip-endels" />}
          {showLeading && leader === 'chip-endels' && <LeadingBadge team="chip-endels" />}
          <div className="w-10 h-10 rounded-full bg-euro flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs tracking-wide">CE</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 flex mx-4 rounded-full overflow-hidden bg-cream-dark/50">
        {mwPct > 0 && (
          <div
            className="bg-usa transition-all duration-700 rounded-l-full"
            style={{ width: `${mwPct}%` }}
          />
        )}
        <div className="flex-1" />
        {cePct > 0 && (
          <div
            className="bg-euro transition-all duration-700 rounded-r-full"
            style={{ width: `${cePct}%` }}
          />
        )}
      </div>

      {/* Team names */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[10px] text-sac-text-light tracking-[1.5px] uppercase font-semibold">
          {TEAM_CONFIG['morning-woods'].name}
        </span>
        <span className="text-[10px] text-sac-text-light tracking-[1.5px] uppercase font-semibold">
          {TEAM_CONFIG['chip-endels'].name}
        </span>
      </div>
    </div>
  );
}

/* ─── Round Picker Modal ─── */

function RoundPickerModal({
  rounds, roundStandings, selectedId, onSelect, onClose,
}: {
  rounds: Round[];
  roundStandings: RoundStandings[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-auto pb-20">
        <div className="sticky top-0 bg-white border-b border-cream px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="font-display text-base font-bold text-navy">Select Round</h3>
          <button onClick={onClose} className="p-1 hover:bg-cream rounded-full transition-colors">
            <X size={20} className="text-sac-text-light" />
          </button>
        </div>
        {rounds.map(r => {
          const rs = roundStandings.find(s => s.round.id === r.id);
          const isSelected = selectedId === r.id;
          const completed = r.matches.filter(m => m.status === 'complete').length;
          const statusLabel = r.status === 'live' ? 'Live' : r.status === 'complete' ? 'Final' : '';
          return (
            <button
              key={r.id}
              onClick={() => { onSelect(r.id); onClose(); }}
              className={`w-full px-4 py-3.5 flex items-center justify-between border-b border-cream text-left transition-colors ${
                isSelected ? 'bg-gold/10' : 'hover:bg-cream/50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${isSelected ? 'font-bold text-navy' : 'font-semibold text-sac-text'}`}>
                    {r.name}
                  </p>
                  <span className="text-[10px] text-sac-text-light tracking-wider uppercase">
                    {FORMAT_LABELS[r.format]}
                  </span>
                  {statusLabel && (
                    <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                      r.status === 'live' ? 'bg-green-light/20 text-green-light' : 'bg-cream-dark text-sac-text-light'
                    }`}>
                      {statusLabel}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-sac-text-light mt-0.5">
                  {completed} of {r.matches.length} matches &middot; {r.totalPoints} pts
                </p>
              </div>
              <div className="flex items-center gap-3 ml-3">
                {rs && (rs.team1Points > 0 || rs.team2Points > 0) && (
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-usa">{formatPts(rs.team1Points)}</span>
                    <span className="text-sac-text-light/50">-</span>
                    <span className="text-euro">{formatPts(rs.team2Points)}</span>
                  </div>
                )}
                {isSelected && <Check size={18} className="text-gold" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Session Header ─── */

function SessionHeader({ round, roundStandings }: { round: Round; roundStandings: RoundStandings | undefined }) {
  const completed = round.matches.filter(m => m.status === 'complete').length;
  return (
    <div className="bg-navy px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-white">{round.name}</h2>
          <p className="text-[11px] text-white/50 mt-0.5">
            {FORMAT_LABELS[round.format]} &middot; {completed} of {round.matches.length} matches completed
          </p>
        </div>
        {roundStandings && (
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-usa-light">{formatPts(roundStandings.team1Points)}</span>
            <span className="text-white/30 text-xs">-</span>
            <span className="text-sm font-bold text-euro-light">{formatPts(roundStandings.team2Points)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Presidents Cup Match Card ─── */

function MatchCard({
  match, playerName, isLast,
}: {
  match: Match;
  playerName: (id: string) => string;
  isLast: boolean;
}) {
  const result = calculateMatchResult(match);
  const thru = getMatchThruText(match);

  const t1IsMW = match.team1.teamId === 'morning-woods';
  const mwSide = t1IsMW ? match.team1 : match.team2;
  const ceSide = t1IsMW ? match.team2 : match.team1;
  const mwPts = t1IsMW ? result.team1TotalPoints : result.team2TotalPoints;
  const cePts = t1IsMW ? result.team2TotalPoints : result.team1TotalPoints;

  const isSingles = match.format === 'singles';
  const mwNames = mwSide.playerIds.map(playerName);
  const ceNames = ceSide.playerIds.map(playerName);
  const mwInitials = isSingles ? getInitials(mwNames[0]) : 'MW';
  const ceInitials = isSingles ? getInitials(ceNames[0]) : 'CE';

  const mwWins = mwPts > cePts;
  const ceWins = cePts > mwPts;
  const isComplete = match.status === 'complete';
  const isLive = match.status === 'live';
  const halved = isComplete && mwPts === cePts;
  const hasResult = isComplete || isLive;

  return (
    <div className={`px-4 py-4 ${!isLast ? 'border-b border-cream' : ''}`}>
      {/* Match header row */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {mwWins && isComplete && <WinsPill team="morning-woods" />}
        <span className="text-[10px] text-sac-text-light tracking-[2px] uppercase font-semibold">
          Match {match.groupNumber}
        </span>
        {ceWins && isComplete && <WinsPill team="chip-endels" />}
        {halved && <HalvedPill />}
      </div>

      {/* Players + Score row */}
      <div className="flex items-center">
        {/* MW Player(s) — Left */}
        <div className="flex-1 flex flex-col items-center text-center min-w-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1.5 transition-all ${
            mwWins && isComplete ? 'bg-usa ring-2 ring-usa/20' : 'bg-usa/80'
          }`}>
            <span className="text-white font-bold text-sm">{mwInitials}</span>
          </div>
          {mwNames.map((name, i) => (
            <p key={i} className={`text-xs leading-tight truncate max-w-full ${
              mwWins ? 'font-bold text-usa' : 'text-sac-text'
            }`}>
              {getLastName(name)}
            </p>
          ))}
        </div>

        {/* Center Score */}
        <div className="shrink-0 w-24 text-center px-1">
          {hasResult ? (
            <>
              <p className="font-display text-xl font-black text-navy">
                {formatPts(mwPts)}<span className="text-sac-text-light/50 mx-0.5">-</span>{formatPts(cePts)}
              </p>
              <p className={`text-[10px] tracking-wider uppercase font-semibold mt-0.5 ${
                isLive ? 'text-green-light' : 'text-sac-text-light'
              }`}>
                {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-light mr-1 align-middle" />}
                {thru}
              </p>
            </>
          ) : (
            <p className="text-xs text-sac-text-light">
              {match.teeTime ?? 'TBD'}
            </p>
          )}
        </div>

        {/* CE Player(s) — Right */}
        <div className="flex-1 flex flex-col items-center text-center min-w-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1.5 transition-all ${
            ceWins && isComplete ? 'bg-euro ring-2 ring-euro/20' : 'bg-euro/80'
          }`}>
            <span className="text-white font-bold text-sm">{ceInitials}</span>
          </div>
          {ceNames.map((name, i) => (
            <p key={i} className={`text-xs leading-tight truncate max-w-full ${
              ceWins ? 'font-bold text-euro' : 'text-sac-text'
            }`}>
              {getLastName(name)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Scramble Leaderboard ─── */

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
    <div>
      <div className="bg-cream-dark/50 px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] text-sac-text-light tracking-wider uppercase font-semibold">
          Field Results
        </span>
        <div className="flex gap-6 text-[10px] text-sac-text-light tracking-wider uppercase font-semibold">
          <span>Score</span>
          <span className="w-8 text-center">Pts</span>
        </div>
      </div>
      <div className="divide-y divide-cream">
        {ranked.map((pair, i) => {
          const names = pair.playerIds.map(id => getLastName(playerName(id))).join(' / ');
          const teamCfg = TEAM_CONFIG[pair.teamId];
          const vsPar = pair.total - coursePar;
          const vsParStr = pair.hasScores ? (vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`) : '';
          const isTop3 = pair.rank <= 3;
          return (
            <div key={i} className={`px-4 py-2.5 flex items-center gap-3 ${isTop3 ? 'bg-gold/5' : ''}`}>
              <span className={`text-xs font-bold w-5 text-center ${isTop3 ? 'text-gold' : 'text-sac-text-light'}`}>
                {pair.rank}
              </span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                pair.teamId === 'morning-woods' ? 'bg-usa/80' : 'bg-euro/80'
              }`}>
                <span className="text-white font-bold text-[9px]">{teamCfg.shortName}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isTop3 ? 'font-bold text-navy' : 'text-sac-text'}`}>
                  {names}
                </p>
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

/* ─── Main Component ─── */

export default function Leaderboard() {
  const { event, players } = useEvent();
  const [searchParams] = useSearchParams();
  const urlRound = searchParams.get('round');

  const [selectedRound, setSelectedRound] = useState<string>(() =>
    getDefaultRoundId(event.rounds, urlRound)
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const { team1Points, team2Points, roundStandings } = getEventStandings(event.rounds);
  const leader = getLeaderTeam(team1Points, team2Points);

  const round = event.rounds.find(r => r.id === selectedRound);
  const currentRS = roundStandings.find(rs => rs.round.id === selectedRound);
  const playerName = (id: string) => players.find(p => p.id === id)?.name ?? id;

  if (event.rounds.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-sac-text-light">No rounds scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Sticky Score Banner */}
      <ScoreBanner
        team1Points={team1Points}
        team2Points={team2Points}
        totalPoints={event.totalPoints}
        leader={leader}
        eventStatus={event.status}
      />

      {/* Round Selector */}
      {round && (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border-b border-cream-dark hover:bg-cream/30 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-navy">View:</span>
            <span className="text-sm text-sac-text">
              {round.name} &middot; {FORMAT_LABELS[round.format]}
            </span>
          </div>
          <ChevronDown size={18} className="text-sac-text-light" />
        </button>
      )}

      {/* Session Header */}
      {round && <SessionHeader round={round} roundStandings={currentRS} />}

      {/* Match List */}
      {round && (
        <div className="bg-white">
          {round.format === 'scramble' ? (
            <ScrambleLeaderboard round={round} playerName={playerName} />
          ) : (
            round.matches.map((match, i) => (
              <MatchCard
                key={match.id}
                match={match}
                playerName={playerName}
                isLast={i === round.matches.length - 1}
              />
            ))
          )}
        </div>
      )}

      {/* Round Picker Modal */}
      {pickerOpen && (
        <RoundPickerModal
          rounds={event.rounds}
          roundStandings={roundStandings}
          selectedId={selectedRound}
          onSelect={setSelectedRound}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
