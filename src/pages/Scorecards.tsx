import { useState, useRef } from 'react';
import { useEvent } from '@/context/EventContext';
import { TEE_SETS, HOLE_HCP_INDEX, getCourseHandicap, getStrokeHoles, type TeeSet } from '@/data/course';
import { Printer, ChevronLeft } from 'lucide-react';

type RoundFormat = 'scramble' | 'fourball' | 'shamble' | 'singles';

const ROUND_OPTIONS: { id: RoundFormat; label: string; round: string; scoring: string; desc: string }[] = [
  { id: 'scramble', label: 'Net Two-Man Scramble', round: 'Round 1 — Friday AM', scoring: 'Stroke play vs. field', desc: '15% of Player A + 35% of Player B (USGA)' },
  { id: 'fourball', label: 'Four-Ball', round: 'Round 2 — Friday PM', scoring: 'Nassau — 3 pts (Front, Back, Overall)', desc: '90% of each player\'s full course handicap' },
  { id: 'shamble', label: 'Shamble', round: 'Round 3 — Saturday AM', scoring: 'Nassau — 3 pts (Front, Back, Overall)', desc: '60% of Player A + 40% of Player B (USGA)' },
  { id: 'singles', label: 'Singles', round: 'Round 4 — Saturday PM', scoring: 'Nassau — 3 pts (Front, Back, Overall)', desc: '90% of each player\'s full course handicap' },
];

interface CardPlayer {
  name: string;
  handicapIndex: number;
  teeId: string;
}

const emptyPlayer = (): CardPlayer => ({ name: '', handicapIndex: 0, teeId: 'blue' });

function applyPlayingHandicap(courseHcp: number, format: RoundFormat): number {
  if (format === 'fourball' || format === 'singles') {
    return Math.round(courseHcp * 0.9);
  }
  return courseHcp;
}

function computeTeamHandicap(hcpA: number, hcpB: number, format: RoundFormat): number {
  const low = Math.min(hcpA, hcpB);
  const high = Math.max(hcpA, hcpB);
  if (format === 'scramble') {
    return Math.round(low * 0.15 + high * 0.35);
  }
  if (format === 'shamble') {
    return Math.round(low * 0.60 + high * 0.40);
  }
  return 0;
}

