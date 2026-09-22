import { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { TEE_SETS, HOLE_HCP_INDEX, getCourseHandicap, getStrokeHoles, type TeeSet } from '@/data/course';
import { TEAM_CONFIG } from '@/lib/types';
import type { TeamId } from '@/lib/types';
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
  if (format === 'fourball' || format === 'singles') return Math.round(courseHcp * 0.9);
  return courseHcp;
}

function computeTeamHandicap(hcpA: number, hcpB: number, format: RoundFormat): number {
  const low = Math.min(hcpA, hcpB);
  const high = Math.max(hcpA, hcpB);
  if (format === 'scramble') return Math.round(low * 0.15 + high * 0.35);
  if (format === 'shamble') return Math.round(low * 0.60 + high * 0.40);
  return 0;
}

function getTee(id: string) {
  return TEE_SETS.find(t => t.id === id) ?? TEE_SETS[2];
}

export default function Scorecards() {
  const { players } = useEvent();
  const [format, setFormat] = useState<RoundFormat>('singles');
  const [scrambleTeam, setScrambleTeam] = useState<TeamId>('morning-woods');
  const [mw1, setMw1] = useState<CardPlayer>(emptyPlayer());
  const [mw2, setMw2] = useState<CardPlayer>(emptyPlayer());
  const [ce1, setCe1] = useState<CardPlayer>(emptyPlayer());
  const [ce2, setCe2] = useState<CardPlayer>(emptyPlayer());
  const [showCard, setShowCard] = useState(false);

  const mwRoster = players.filter(p => p.team === 'morning-woods').sort((a, b) => a.name.localeCompare(b.name));
  const ceRoster = players.filter(p => p.team === 'chip-endels').sort((a, b) => a.name.localeCompare(b.name));

  const isScramble = format === 'scramble';

  const canGenerate = isScramble
    ? (scrambleTeam === 'morning-woods' ? mw1 : ce1).name.trim().length > 0
      && (scrambleTeam === 'morning-woods' ? mw2 : ce2).name.trim().length > 0
    : mw1.name.trim().length > 0 && mw2.name.trim().length > 0
      && ce1.name.trim().length > 0 && ce2.name.trim().length > 0;

  const roundInfo = ROUND_OPTIONS.find(r => r.id === format)!;

  if (showCard && canGenerate) {
    return (
      <PrintableScorecard
        format={format}
        scrambleTeam={scrambleTeam}
        mw1={mw1} mw2={mw2} ce1={ce1} ce2={ce2}
        roundInfo={roundInfo}
        onBack={() => setShowCard(false)}
      />
    );
  }

  const scrambleColor = scrambleTeam === 'morning-woods' ? 'text-usa' : 'text-euro';
  const scrambleRoster = scrambleTeam === 'morning-woods' ? mwRoster : ceRoster;

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

        {isScramble ? (
          <>
            {/* Team Selector for Scramble */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-[10px] text-gold font-semibold tracking-wider uppercase mb-3">Team</p>
              <div className="flex gap-2">
                {(['morning-woods', 'chip-endels'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setScrambleTeam(t)}
                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm tracking-wider uppercase transition-all ${
                      scrambleTeam === t
                        ? t === 'morning-woods' ? 'bg-usa text-white' : 'bg-euro text-white'
                        : 'bg-cream text-sac-text-light hover:bg-cream-dark'
                    }`}
                  >
                    {TEAM_CONFIG[t].shortName}
                  </button>
                ))}
              </div>
            </div>

            <PlayerInput
              label="Player 1"
              value={scrambleTeam === 'morning-woods' ? mw1 : ce1}
              onChange={scrambleTeam === 'morning-woods' ? setMw1 : setCe1}
              roster={scrambleRoster}
              colorClass={scrambleColor}
            />
            <div className="text-center text-sac-text-light text-xs font-semibold tracking-wider uppercase">&</div>
            <PlayerInput
              label="Player 2"
              value={scrambleTeam === 'morning-woods' ? mw2 : ce2}
              onChange={scrambleTeam === 'morning-woods' ? setMw2 : setCe2}
              roster={scrambleRoster}
              colorClass={scrambleColor}
            />
          </>
        ) : (
          <>
            {/* Morning Woods pair */}
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-2 text-usa px-1">
                {TEAM_CONFIG['morning-woods'].name}
              </p>
              <div className="space-y-2">
                <PlayerInput label="Player 1" value={mw1} onChange={setMw1} roster={mwRoster} colorClass="text-usa" />
                <PlayerInput label="Player 2" value={mw2} onChange={setMw2} roster={mwRoster} colorClass="text-usa" />
              </div>
            </div>

            <div className="text-center text-sac-text-light text-xs font-semibold tracking-wider uppercase">vs</div>

            {/* Chip-Endels pair */}
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-2 text-euro px-1">
                {TEAM_CONFIG['chip-endels'].name}
              </p>
              <div className="space-y-2">
                <PlayerInput label="Player 1" value={ce1} onChange={setCe1} roster={ceRoster} colorClass="text-euro" />
                <PlayerInput label="Player 2" value={ce2} onChange={setCe2} roster={ceRoster} colorClass="text-euro" />
              </div>
            </div>
          </>
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
  label, value, onChange, roster, colorClass,
}: {
  label: string;
  value: CardPlayer;
  onChange: (v: CardPlayer) => void;
  roster: { id: string; name: string; handicap: number }[];
  colorClass: string;
}) {
  const handlePlayerSelect = (playerId: string) => {
    const found = roster.find(p => p.id === playerId);
    if (found) onChange({ ...value, name: found.name, handicapIndex: found.handicap });
  };

  const tee = getTee(value.teeId);
  const courseHcp = getCourseHandicap(value.handicapIndex, tee);

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <select
        value=""
        onChange={e => { if (e.target.value) handlePlayerSelect(e.target.value); }}
        className="w-full bg-cream border border-cream-dark rounded-lg px-2 py-1.5 text-xs text-sac-text-light appearance-none mb-2"
      >
        <option value="">{label} — select from roster...</option>
        {roster.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.handicap})</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value.name}
          onChange={e => onChange({ ...value, name: e.target.value })}
          placeholder="Player name"
          className={`flex-1 bg-cream border border-cream-dark rounded-lg px-2 py-1.5 text-sm font-semibold ${colorClass} placeholder:text-sac-text-light/40`}
        />
        <input
          type="number"
          value={value.handicapIndex}
          onChange={e => onChange({ ...value, handicapIndex: parseFloat(e.target.value) || 0 })}
          step="0.1"
          min="-10"
          max="54"
          className="w-16 bg-cream border border-cream-dark rounded-lg px-2 py-1.5 text-xs font-bold text-navy text-center"
          title="Handicap Index"
        />
        <select
          value={value.teeId}
          onChange={e => onChange({ ...value, teeId: e.target.value })}
          className="w-20 bg-cream border border-cream-dark rounded-lg px-1 py-1.5 text-[10px] text-navy font-semibold appearance-none"
        >
          {TEE_SETS.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <div className="text-center w-10 shrink-0">
          <p className="text-[8px] text-sac-text-light leading-none">HCP</p>
          <p className="text-lg font-display font-black text-navy leading-tight">{courseHcp}</p>
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  format: RoundFormat;
  scrambleTeam: TeamId;
  mw1: CardPlayer; mw2: CardPlayer;
  ce1: CardPlayer; ce2: CardPlayer;
  roundInfo: { label: string; round: string; scoring: string; desc: string };
  onBack: () => void;
}

function PrintableScorecard({ format, scrambleTeam, mw1, mw2, ce1, ce2, roundInfo, onBack }: CardProps) {
  const isScramble = format === 'scramble';
  const isShamble = format === 'shamble';
  const isTeamFormat = isScramble || isShamble;
  const isIndividual = format === 'fourball' || format === 'singles';

  const p1 = isScramble && scrambleTeam === 'chip-endels' ? ce1 : mw1;
  const p2 = isScramble && scrambleTeam === 'chip-endels' ? ce2 : mw2;
  const teamId1: TeamId = isScramble ? scrambleTeam : 'morning-woods';

  const tee1 = getTee(p1.teeId);
  const tee2 = getTee(p2.teeId);
  const tee3 = getTee(ce1.teeId);
  const tee4 = getTee(ce2.teeId);
  const raw1 = getCourseHandicap(p1.handicapIndex, tee1);
  const raw2 = getCourseHandicap(p2.handicapIndex, tee2);
  const raw3 = getCourseHandicap(ce1.handicapIndex, tee3);
  const raw4 = getCourseHandicap(ce2.handicapIndex, tee4);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="no-print px-4 py-3 flex items-center justify-between bg-navy text-white">
        <button onClick={onBack} className="flex items-center gap-1 text-white/70 hover:text-white text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-gold text-navy px-4 py-2 rounded-lg font-bold text-sm">
          <Printer className="w-4 h-4" /> Print (2 per page)
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: letter landscape; margin: 0.2in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .scorecard-half { height: 49vh; overflow: hidden; box-sizing: border-box; }
          .scorecard-divider { border-top: 1px dashed #999; padding-top: 0.1in; }
        }
        @media screen { .print-duplicate { display: none; } }
      `}</style>

      <ScorecardContent
        format={format} scrambleTeam={scrambleTeam} roundInfo={roundInfo}
        p1={p1} p2={p2} ce1={ce1} ce2={ce2}
        tee1={tee1} tee2={tee2} tee3={tee3} tee4={tee4}
        raw1={raw1} raw2={raw2} raw3={raw3} raw4={raw4}
        teamId1={teamId1}
        isScramble={isScramble} isShamble={isShamble} isTeamFormat={isTeamFormat} isIndividual={isIndividual}
        className="scorecard-half"
      />
      <ScorecardContent
        format={format} scrambleTeam={scrambleTeam} roundInfo={roundInfo}
        p1={p1} p2={p2} ce1={ce1} ce2={ce2}
        tee1={tee1} tee2={tee2} tee3={tee3} tee4={tee4}
        raw1={raw1} raw2={raw2} raw3={raw3} raw4={raw4}
        teamId1={teamId1}
        isScramble={isScramble} isShamble={isShamble} isTeamFormat={isTeamFormat} isIndividual={isIndividual}
        className="scorecard-half scorecard-divider print-duplicate"
      />
    </div>
  );
}

function ScorecardContent({
  format, roundInfo,
  p1, p2, ce1, ce2,
  tee1, tee2, tee3, tee4,
  raw1, raw2, raw3, raw4,
  teamId1,
  isScramble, isShamble, isTeamFormat, isIndividual,
  className,
}: {
  format: RoundFormat;
  scrambleTeam: TeamId;
  roundInfo: { label: string; round: string; scoring: string; desc: string };
  p1: CardPlayer; p2: CardPlayer; ce1: CardPlayer; ce2: CardPlayer;
  tee1: TeeSet; tee2: TeeSet; tee3: TeeSet; tee4: TeeSet;
  raw1: number; raw2: number; raw3: number; raw4: number;
  teamId1: TeamId;
  isScramble: boolean; isShamble: boolean; isTeamFormat: boolean; isIndividual: boolean;
  className?: string;
}) {
  const color1 = teamId1 === 'morning-woods' ? 'text-usa' : 'text-euro';
  const bg1 = teamId1 === 'morning-woods' ? 'bg-usa/5' : 'bg-euro/5';

  const teamHcp1 = isTeamFormat ? computeTeamHandicap(raw1, raw2, format) : 0;
  const teamHcp2 = isShamble ? computeTeamHandicap(raw3, raw4, format) : 0;

  const playHcp1 = isIndividual ? applyPlayingHandicap(raw1, format) : 0;
  const playHcp2 = isIndividual ? applyPlayingHandicap(raw2, format) : 0;
  const playHcp3 = isIndividual ? applyPlayingHandicap(raw3, format) : 0;
  const playHcp4 = isIndividual ? applyPlayingHandicap(raw4, format) : 0;

  const strokes1 = isScramble ? getStrokeHoles(teamHcp1) :
                   isShamble  ? getStrokeHoles(teamHcp1) :
                                getStrokeHoles(playHcp1);
  const strokes2 = isScramble ? new Map<number, number>() :
                   isShamble  ? getStrokeHoles(teamHcp2) :
                                getStrokeHoles(playHcp2);
  const strokes3 = isIndividual ? getStrokeHoles(playHcp3) : new Map<number, number>();
  const strokes4 = isIndividual ? getStrokeHoles(playHcp4) : new Map<number, number>();

  const refTee = tee1;

  const uniqueTees = [tee1];
  if (!isScramble) {
    if (tee2.id !== tee1.id && !uniqueTees.some(t => t.id === tee2.id)) uniqueTees.push(tee2);
    if (tee3.id !== tee1.id && !uniqueTees.some(t => t.id === tee3.id)) uniqueTees.push(tee3);
    if (tee4.id !== tee1.id && !uniqueTees.some(t => t.id === tee4.id)) uniqueTees.push(tee4);
  } else {
    if (tee2.id !== tee1.id) uniqueTees.push(tee2);
  }

  return (
    <div className={`bg-white p-3 print:p-2 ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 border-b-2 border-navy pb-1.5">
        <img src="/sac-cup-logo.png" alt="The SAC Cup" className="w-10 h-10 rounded-full print:w-8 print:h-8" />
        <div className="flex-1 text-center">
          <h2 className="font-display text-base font-black text-navy print:text-sm">The SAC Cup 2026</h2>
          <p className="text-[9px] text-sac-text-light">Solina Golf Club &middot; West Columbia, SC</p>
          <p className="text-[9px] font-semibold text-gold mt-0.5">{roundInfo.round} &middot; {roundInfo.label}</p>
        </div>
        <div className="text-right text-[9px] leading-snug">
          {isScramble ? (
            <>
              <p className={`font-bold ${color1}`}>{p1.name}</p>
              <p className={`${color1}`}>&</p>
              <p className={`font-bold ${color1}`}>{p2.name}</p>
            </>
          ) : (
            <>
              <p className="font-bold text-usa">{p1.name.split(' ')[0]} & {p2.name.split(' ')[0]}</p>
              <p className="text-sac-text-light">vs</p>
              <p className="font-bold text-euro">{ce1.name.split(' ')[0]} & {ce2.name.split(' ')[0]}</p>
            </>
          )}
        </div>
      </div>

      {/* Handicap Summary */}
      <div className="flex gap-2 mb-2 text-[8px] print:text-[7px]">
        {isScramble ? (
          <div className={`flex-1 ${bg1} rounded px-2 py-1`}>
            <span className={`font-bold ${color1}`}>{p1.name}</span>
            <span className="text-sac-text-light"> (Idx: {p1.handicapIndex}, Crs: {raw1}, {tee1.name})</span>
            <span className={`font-bold ${color1}`}> & {p2.name}</span>
            <span className="text-sac-text-light"> (Idx: {p2.handicapIndex}, Crs: {raw2}, {tee2.name})</span>
            <span className="font-bold text-navy ml-1">Team HCP: {teamHcp1}</span>
          </div>
        ) : (
          <>
            <div className="flex-1 bg-usa/5 rounded px-2 py-1">
              <span className="font-bold text-usa">{p1.name}</span>
              <span className="text-sac-text-light"> ({p1.handicapIndex} &rarr; {raw1}{isIndividual ? ` &rarr; ${playHcp1}` : ''}, {tee1.name})</span>
              <br />
              <span className="font-bold text-usa">{p2.name}</span>
              <span className="text-sac-text-light"> ({p2.handicapIndex} &rarr; {raw2}{isIndividual ? ` &rarr; ${playHcp2}` : ''}, {tee2.name})</span>
              {isShamble && <span className="font-bold text-navy ml-1">Team: {teamHcp1}</span>}
            </div>
            <div className="flex-1 bg-euro/5 rounded px-2 py-1">
              <span className="font-bold text-euro">{ce1.name}</span>
              <span className="text-sac-text-light"> ({ce1.handicapIndex} &rarr; {raw3}{isIndividual ? ` &rarr; ${playHcp3}` : ''}, {tee3.name})</span>
              <br />
              <span className="font-bold text-euro">{ce2.name}</span>
              <span className="text-sac-text-light"> ({ce2.handicapIndex} &rarr; {raw4}{isIndividual ? ` &rarr; ${playHcp4}` : ''}, {tee4.name})</span>
              {isShamble && <span className="font-bold text-navy ml-1">Team: {teamHcp2}</span>}
            </div>
          </>
        )}
      </div>

      {/* Scorecard Table */}
      <table className="w-full border-collapse text-[8px] print:text-[7px]">
        <thead>
          <tr className="bg-navy text-white">
            <th className="border border-navy/30 px-0.5 py-0.5 text-left w-14">HOLE</th>
            {Array.from({ length: 9 }, (_, i) => (
              <th key={i} className="border border-navy/30 px-0.5 py-0.5 w-7 text-center">{i + 1}</th>
            ))}
            <th className="border border-navy/30 px-0.5 py-0.5 w-7 text-center bg-navy-light">OUT</th>
            {Array.from({ length: 9 }, (_, i) => (
              <th key={i + 9} className="border border-navy/30 px-0.5 py-0.5 w-7 text-center">{i + 10}</th>
            ))}
            <th className="border border-navy/30 px-0.5 py-0.5 w-7 text-center bg-navy-light">IN</th>
            <th className="border border-navy/30 px-0.5 py-0.5 w-7 text-center bg-gold text-navy">TOT</th>
          </tr>
        </thead>
        <tbody>
          {uniqueTees.map(tee => (
            <YardageRow key={tee.id} label={tee.name} tee={tee} />
          ))}

          <tr className="bg-cream/50">
            <td className="border border-cream-dark px-0.5 py-0.5 font-semibold text-sac-text-light">HCP</td>
            {HOLE_HCP_INDEX.slice(0, 9).map((h, i) => (
              <td key={i} className="border border-cream-dark px-0.5 py-0.5 text-center text-sac-text-light">{h}</td>
            ))}
            <td className="border border-cream-dark"></td>
            {HOLE_HCP_INDEX.slice(9).map((h, i) => (
              <td key={i} className="border border-cream-dark px-0.5 py-0.5 text-center text-sac-text-light">{h}</td>
            ))}
            <td className="border border-cream-dark"></td>
            <td className="border border-cream-dark"></td>
          </tr>

          <tr className="bg-cream">
            <td className="border border-cream-dark px-0.5 py-0.5 font-bold">PAR</td>
            {refTee.holePars.slice(0, 9).map((p, i) => (
              <td key={i} className="border border-cream-dark px-0.5 py-0.5 text-center font-bold">{p}</td>
            ))}
            <td className="border border-cream-dark px-0.5 py-0.5 text-center font-bold">{refTee.holePars.slice(0, 9).reduce((a, b) => a + b, 0)}</td>
            {refTee.holePars.slice(9).map((p, i) => (
              <td key={i} className="border border-cream-dark px-0.5 py-0.5 text-center font-bold">{p}</td>
            ))}
            <td className="border border-cream-dark px-0.5 py-0.5 text-center font-bold">{refTee.holePars.slice(9).reduce((a, b) => a + b, 0)}</td>
            <td className="border border-cream-dark px-0.5 py-0.5 text-center font-bold bg-gold/20">{refTee.par}</td>
          </tr>

          {isScramble && (
            <PlayerRows
              name={`${p1.name.split(' ')[0]} & ${p2.name.split(' ')[0]}`}
              hcp={teamHcp1} strokes={strokes1} color={color1} bg={bg1}
            />
          )}

          {isShamble && (
            <>
              <PlayerRows
                name={`${p1.name.split(' ')[0]} & ${p2.name.split(' ')[0]}`}
                hcp={teamHcp1} strokes={strokes1} color="text-usa" bg="bg-usa/5"
              />
              <PlayerRows
                name={`${ce1.name.split(' ')[0]} & ${ce2.name.split(' ')[0]}`}
                hcp={teamHcp2} strokes={strokes2} color="text-euro" bg="bg-euro/5"
              />
            </>
          )}

          {isIndividual && (
            <>
              <PlayerRows name={p1.name} hcp={playHcp1} strokes={strokes1} color="text-usa" bg="bg-usa/5" />
              <PlayerRows name={p2.name} hcp={playHcp2} strokes={strokes2} color="text-usa" bg="bg-usa/5" />
              <PlayerRows name={ce1.name} hcp={playHcp3} strokes={strokes3} color="text-euro" bg="bg-euro/5" />
              <PlayerRows name={ce2.name} hcp={playHcp4} strokes={strokes4} color="text-euro" bg="bg-euro/5" />
            </>
          )}

          <tr className="bg-gold/10">
            <td className="border border-cream-dark px-0.5 py-1 font-bold text-[9px]">MATCH</td>
            {Array.from({ length: 9 }, (_, i) => (
              <td key={i} className="border border-cream-dark px-0.5 py-1"></td>
            ))}
            <td className="border border-cream-dark px-0.5 py-1 font-bold"></td>
            {Array.from({ length: 9 }, (_, i) => (
              <td key={i} className="border border-cream-dark px-0.5 py-1"></td>
            ))}
            <td className="border border-cream-dark px-0.5 py-1 font-bold"></td>
            <td className="border border-cream-dark px-0.5 py-1 font-bold"></td>
          </tr>
        </tbody>
      </table>

      <div className="mt-1 flex items-center gap-3 text-[8px] text-sac-text-light print:text-[7px]">
        <span>● = 1 stroke</span>
        <span>●● = 2 strokes</span>
        <span className="ml-auto">{roundInfo.scoring} &middot; {roundInfo.desc}</span>
      </div>
    </div>
  );
}

function YardageRow({ label, tee }: { label: string; tee: TeeSet }) {
  const front = tee.holeYardages.slice(0, 9);
  const back = tee.holeYardages.slice(9);
  return (
    <tr>
      <td className="border border-cream-dark px-0.5 py-0.5 font-semibold text-sac-text-light text-[7px]">{label}</td>
      {front.map((y, i) => (
        <td key={i} className="border border-cream-dark px-0.5 py-0.5 text-center text-sac-text-light">{y}</td>
      ))}
      <td className="border border-cream-dark px-0.5 py-0.5 text-center font-semibold text-sac-text-light">{front.reduce((a, b) => a + b, 0)}</td>
      {back.map((y, i) => (
        <td key={i} className="border border-cream-dark px-0.5 py-0.5 text-center text-sac-text-light">{y}</td>
      ))}
      <td className="border border-cream-dark px-0.5 py-0.5 text-center font-semibold text-sac-text-light">{back.reduce((a, b) => a + b, 0)}</td>
      <td className="border border-cream-dark px-0.5 py-0.5 text-center font-bold text-sac-text">{tee.totalYards}</td>
    </tr>
  );
}

function PlayerRows({ name, hcp, strokes, color, bg }: {
  name: string; hcp: number; strokes: Map<number, number>;
  color: string; bg: string;
}) {
  return (
    <>
      {/* Strokes row */}
      <tr className={bg}>
        <td className={`border border-cream-dark px-0.5 py-0.5 font-bold ${color} text-[7px] truncate max-w-[56px]`}>
          {name.length > 12 ? name.split(' ')[0] : name}
          <span className="text-sac-text-light font-normal ml-0.5">({hcp})</span>
        </td>
        {Array.from({ length: 9 }, (_, i) => {
          const dots = strokes.get(i + 1) ?? 0;
          return <td key={i} className={`border border-cream-dark px-0.5 py-0.5 text-center ${color}`}>{dots > 0 ? '●'.repeat(dots) : ''}</td>;
        })}
        <td className={`border border-cream-dark px-0.5 py-0.5 text-center font-bold ${color}`}>
          {Array.from({ length: 9 }, (_, i) => strokes.get(i + 1) ?? 0).reduce((a, b) => a + b, 0) || ''}
        </td>
        {Array.from({ length: 9 }, (_, i) => {
          const dots = strokes.get(i + 10) ?? 0;
          return <td key={i} className={`border border-cream-dark px-0.5 py-0.5 text-center ${color}`}>{dots > 0 ? '●'.repeat(dots) : ''}</td>;
        })}
        <td className={`border border-cream-dark px-0.5 py-0.5 text-center font-bold ${color}`}>
          {Array.from({ length: 9 }, (_, i) => strokes.get(i + 10) ?? 0).reduce((a, b) => a + b, 0) || ''}
        </td>
        <td className={`border border-cream-dark px-0.5 py-0.5 text-center font-bold ${color}`}>{hcp}</td>
      </tr>
      {/* Score row */}
      <tr>
        <td className={`border border-cream-dark px-0.5 py-1.5 font-semibold ${color} text-[7px]`}>Score</td>
        {Array.from({ length: 9 }, (_, i) => <td key={i} className="border border-cream-dark px-0.5 py-1.5"></td>)}
        <td className="border border-cream-dark px-0.5 py-1.5"></td>
        {Array.from({ length: 9 }, (_, i) => <td key={i} className="border border-cream-dark px-0.5 py-1.5"></td>)}
        <td className="border border-cream-dark px-0.5 py-1.5"></td>
        <td className="border border-cream-dark px-0.5 py-1.5"></td>
      </tr>
      {/* Net row */}
      <tr className={bg}>
        <td className={`border border-cream-dark px-0.5 py-1 font-semibold ${color} text-[7px]`}>Net</td>
        {Array.from({ length: 9 }, (_, i) => <td key={i} className="border border-cream-dark px-0.5 py-1"></td>)}
        <td className="border border-cream-dark px-0.5 py-1"></td>
        {Array.from({ length: 9 }, (_, i) => <td key={i} className="border border-cream-dark px-0.5 py-1"></td>)}
        <td className="border border-cream-dark px-0.5 py-1"></td>
        <td className="border border-cream-dark px-0.5 py-1"></td>
      </tr>
    </>
  );
}
