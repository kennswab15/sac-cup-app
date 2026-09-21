import { useState, useMemo } from 'react';
import { useEvent } from '@/context/EventContext';
import { calculateMatchResult, getHoleWinner } from '@/lib/scoring';
import { FORMAT_LABELS, TEAM_CONFIG } from '@/lib/types';
import type { Match } from '@/lib/types';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

function getPlayOrder(startingHole: number): number[] {
  const order: number[] = [];
  for (let i = 0; i < 18; i++) {
    order.push(((startingHole - 1 + i) % 18) + 1);
  }
  return order;
}

export default function Scoring() {
  const { event, players } = useEvent();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const liveRounds = event.rounds.filter(r => r.status === 'live' || r.status === 'upcoming');
  const allMatches = liveRounds.flatMap(r => r.matches);

  const playerName = (id: string) => players.find(p => p.id === id)?.name ?? id;

  if (selectedMatchId) {
    return <ScoreEntry matchId={selectedMatchId} onBack={() => setSelectedMatchId(null)} />;
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-navy to-navy-light text-white px-4 py-5 text-center">
        <h1 className="font-display text-xl font-bold">Enter Scores</h1>
        <p className="text-white/50 text-xs mt-1">Select your group to begin scoring</p>
      </div>

      <div className="px-4 py-4 space-y-6">
        {liveRounds.map(round => (
          <div key={round.id}>
            <h2 className="font-display text-lg font-bold text-navy mb-1">{round.name}</h2>
            <p className="text-[10px] text-sac-text-light tracking-wider uppercase mb-3">
              {FORMAT_LABELS[round.format]}
            </p>
            <div className="space-y-2">
              {round.matches.map(match => {
                const result = calculateMatchResult(match);
                const played = result.holesPlayed;
                return (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatchId(match.id)}
                    className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gold font-semibold tracking-wider uppercase mb-1">
                          Group {match.groupNumber}
                          {match.teeTime && <span className="text-gold/60"> &middot; {match.teeTime}</span>}
                          {match.startingHole && match.startingHole !== 1 && (
                            <span className="text-gold/60"> &middot; Hole {match.startingHole}</span>
                          )}
                        </p>
                        <p className="text-sm font-semibold text-usa">
                          {match.team1.playerIds.map(playerName).join(' / ')}
                        </p>
                        <p className="text-xs text-sac-text-light">vs</p>
                        <p className="text-sm font-semibold text-euro">
                          {match.team2.playerIds.map(playerName).join(' / ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-display font-black">
                          <span className="text-usa">{result.team1TotalPoints}</span>
                          <span className="text-sac-text-light mx-1 text-sm">-</span>
                          <span className="text-euro">{result.team2TotalPoints}</span>
                        </div>
                        <p className="text-[10px] text-sac-text-light mt-0.5">
                          {played === 0 ? 'Not started' : played === 18 ? 'Final' : `Thru ${played}`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {allMatches.length === 0 && (
          <div className="text-center py-12 text-sac-text-light">
            <p className="text-lg">No active rounds</p>
            <p className="text-sm mt-1">Check back when a round goes live</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreEntry({ matchId, onBack }: { matchId: string; onBack: () => void }) {
  const { getMatch, updateHoleScore, players } = useEvent();
  const match = getMatch(matchId);
  const startHole = match?.startingHole ?? 1;
  const playOrder = useMemo(() => getPlayOrder(startHole), [startHole]);
  const [currentHole, setCurrentHole] = useState(startHole);

  if (!match) return <div className="p-4 text-center">Match not found</div>;

  const hole = match.holes[currentHole - 1];
  const result = calculateMatchResult(match);
  const playerName = (id: string) => players.find(p => p.id === id)?.name ?? id;

  const team1Names = match.team1.playerIds.map(playerName).join(' / ');
  const team2Names = match.team2.playerIds.map(playerName).join(' / ');

  const currentPlayIdx = playOrder.indexOf(currentHole);
  const isFirst = currentPlayIdx <= 0;
  const isLast = currentPlayIdx >= 17;

  const goToPrev = () => { if (!isFirst) setCurrentHole(playOrder[currentPlayIdx - 1]); };
  const goToNext = () => { if (!isLast) setCurrentHole(playOrder[currentPlayIdx + 1]); };

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-navy text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-white/70 hover:text-white text-sm">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-gold text-[10px] tracking-[2px] uppercase font-semibold">
            Group {match.groupNumber}
            {match.teeTime && <span className="text-gold/60"> &middot; {match.teeTime}</span>}
            {startHole !== 1 && <span className="text-gold/60"> &middot; Hole {startHole}</span>}
            {' '}&middot; {FORMAT_LABELS[match.format]}
          </span>
        </div>
        {/* Running score */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-white text-xl font-display font-black">
            {result.team1TotalPoints}
          </span>
          <span className="text-white/30 text-xs">{result.matchStatusText}</span>
          <span className="text-sac-red text-xl font-display font-black">
            {result.team2TotalPoints}
          </span>
        </div>
      </div>

      {/* Hole navigator */}
      <div className="bg-white border-b border-cream-dark px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-1 justify-center">
          {playOrder.map((holeNum, idx) => {
            const h = match.holes[holeNum - 1];
            const winner = getHoleWinner(h);
            const isActive = holeNum === currentHole;
            const hasScore = h.team1Score != null && h.team2Score != null;
            const isWrap = startHole !== 1 && idx > 0 && playOrder[idx - 1] === 18 && holeNum === 1;
            return (
              <button
                key={holeNum}
                onClick={() => setCurrentHole(holeNum)}
                className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                  isWrap ? 'ml-1.5' : ''
                } ${
                  isActive
                    ? 'bg-gold text-navy scale-110'
                    : hasScore
                    ? winner === 'team1' ? 'bg-usa text-white'
                      : winner === 'team2' ? 'bg-euro text-white'
                      : 'bg-cream-dark text-sac-text'
                    : 'bg-cream text-sac-text-light'
                }`}
              >
                {holeNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score Entry Card */}
      <div className="flex-1 px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Hole info */}
          <div className="bg-cream px-4 py-3 text-center">
            <div className="flex items-center justify-between">
              <button onClick={goToPrev} disabled={isFirst}
                className="p-2 rounded-full hover:bg-cream-dark disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-5 h-5 text-navy" />
              </button>
              <div>
                <p className="font-display text-2xl font-black text-navy">Hole {currentHole}</p>
                <p className="text-[10px] tracking-wider uppercase text-sac-text-light">
                  Par {hole.par} &middot; {hole.yardage} yds
                  {startHole !== 1 && (
                    <span> &middot; {currentPlayIdx + 1} of 18</span>
                  )}
                </p>
              </div>
              <button onClick={goToNext} disabled={isLast}
                className="p-2 rounded-full hover:bg-cream-dark disabled:opacity-30 transition-colors">
                <ChevronRight className="w-5 h-5 text-navy" />
              </button>
            </div>
          </div>

          {/* Team 1 score */}
          <ScoreRow
            label={team1Names}
            teamLabel={TEAM_CONFIG[match.team1.teamId].shortName}
            color="usa"
            score={hole.team1Score}
            par={hole.par}
            onScore={(s) => updateHoleScore(matchId, currentHole, s, hole.team2Score)}
          />

          <div className="border-t border-cream" />

          {/* Team 2 score */}
          <ScoreRow
            label={team2Names}
            teamLabel={TEAM_CONFIG[match.team2.teamId].shortName}
            color="euro"
            score={hole.team2Score}
            par={hole.par}
            onScore={(s) => updateHoleScore(matchId, currentHole, hole.team1Score, s)}
          />
        </div>

        {/* Quick nav */}
        <div className="flex justify-between mt-4">
          <button
            onClick={goToPrev}
            disabled={isFirst}
            className="flex items-center gap-1 px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-semibold text-navy disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Prev Hole
          </button>
          {!isLast ? (
            <button
              onClick={goToNext}
              className="flex items-center gap-1 px-4 py-2 bg-gold rounded-lg shadow-sm text-sm font-semibold text-navy"
            >
              Next Hole <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onBack}
              className="flex items-center gap-1 px-4 py-2 bg-green text-white rounded-lg shadow-sm text-sm font-semibold"
            >
              <Check className="w-4 h-4" /> Done
            </button>
          )}
        </div>
      </div>

      {/* Scorecard summary */}
      <ScorecardStrip match={match} currentHole={currentHole} playOrder={playOrder} />
    </div>
  );
}

function ScoreRow({
  label, teamLabel, color, score, par, onScore,
}: {
  label: string;
  teamLabel: string;
  color: 'usa' | 'euro';
  score: number | null;
  par: number;
  onScore: (score: number | null) => void;
}) {
  const scores = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`text-sm font-semibold ${color === 'usa' ? 'text-usa' : 'text-euro'}`}>
            {label}
          </p>
          <p className="text-[10px] text-sac-text-light">{teamLabel}</p>
        </div>
        {score != null && (
          <span className={`text-3xl font-display font-black ${
            score < par ? 'text-sac-red' : score === par ? 'text-sac-text' : 'text-navy'
          }`}>
            {score}
          </span>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {scores.map(s => (
          <button
            key={s}
            onClick={() => onScore(score === s ? null : s)}
            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
              score === s
                ? color === 'usa'
                  ? 'bg-usa text-white shadow-md scale-105'
                  : 'bg-euro text-white shadow-md scale-105'
                : 'bg-cream hover:bg-cream-dark text-sac-text'
            } ${s === par ? 'ring-1 ring-gold/40' : ''}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScorecardStrip({ match, currentHole, playOrder }: { match: Match; currentHole: number; playOrder: number[] }) {
  return (
    <div className="bg-white border-t border-cream-dark px-4 py-3 overflow-x-auto no-scrollbar">
      <table className="w-full text-[10px] text-center">
        <thead>
          <tr className="text-sac-text-light">
            <td className="pr-2 text-left font-semibold">Hole</td>
            {playOrder.map(holeNum => {
              const h = match.holes[holeNum - 1];
              return (
                <td key={h.hole} className={`px-0.5 ${h.hole === currentHole ? 'text-gold font-bold' : ''}`}>
                  {h.hole}
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="pr-2 text-left text-sac-text-light">Par</td>
            {playOrder.map(holeNum => {
              const h = match.holes[holeNum - 1];
              return <td key={h.hole} className="px-0.5 text-sac-text-light">{h.par}</td>;
            })}
          </tr>
          <tr>
            <td className="pr-2 text-left font-bold text-usa">
              {TEAM_CONFIG[match.team1.teamId].shortName}
            </td>
            {playOrder.map(holeNum => {
              const h = match.holes[holeNum - 1];
              return (
                <td key={h.hole} className={`px-0.5 font-bold ${
                  h.team1Score != null && h.team2Score != null
                    ? h.team1Score < h.team2Score ? 'text-green' : h.team1Score > h.team2Score ? 'text-sac-red' : 'text-sac-text'
                    : 'text-sac-text-light'
                }`}>
                  {h.team1Score ?? '–'}
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="pr-2 text-left font-bold text-euro">
              {TEAM_CONFIG[match.team2.teamId].shortName}
            </td>
            {playOrder.map(holeNum => {
              const h = match.holes[holeNum - 1];
              return (
                <td key={h.hole} className={`px-0.5 font-bold ${
                  h.team2Score != null && h.team1Score != null
                    ? h.team2Score < h.team1Score ? 'text-green' : h.team2Score > h.team1Score ? 'text-sac-red' : 'text-sac-text'
                    : 'text-sac-text-light'
                }`}>
                  {h.team2Score ?? '–'}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