export default function Scorecards() {
  const { players } = useEvent();
  const [format, setFormat] = useState<RoundFormat>('singles');
  const [p1, setP1] = useState<CardPlayer>(emptyPlayer());
  const [p2, setP2] = useState<CardPlayer>(emptyPlayer());
  const [showCard, setShowCard] = useState(false);

  const mwPlayers = players.filter(p => p.team === 'morning-woods').sort((a, b) => a.name.localeCompare(b.name));
  const cePlayers = players.filter(p => p.team === 'chip-endels').sort((a, b) => a.name.localeCompare(b.name));

  const tee1 = TEE_SETS.find(t => t.id === p1.teeId)!;
  const tee2 = TEE_SETS.find(t => t.id === p2.teeId)!;
  const rawHcp1 = getCourseHandicap(p1.handicapIndex, tee1);
  const rawHcp2 = getCourseHandicap(p2.handicapIndex, tee2);

  const isTeamFormat = format === 'scramble' || format === 'shamble';

  const playingHcp1 = isTeamFormat ? rawHcp1 : applyPlayingHandicap(rawHcp1, format);
  const playingHcp2 = isTeamFormat ? rawHcp2 : applyPlayingHandicap(rawHcp2, format);
  const teamHcp = isTeamFormat ? computeTeamHandicap(rawHcp1, rawHcp2, format) : 0;

  const canGenerate = p1.name.trim().length > 0 && p2.name.trim().length > 0;
  const roundInfo = ROUND_OPTIONS.find(r => r.id === format)!;

  if (showCard && canGenerate) {
    return (
      <PrintableScorecard
        p1={p1}
        p2={p2}
        tee1={tee1}
        tee2={tee2}
        rawHcp1={rawHcp1}
        rawHcp2={rawHcp2}
        playingHcp1={playingHcp1}
        playingHcp2={playingHcp2}
        teamHcp={teamHcp}
        format={format}
        roundInfo={roundInfo}
        onBack={() => setShowCard(false)}
      />
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-navy to-navy-light text-white px-4 py-5 text-center">
        <h1 className="font-display text-xl font-bold">Scorecards</h1>
        <p className="text-white/50 text-xs mt-1">Handicap calculator & printable cards</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Round Format Selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-[10px] text-gold font-semibold tracking-wider uppercase mb-3">Round Format</p>
          <div className="grid grid-cols-2 gap-2">
            {ROUND_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setFormat(opt.id)}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  format === opt.id
                    ? 'border-gold bg-gold/10'
                    : 'border-cream-dark bg-cream hover:border-gold/40'
                }`}
              >
                <p className="text-xs font-bold text-navy">{opt.label}</p>
                <p className="text-[9px] text-sac-text-light mt-0.5">{opt.round}</p>
                <p className="text-[8px] text-gold mt-0.5">{opt.scoring}</p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-sac-text-light mt-3 bg-cream rounded-lg px-3 py-2">
            <span className="font-semibold text-navy">Handicap: </span>{roundInfo.desc}
          </p>
        </div>

        <PlayerInput
          label="Player A"
          value={p1}
          onChange={setP1}
          mwPlayers={mwPlayers}
          cePlayers={cePlayers}
          rawHcp={rawHcp1}
          playingHcp={isTeamFormat ? null : playingHcp1}
          colorClass="text-usa"
        />

        <div className="text-center text-sac-text-light text-xs font-semibold tracking-wider uppercase">
          {isTeamFormat ? '&' : 'vs'}
        </div>

        <PlayerInput
          label="Player B"
          value={p2}
          onChange={setP2}
          mwPlayers={mwPlayers}
          cePlayers={cePlayers}
          rawHcp={rawHcp2}
          playingHcp={isTeamFormat ? null : playingHcp2}
          colorClass="text-euro"
        />

        {/* Team Handicap Summary for scramble/shamble */}
        {isTeamFormat && canGenerate && (
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-[10px] text-gold font-semibold tracking-wider uppercase mb-2">Team Playing Handicap</p>
            <div className="flex items-center justify-center gap-3">
              <div className="text-[10px] text-sac-text-light">
                {format === 'scramble' ? '15%' : '60%'} of {rawHcp1 <= rawHcp2 ? p1.name.split(' ')[0] : p2.name.split(' ')[0]} ({Math.min(rawHcp1, rawHcp2)})
              </div>
              <span className="text-sac-text-light">+</span>
              <div className="text-[10px] text-sac-text-light">
                {format === 'scramble' ? '35%' : '40%'} of {rawHcp1 > rawHcp2 ? p1.name.split(' ')[0] : p2.name.split(' ')[0]} ({Math.max(rawHcp1, rawHcp2)})
              </div>
              <span className="text-sac-text-light">=</span>
              <div className="text-2xl font-display font-black text-navy">{teamHcp}</div>
            </div>
          </div>
        )}

        {canGenerate && (
          <StrokeSummary
            name1={p1.name}
            name2={p2.name}
            hcp1={isTeamFormat ? teamHcp : playingHcp1}
            hcp2={isTeamFormat ? 0 : playingHcp2}
            isTeamFormat={isTeamFormat}
            teamLabel={isTeamFormat ? `${p1.name.split(' ')[0]} & ${p2.name.split(' ')[0]}` : undefined}
          />
        )}

        <button
          onClick={() => setShowCard(true)}
          disabled={!canGenerate}
          className="w-full flex items-center justify-center gap-2 bg-gold text-navy font-bold py-3 rounded-xl shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-gold/90"
        >
          <Printer className="w-5 h-5" />
          Generate Scorecard
        </button>
      </div>
    </div>
  );
}

function PlayerInput({
  label, value, onChange, mwPlayers, cePlayers, rawHcp, playingHcp, colorClass,
}: {
  label: string;
  value: CardPlayer;
  onChange: (v: CardPlayer) => void;
  mwPlayers: { id: string; name: string; handicap: number }[];
  cePlayers: { id: string; name: string; handicap: number }[];
  rawHcp: number;
  playingHcp: number | null;
  colorClass: string;
}) {
  const handlePlayerSelect = (playerId: string) => {
    const all = [...mwPlayers, ...cePlayers];
    const found = all.find(p => p.id === playerId);
    if (found) {
      onChange({ ...value, name: found.name, handicapIndex: found.handicap });
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-[10px] text-gold font-semibold tracking-wider uppercase mb-2">{label}</p>

      <select
        value=""
        onChange={e => { if (e.target.value) handlePlayerSelect(e.target.value); }}
        className="w-full bg-cream border border-cream-dark rounded-lg px-3 py-2 text-xs text-sac-text-light appearance-none mb-3"
      >
        <option value="">Quick-fill from roster...</option>
        <optgroup label="Morning Woods">
          {mwPlayers.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.handicap})</option>
          ))}
        </optgroup>
        <optgroup label="Chip-Endels">
          {cePlayers.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.handicap})</option>
          ))}
        </optgroup>
      </select>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[10px] text-sac-text-light mb-1">Name</p>
          <input
            type="text"
            value={value.name}
            onChange={e => onChange({ ...value, name: e.target.value })}
            placeholder="Player name"
            className={`w-full bg-cream border border-cream-dark rounded-lg px-3 py-2 text-sm font-semibold ${colorClass} placeholder:text-sac-text-light/40`}
          />
        </div>
        <div className="w-20">
          <p className="text-[10px] text-sac-text-light mb-1">HCP Index</p>
          <input
            type="number"
            value={value.handicapIndex}
            onChange={e => onChange({ ...value, handicapIndex: parseFloat(e.target.value) || 0 })}
            step="0.1"
            min="-10"
            max="54"
            className="w-full bg-cream border border-cream-dark rounded-lg px-3 py-2 text-sm font-bold text-navy text-center"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <div className="flex-1">
          <p className="text-[10px] text-sac-text-light mb-1">Tee</p>
          <select
            value={value.teeId}
            onChange={e => onChange({ ...value, teeId: e.target.value })}
            className="w-full bg-cream border border-cream-dark rounded-lg px-3 py-2 text-xs text-navy font-semibold appearance-none"
          >
            {TEE_SETS.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.totalYards} yds, {t.courseRating}/{t.slopeRating})</option>
            ))}
          </select>
        </div>
        <div className="text-center px-3">
          <p className="text-[10px] text-sac-text-light">Course HCP</p>
          <p className="text-2xl font-display font-black text-navy">{rawHcp}</p>
          {playingHcp !== null && playingHcp !== rawHcp && (
            <p className="text-[9px] text-gold font-semibold">Playing: {playingHcp}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StrokeSummary({ name1, name2, hcp1, hcp2, isTeamFormat, teamLabel }: {
  name1: string; name2: string; hcp1: number; hcp2: number;
  isTeamFormat: boolean; teamLabel?: string;
}) {
  const strokes1 = getStrokeHoles(hcp1);
  const strokes2 = isTeamFormat ? new Map<number, number>() : getStrokeHoles(hcp2);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-[10px] text-gold font-semibold tracking-wider uppercase mb-3">
        Stroke Allocation {isTeamFormat ? '(Team)' : ''}
      </p>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-[10px] text-center min-w-[540px]">
          <thead>
            <tr className="text-sac-text-light border-b border-cream-dark">
              <td className="px-1 py-1 text-left font-semibold w-20">Hole</td>
              {Array.from({ length: 9 }, (_, i) => (
                <td key={i} className="px-0.5 py-1 font-semibold">{i + 1}</td>
              ))}
              <td className="px-1 py-1 font-semibold text-gold">OUT</td>
              {Array.from({ length: 9 }, (_, i) => (
                <td key={i + 9} className="px-0.5 py-1 font-semibold">{i + 10}</td>
              ))}
              <td className="px-1 py-1 font-semibold text-gold">IN</td>
              <td className="px-1 py-1 font-semibold text-gold">TOT</td>
            </tr>
          </thead>
          <tbody>
            <tr className="text-sac-text-light">
              <td className="text-left px-1">HCP</td>
              {HOLE_HCP_INDEX.slice(0, 9).map((h, i) => <td key={i} className="px-0.5">{h}</td>)}
              <td></td>
              {HOLE_HCP_INDEX.slice(9).map((h, i) => <td key={i} className="px-0.5">{h}</td>)}
              <td></td>
              <td></td>
            </tr>
            {isTeamFormat ? (
              <StrokeRow name={teamLabel || 'Team'} strokes={strokes1} hcp={hcp1} colorClass="text-usa" />
            ) : (
              <>
                <StrokeRow name={name1} strokes={strokes1} hcp={hcp1} colorClass="text-usa" />
                <StrokeRow name={name2} strokes={strokes2} hcp={hcp2} colorClass="text-euro" />
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StrokeRow({ name, strokes, hcp, colorClass }: {
  name: string; strokes: Map<number, number>; hcp: number; colorClass: string;
}) {
  const frontStrokes = Array.from({ length: 9 }, (_, i) => strokes.get(i + 1) ?? 0);
  const backStrokes = Array.from({ length: 9 }, (_, i) => strokes.get(i + 10) ?? 0);
  const frontTotal = frontStrokes.reduce((a, b) => a + b, 0);
  const backTotal = backStrokes.reduce((a, b) => a + b, 0);

  return (
    <tr>
      <td className={`text-left px-1 font-semibold ${colorClass} truncate max-w-[80px]`}>{name.split(' ')[0]}</td>
      {frontStrokes.map((dots, i) => (
        <td key={i} className="px-0.5">{dots > 0 ? '●'.repeat(dots) : ''}</td>
      ))}
      <td className={`${colorClass} font-bold`}>{frontTotal || ''}</td>
      {backStrokes.map((dots, i) => (
        <td key={i} className="px-0.5">{dots > 0 ? '●'.repeat(dots) : ''}</td>
      ))}
      <td className={`${colorClass} font-bold`}>{backTotal || ''}</td>
      <td className={`${colorClass} font-bold`}>{hcp}</td>
    </tr>
  );
}

function PrintableScorecard({ p1, p2, tee1, tee2, rawHcp1, rawHcp2, playingHcp1, playingHcp2, teamHcp, format, roundInfo, onBack }: {
  p1: CardPlayer; p2: CardPlayer; tee1: TeeSet; tee2: TeeSet;
  rawHcp1: number; rawHcp2: number; playingHcp1: number; playingHcp2: number;
  teamHcp: number; format: RoundFormat;
  roundInfo: { label: string; round: string; scoring: string; desc: string };
  onBack: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isTeamFormat = format === 'scramble' || format === 'shamble';

  const printHcp1 = isTeamFormat ? teamHcp : playingHcp1;
  const printHcp2 = isTeamFormat ? 0 : playingHcp2;
  const strokes1 = getStrokeHoles(printHcp1);
  const strokes2 = isTeamFormat ? new Map<number, number>() : getStrokeHoles(printHcp2);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="no-print px-4 py-3 flex items-center justify-between bg-navy text-white">
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 hover:text-white text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-gold text-navy px-4 py-2 rounded-lg font-bold text-sm">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div ref={cardRef} className="bg-white p-4 print:p-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b-2 border-navy pb-2">
          <img src="/sac-cup-logo.png" alt="The SAC Cup" className="w-12 h-12 rounded-full" />
          <div className="flex-1 text-center">
            <h2 className="font-display text-lg font-black text-navy">The SAC Cup 2026</h2>
            <p className="text-[10px] text-sac-text-light">Solina Golf Club &middot; West Columbia, SC</p>
            <p className="text-[10px] font-semibold text-gold mt-0.5">{roundInfo.round} &middot; {roundInfo.label}</p>
          </div>
          <div className="text-right text-[10px]">
            <p className="font-bold text-usa">{p1.name}</p>
            <p className="text-sac-text-light">{isTeamFormat ? '&' : 'vs'}</p>
            <p className="font-bold text-euro">{p2.name}</p>
          </div>
        </div>

        {/* Handicap Summary */}
        <div className="flex gap-4 mb-3 text-[10px]">
          <div className="flex-1 bg-usa/5 rounded px-2 py-1">
            <span className="font-bold text-usa">{p1.name}</span>
            <span className="text-sac-text-light ml-2">
              Index: {p1.handicapIndex} &rarr; Course: {rawHcp1}
              {!isTeamFormat && rawHcp1 !== playingHcp1 && <> &rarr; Playing: {playingHcp1}</>}
            </span>
            <span className="text-sac-text-light ml-2">({tee1.name})</span>
          </div>
          <div className="flex-1 bg-euro/5 rounded px-2 py-1">
            <span className="font-bold text-euro">{p2.name}</span>
            <span className="text-sac-text-light ml-2">
              Index: {p2.handicapIndex} &rarr; Course: {rawHcp2}
              {!isTeamFormat && rawHcp2 !== playingHcp2 && <> &rarr; Playing: {playingHcp2}</>}
            </span>
            <span className="text-sac-text-light ml-2">({tee2.name})</span>
          </div>
        </div>

        {isTeamFormat && (
          <div className="mb-3 text-[10px] bg-gold/10 rounded px-2 py-1.5 text-center">
            <span className="font-bold text-navy">Team Handicap: {teamHcp}</span>
            <span className="text-sac-text-light ml-2">({roundInfo.desc})</span>
          </div>
        )}

        {/* Scorecard Table */}
        <table className="w-full border-collapse text-[9px] print:text-[8px]">
          <thead>
            <tr className="bg-navy text-white">
              <th className="border border-navy/30 px-1 py-1 text-left w-16">HOLE</th>
              {Array.from({ length: 9 }, (_, i) => (
                <th key={i} className="border border-navy/30 px-1 py-1 w-8 text-center">{i + 1}</th>
              ))}
              <th className="border border-navy/30 px-1 py-1 w-8 text-center bg-navy-light">OUT</th>
              {Array.from({ length: 9 }, (_, i) => (
                <th key={i + 9} className="border border-navy/30 px-1 py-1 w-8 text-center">{i + 10}</th>
              ))}
              <th className="border border-navy/30 px-1 py-1 w-8 text-center bg-navy-light">IN</th>
              <th className="border border-navy/30 px-1 py-1 w-8 text-center bg-gold text-navy">TOT</th>
            </tr>
          </thead>
          <tbody>
            <ScorecardYardageRow label={tee1.name} tee={tee1} colorClass="text-usa" />
            {tee1.id !== tee2.id && (
              <ScorecardYardageRow label={tee2.name} tee={tee2} colorClass="text-euro" />
            )}

            <tr className="bg-cream/50">
              <td className="border border-cream-dark px-1 py-0.5 font-semibold text-sac-text-light">HCP</td>
              {HOLE_HCP_INDEX.slice(0, 9).map((h, i) => (
                <td key={i} className="border border-cream-dark px-1 py-0.5 text-center text-sac-text-light">{h}</td>
              ))}
              <td className="border border-cream-dark"></td>
              {HOLE_HCP_INDEX.slice(9).map((h, i) => (
                <td key={i} className="border border-cream-dark px-1 py-0.5 text-center text-sac-text-light">{h}</td>
              ))}
              <td className="border border-cream-dark"></td>
              <td className="border border-cream-dark"></td>
            </tr>

            <tr className="bg-cream">
              <td className="border border-cream-dark px-1 py-0.5 font-bold">PAR</td>
              {tee1.holePars.slice(0, 9).map((p, i) => (
                <td key={i} className="border border-cream-dark px-1 py-0.5 text-center font-bold">{p}</td>
              ))}
              <td className="border border-cream-dark px-1 py-0.5 text-center font-bold">{tee1.holePars.slice(0, 9).reduce((a, b) => a + b, 0)}</td>
              {tee1.holePars.slice(9).map((p, i) => (
                <td key={i} className="border border-cream-dark px-1 py-0.5 text-center font-bold">{p}</td>
              ))}
              <td className="border border-cream-dark px-1 py-0.5 text-center font-bold">{tee1.holePars.slice(9).reduce((a, b) => a + b, 0)}</td>
              <td className="border border-cream-dark px-1 py-0.5 text-center font-bold bg-gold/20">{tee1.par}</td>
            </tr>

            {isTeamFormat ? (
              <ScorecardPlayerRow
                name={`${p1.name.split(' ')[0]} & ${p2.name.split(' ')[0]}`}
                courseHcp={teamHcp}
                strokes={strokes1}
                colorClass="text-usa"
                bgClass="bg-usa/5"
                dotColor="text-usa"
              />
            ) : (
              <>
                <ScorecardPlayerRow
                  name={p1.name}
                  courseHcp={playingHcp1}
                  strokes={strokes1}
                  colorClass="text-usa"
                  bgClass="bg-usa/5"
                  dotColor="text-usa"
                />
                <ScorecardPlayerRow
                  name={p2.name}
                  courseHcp={playingHcp2}
                  strokes={strokes2}
                  colorClass="text-euro"
                  bgClass="bg-euro/5"
                  dotColor="text-euro"
                />
              </>
            )}

            <tr className="bg-gold/10">
              <td className="border border-cream-dark px-1 py-1 font-bold text-[10px]">MATCH</td>
              {Array.from({ length: 9 }, (_, i) => (
                <td key={i} className="border border-cream-dark px-1 py-1 text-center"></td>
              ))}
              <td className="border border-cream-dark px-1 py-1 text-center font-bold"></td>
              {Array.from({ length: 9 }, (_, i) => (
                <td key={i} className="border border-cream-dark px-1 py-1 text-center"></td>
              ))}
              <td className="border border-cream-dark px-1 py-1 text-center font-bold"></td>
              <td className="border border-cream-dark px-1 py-1 text-center font-bold"></td>
            </tr>
          </tbody>
        </table>

        <div className="mt-2 flex items-center gap-4 text-[9px] text-sac-text-light">
          <span>● = 1 stroke received</span>
          <span>●● = 2 strokes received</span>
          <span className="ml-auto">
            {isTeamFormat
              ? `Team HCP: ${teamHcp} (${roundInfo.desc})`
              : `Playing HCP: ${p1.name.split(' ')[0]} (${playingHcp1}) | ${p2.name.split(' ')[0]} (${playingHcp2}) — 90% of course`
            }
          </span>
        </div>
      </div>
    </div>
  );
}

function ScorecardYardageRow({ label, tee, colorClass }: { label: string; tee: TeeSet; colorClass: string }) {
  const front = tee.holeYardages.slice(0, 9);
  const back = tee.holeYardages.slice(9);
  return (
    <tr>
      <td className={`border border-cream-dark px-1 py-0.5 font-semibold ${colorClass} text-[8px]`}>{label}</td>
      {front.map((y, i) => (
        <td key={i} className="border border-cream-dark px-1 py-0.5 text-center text-sac-text-light">{y}</td>
      ))}
      <td className="border border-cream-dark px-1 py-0.5 text-center font-semibold text-sac-text-light">{front.reduce((a, b) => a + b, 0)}</td>
      {back.map((y, i) => (
        <td key={i} className="border border-cream-dark px-1 py-0.5 text-center text-sac-text-light">{y}</td>
      ))}
      <td className="border border-cream-dark px-1 py-0.5 text-center font-semibold text-sac-text-light">{back.reduce((a, b) => a + b, 0)}</td>
      <td className="border border-cream-dark px-1 py-0.5 text-center font-bold text-sac-text">{tee.totalYards}</td>
    </tr>
  );
}

function ScorecardPlayerRow({ name, courseHcp, strokes, colorClass, bgClass, dotColor }: {
  name: string; courseHcp: number; strokes: Map<number, number>;
  colorClass: string; bgClass: string; dotColor: string;
}) {
  return (
    <>
      <tr className={bgClass}>
        <td className={`border border-cream-dark px-1 py-0.5 font-bold ${colorClass} text-[8px]`}>
          {name.split(' ')[0]}
        </td>
        {Array.from({ length: 9 }, (_, i) => {
          const dots = strokes.get(i + 1) ?? 0;
          return (
            <td key={i} className={`border border-cream-dark px-1 py-0.5 text-center ${dotColor}`}>
              {dots > 0 ? '●'.repeat(dots) : ''}
            </td>
          );
        })}
        <td className={`border border-cream-dark px-1 py-0.5 text-center font-bold ${colorClass}`}>
          {Array.from({ length: 9 }, (_, i) => strokes.get(i + 1) ?? 0).reduce((a, b) => a + b, 0) || ''}
        </td>
        {Array.from({ length: 9 }, (_, i) => {
          const dots = strokes.get(i + 10) ?? 0;
          return (
            <td key={i} className={`border border-cream-dark px-1 py-0.5 text-center ${dotColor}`}>
              {dots > 0 ? '●'.repeat(dots) : ''}
            </td>
          );
        })}
        <td className={`border border-cream-dark px-1 py-0.5 text-center font-bold ${colorClass}`}>
          {Array.from({ length: 9 }, (_, i) => strokes.get(i + 10) ?? 0).reduce((a, b) => a + b, 0) || ''}
        </td>
        <td className={`border border-cream-dark px-1 py-0.5 text-center font-bold ${colorClass}`}>{courseHcp}</td>
      </tr>
      <tr>
        <td className={`border border-cream-dark px-1 py-2 font-semibold ${colorClass} text-[8px]`}>Score</td>
        {Array.from({ length: 9 }, (_, i) => (
          <td key={i} className="border border-cream-dark px-1 py-2"></td>
        ))}
        <td className="border border-cream-dark px-1 py-2"></td>
        {Array.from({ length: 9 }, (_, i) => (
          <td key={i} className="border border-cream-dark px-1 py-2"></td>
        ))}
        <td className="border border-cream-dark px-1 py-2"></td>
        <td className="border border-cream-dark px-1 py-2"></td>
      </tr>
      <tr className={bgClass}>
        <td className={`border border-cream-dark px-1 py-1.5 font-semibold ${colorClass} text-[8px]`}>Net</td>
        {Array.from({ length: 9 }, (_, i) => (
          <td key={i} className="border border-cream-dark px-1 py-1.5"></td>
        ))}
        <td className="border border-cream-dark px-1 py-1.5"></td>
        {Array.from({ length: 9 }, (_, i) => (
          <td key={i} className="border border-cream-dark px-1 py-1.5"></td>
        ))}
        <td className="border border-cream-dark px-1 py-1.5"></td>
        <td className="border border-cream-dark px-1 py-1.5"></td>
      </tr>
    </>
  );
}
