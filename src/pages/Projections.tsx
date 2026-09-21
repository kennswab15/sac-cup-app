import { useState, useMemo } from 'react';
import { useEvent } from '@/context/EventContext';
import { calculateMatchResult, getRoundStandings, getEventStandings } from '@/lib/scoring';
import { TEAM_CONFIG, FORMAT_LABELS } from '@/lib/types';
import type { Round, Match } from '@/lib/types';
import { RotateCcw, Minus, Plus } from 'lucide-react';

const MATCH_PRESETS = [3, 2.5, 2, 1.5, 1, 0.5, 0] as const;

function fmtPts(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

export default function Projections() {
  const { event, players } = useEvent();

  const [matchOverrides, setMatchOverrides] = useState<Record<string, number>>({});
  const [scrambleOverrides, setScrambleOverrides] = useState<Record<string, [number, number]>>({});

  const actual = getEventStandings(event.rounds);

  const projected = useMemo(() => {
    let mw = 0, ce = 0;
    for (const round of event.rounds) {
      if (round.format === 'scramble') {
        const override = scrambleOverrides[round.id];
        if (override) {
          mw += override[0];
          ce += override[1];
        } else {
          const rs = getRoundStandings(round);
          mw += rs.team1Points;
          ce += rs.team2Points;
        }
      } else {
        for (const match of round.matches) {
          if (matchOverrides[match.id] !== undefined) {
            mw += matchOverrides[match.id];
            ce += 3 - matchOverrides[match.id];
          } else {
            const result = calculateMatchResult(match);
            mw += result.team1TotalPoints;
            ce += result.team2TotalPoints;
          }
        }
      }
    }
    return { mw, ce };
  }, [event.rounds, matchOverrides, scrambleOverrides]);

  const changedCount = Object.keys(matchOverrides).length + Object.keys(scrambleOverrides).length;
  const mwDiff = projected.mw - actual.team1Points;
  const ceDiff = projected.ce - actual.team2Points;

  const reset = () => { setMatchOverrides({}); setScrambleOverrides({}); };

  const setMatchPts = (matchId: string, mwPts: number) => {
    const result = calculateMatchResult(event.rounds.flatMap(r => r.matches).find(m => m.id === matchId)!);
    if (mwPts === result.team1TotalPoints) {
      setMatchOverrides(prev => { const next = { ...prev }; delete next[matchId]; return next; });
    } else {
      setMatchOverrides(prev => ({ ...prev, [matchId]: mwPts }));
    }
  };

  const adjustScramble = (roundId: string, round: Round, delta: number) => {
    const current = scrambleOverrides[roundId] ?? (() => {
      const rs = getRoundStandings(round);
      return [rs.team1Points, rs.team2Points] as [number, number];
    })();
    const newMw = Math.max(0, Math.min(round.totalPoints, current[0] + delta));
    const newCe = round.totalPoints - newMw;
    const rs = getRoundStandings(round);
    if (newMw === rs.team1Points) {
      setScrambleOverrides(prev => { const next = { ...prev }; delete next[roundId]; return next; });
    } else {
      setScrambleOverrides(prev => ({ ...prev, [roundId]: [newMw, newCe] }));
    }
  };

  const playerName = (id: string) => {
    const p = players.find(pl => pl.id === id);
    return p ? p.name.split(' ')[0] : id;
  };

  const mwWinning = projected.mw > projected.ce;
  const ceWinning = projected.ce > projected.mw;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-navy to-navy-light text-white px-4 py-5 text-center">
        <h1 className="font-display text-xl font-bold">What-If Calculator</h1>
        <p className="text-white/50 text-xs mt-1">Explore alternative outcomes</p>
      </div>

      {/* Projected score */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 py-4">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-[10px] text-sac-text-light uppercase tracking-wider font-semibold">
                  {TEAM_CONFIG['morning-woods'].shortName}
                </p>
                <p className={`font-display text-4xl font-black ${mwWinning ? 'text-usa' : 'text-usa/60'}`}>
                  {fmtPts(projected.mw)}
                </p>
                {changedCount > 0 && mwDiff !== 0 && (
                  <p className={`text-[10px] font-semibold ${mwDiff > 0 ? 'text-green' : 'text-sac-red'}`}>
                    {mwDiff > 0 ? '+' : ''}{fmtPts(mwDiff)}
                  </p>
                )}
              </div>
              <div className="text-sac-text-light text-xs font-display">vs</div>
              <div className="text-center">
                <p className="text-[10px] text-sac-text-light uppercase tracking-wider font-semibold">
                  {TEAM_CONFIG['chip-endels'].shortName}
                </p>
                <p className={`font-display text-4xl font-black ${ceWinning ? 'text-euro' : 'text-euro/60'}`}>
                  {fmtPts(projected.ce)}
                </p>
                {changedCount > 0 && ceDiff !== 0 && (
                  <p className={`text-[10px] font-semibold ${ceDiff > 0 ? 'text-green' : 'text-sac-red'}`}>
                    {ceDiff > 0 ? '+' : ''}{fmtPts(ceDiff)}
                  </p>
                )}
              </div>
            </div>

            {/* Bar */}
            <div className="mt-3 h-4 rounded-full overflow-hidden flex bg-cream-dark/50 relative">
              {projected.mw > 0 && (
                <div className="bg-usa h-full transition-all duration-300" style={{ width: `${(projected.mw / event.totalPoints) * 100}%` }} />
              )}
              {projected.ce > 0 && (
                <div className="bg-euro h-full transition-all duration-300 ml-auto" style={{ width: `${(projected.ce / event.totalPoints) * 100}%` }} />
              )}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-gold z-10"
                style={{ left: `${(event.pointsToWin / event.totalPoints) * 100}%` }}
              />
            </div>
            <p className="text-[9px] text-center text-sac-text-light mt-1">
              {event.pointsToWin} to win &middot; {event.totalPoints} total
              {projected.mw >= event.pointsToWin && ' · MW wins!'}
              {projected.ce >= event.pointsToWin && ' · CE wins!'}
            </p>
          </div>

          {changedCount > 0 && (
            <div className="border-t border-cream px-4 py-2 flex items-center justify-between">
              <p className="text-[10px] text-sac-text-light">
                {changedCount} {changedCount === 1 ? 'match' : 'matches'} changed
              </p>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-[10px] text-usa font-semibold hover:underline"
              >
                <RotateCcw className="w-3 h-3" /> Reset to Actual
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rounds */}
      <div className="px-4 pb-8 space-y-6">
        {event.rounds.map(round => (
          <RoundProjection
            key={round.id}
            round={round}
            matchOverrides={matchOverrides}
            scrambleOverride={scrambleOverrides[round.id]}
            onSetMatch={setMatchPts}
            onAdjustScramble={(delta) => adjustScramble(round.id, round, delta)}
            playerName={playerName}
          />
        ))}
      </div>
    </div>
  );
}

function RoundProjection({
  round,
  matchOverrides,
  scrambleOverride,
  onSetMatch,
  onAdjustScramble,
  playerName,
}: {
  round: Round;
  matchOverrides: Record<string, number>;
  scrambleOverride?: [number, number];
  onSetMatch: (matchId: string, mwPts: number) => void;
  onAdjustScramble: (delta: number) => void;
  playerName: (id: string) => string;
}) {
  const roundSubtotal = useMemo(() => {
    if (round.format === 'scramble') {
      if (scrambleOverride) return { mw: scrambleOverride[0], ce: scrambleOverride[1] };
      const rs = getRoundStandings(round);
      return { mw: rs.team1Points, ce: rs.team2Points };
    }
    let mw = 0, ce = 0;
    for (const match of round.matches) {
      if (matchOverrides[match.id] !== undefined) {
        mw += matchOverrides[match.id];
        ce += 3 - matchOverrides[match.id];
      } else {
        const result = calculateMatchResult(match);
        mw += result.team1TotalPoints;
        ce += result.team2TotalPoints;
      }
    }
    return { mw, ce };
  }, [round, matchOverrides, scrambleOverride]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-display text-sm font-bold text-navy">{round.name}</h3>
          <p className="text-[10px] text-sac-text-light tracking-wider uppercase">
            {FORMAT_LABELS[round.format]} &middot; {round.totalPoints} pts
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="text-usa">{fmtPts(roundSubtotal.mw)}</span>
          <span className="text-sac-text-light text-xs">-</span>
          <span className="text-euro">{fmtPts(roundSubtotal.ce)}</span>
        </div>
      </div>

      {round.format === 'scramble' ? (
        <ScrambleAdjuster
          round={round}
          mw={roundSubtotal.mw}
          ce={roundSubtotal.ce}
          isOverridden={!!scrambleOverride}
          onAdjust={onAdjustScramble}
        />
      ) : (
        <div className="space-y-2">
          {round.matches.map(match => (
            <MatchAdjuster
              key={match.id}
              match={match}
              override={matchOverrides[match.id]}
              onSet={(pts) => onSetMatch(match.id, pts)}
              playerName={playerName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScrambleAdjuster({
  round,
  mw,
  ce,
  isOverridden,
  onAdjust,
}: {
  round: Round;
  mw: number;
  ce: number;
  isOverridden: boolean;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm ${isOverridden ? 'ring-2 ring-gold/50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-usa font-bold uppercase">MW</span>
          <button
            onClick={() => onAdjust(-0.5)}
            disabled={mw <= 0}
            className="w-7 h-7 rounded-full bg-cream flex items-center justify-center text-navy disabled:opacity-30 hover:bg-cream-dark"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-display text-xl font-black text-usa w-10 text-center">{fmtPts(mw)}</span>
          <button
            onClick={() => onAdjust(0.5)}
            disabled={mw >= round.totalPoints}
            className="w-7 h-7 rounded-full bg-cream flex items-center justify-center text-navy disabled:opacity-30 hover:bg-cream-dark"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjust(-0.5)}
            disabled={ce >= round.totalPoints}
            className="w-7 h-7 rounded-full bg-cream flex items-center justify-center text-navy disabled:opacity-30 hover:bg-cream-dark"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-display text-xl font-black text-euro w-10 text-center">{fmtPts(ce)}</span>
          <button
            onClick={() => onAdjust(0.5)}
            disabled={ce <= 0}
            className="w-7 h-7 rounded-full bg-cream flex items-center justify-center text-navy disabled:opacity-30 hover:bg-cream-dark"
          >
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-[10px] text-euro font-bold uppercase">CE</span>
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full overflow-hidden flex bg-cream-dark/50">
        <div className="bg-usa h-full transition-all duration-200" style={{ width: `${(mw / round.totalPoints) * 100}%` }} />
        <div className="bg-euro h-full transition-all duration-200 ml-auto" style={{ width: `${(ce / round.totalPoints) * 100}%` }} />
      </div>
      <p className="text-[9px] text-center text-sac-text-light mt-1">
        {round.totalPoints} total scramble points &middot; Positional scoring
      </p>
    </div>
  );
}

function MatchAdjuster({
  match,
  override,
  onSet,
  playerName,
}: {
  match: Match;
  override: number | undefined;
  onSet: (mwPts: number) => void;
  playerName: (id: string) => string;
}) {
  const result = calculateMatchResult(match);
  const currentMw = override ?? result.team1TotalPoints;
  const isChanged = override !== undefined;

  const t1Names = match.team1.playerIds.map(playerName).join(' / ');
  const t2Names = match.team2.playerIds.map(playerName).join(' / ');

  return (
    <div className={`bg-white rounded-xl p-3 shadow-sm ${isChanged ? 'ring-2 ring-gold/50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs truncate">
            <span className="font-semibold text-usa">{t1Names}</span>
            <span className="text-sac-text-light mx-1">vs</span>
            <span className="font-semibold text-euro">{t2Names}</span>
          </p>
        </div>
        <div className="text-right shrink-0 ml-2">
          <span className="font-display font-bold text-sm">
            <span className="text-usa">{fmtPts(currentMw)}</span>
            <span className="text-sac-text-light">-</span>
            <span className="text-euro">{fmtPts(3 - currentMw)}</span>
          </span>
        </div>
      </div>
      <div className="flex gap-1">
        {MATCH_PRESETS.map(pts => {
          const isSelected = currentMw === pts;
          const isActual = result.team1TotalPoints === pts && !isChanged;
          return (
            <button
              key={pts}
              onClick={() => onSet(pts)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                isSelected
                  ? pts > 1.5 ? 'bg-usa text-white shadow-sm'
                    : pts < 1.5 ? 'bg-euro text-white shadow-sm'
                    : 'bg-gold text-navy shadow-sm'
                  : isActual
                    ? 'bg-cream-dark text-sac-text ring-1 ring-sac-text-light/30'
                    : 'bg-cream text-sac-text-light hover:bg-cream-dark'
              }`}
            >
              {fmtPts(pts)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
