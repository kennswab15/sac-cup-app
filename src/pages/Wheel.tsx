import { useState, useRef, useCallback } from 'react';
import { useEvent } from '@/context/EventContext';
import { TEAM_CONFIG } from '@/lib/types';
import type { Match } from '@/lib/types';

const WHEEL_COLORS = [
  '#B22234', '#003399', '#c9a84c', '#2d5016',
  '#D44054', '#1A5CB0', '#e0c97a', '#4a7c28',
];

export default function Wheel() {
  const { event, players } = useEvent();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<SVGSVGElement>(null);

  const scrambleRounds = event.rounds.filter(r => r.format === 'scramble');
  const allMatches = scrambleRounds.flatMap(r => r.matches);

  const getNames = useCallback((match: Match) => {
    const ids = [...match.team1.playerIds, ...match.team2.playerIds];
    return ids.map(id => {
      const p = players.find(pl => pl.id === id);
      return p ? p.name.split(' ')[0] : id;
    });
  }, [players]);

  const spin = useCallback(() => {
    if (spinning || !selectedMatch) return;
    const names = getNames(selectedMatch);
    if (names.length === 0) return;

    setSpinning(true);
    setResult(null);

    const winnerIdx = Math.floor(Math.random() * names.length);
    const sliceAngle = 360 / names.length;
    const targetAngle = 360 - (winnerIdx * sliceAngle + sliceAngle / 2);
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = rotation + spins * 360 + targetAngle - (rotation % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      const fullName = players.find(p => p.name.split(' ')[0] === names[winnerIdx])?.name ?? names[winnerIdx];
      setResult(fullName);
    }, 3500);
  }, [spinning, selectedMatch, getNames, rotation, players]);

  const playerName = (id: string) => players.find(p => p.id === id)?.name ?? id;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-navy to-navy-light text-white px-4 py-6 text-center">
        <h1 className="font-display text-xl font-bold">Wheel of Low</h1>
        <p className="text-white/50 text-xs mt-1">
          Spin to pick whose ball to play
        </p>
      </div>

      {/* Group Selector */}
      <div className="px-4 py-4">
        <p className="text-[10px] text-sac-text-light tracking-wider uppercase font-semibold mb-2">
          Select your group
        </p>
        <div className="grid grid-cols-2 gap-2">
          {allMatches.map(match => {
            const names = [...match.team1.playerIds, ...match.team2.playerIds].map(id => {
              const p = players.find(pl => pl.id === id);
              return p ? p.name.split(' ')[0] : id;
            });
            const isSelected = selectedMatch?.id === match.id;
            return (
              <button
                key={match.id}
                onClick={() => { setSelectedMatch(match); setResult(null); }}
                className={`text-left p-3 rounded-xl text-xs transition-all ${
                  isSelected
                    ? 'bg-navy text-white shadow-md ring-2 ring-gold'
                    : 'bg-white text-sac-text shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`font-bold ${isSelected ? 'text-gold' : 'text-navy'}`}>
                    Grp {match.groupNumber}
                  </span>
                  {match.teeTime && (
                    <span className={isSelected ? 'text-white/50' : 'text-sac-text-light'}>
                      · {match.teeTime}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] leading-snug ${isSelected ? 'text-white/70' : 'text-sac-text-light'}`}>
                  {names.join(', ')}
                </p>
              </button>
            );
          })}
        </div>

        {allMatches.length === 0 && (
          <div className="text-center py-12 text-sac-text-light">
            <p className="font-display text-lg">No scramble rounds</p>
            <p className="text-sm mt-1">The wheel is for scramble format groups</p>
          </div>
        )}
      </div>

      {/* Wheel */}
      {selectedMatch && (
        <div className="px-4 pb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-navy drop-shadow-md" />
              </div>

              <svg
                ref={wheelRef}
                viewBox="0 0 200 200"
                className="w-full h-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                {(() => {
                  const names = getNames(selectedMatch);
                  const count = names.length;
                  const sliceAngle = 360 / count;

                  return names.map((name, i) => {
                    const startAngle = i * sliceAngle - 90;
                    const endAngle = startAngle + sliceAngle;
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    const x1 = 100 + 95 * Math.cos(startRad);
                    const y1 = 100 + 95 * Math.sin(startRad);
                    const x2 = 100 + 95 * Math.cos(endRad);
                    const y2 = 100 + 95 * Math.sin(endRad);
                    const largeArc = sliceAngle > 180 ? 1 : 0;
                    const midRad = ((startAngle + endAngle) / 2 * Math.PI) / 180;
                    const textX = 100 + 58 * Math.cos(midRad);
                    const textY = 100 + 58 * Math.sin(midRad);
                    const textAngle = (startAngle + endAngle) / 2 + 90;

                    return (
                      <g key={i}>
                        <path
                          d={`M100,100 L${x1},${y1} A95,95 0 ${largeArc},1 ${x2},${y2} Z`}
                          fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        <text
                          x={textX}
                          y={textY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={count <= 4 ? '11' : '9'}
                          fontWeight="bold"
                          transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                        >
                          {name}
                        </text>
                      </g>
                    );
                  });
                })()}
                <circle cx="100" cy="100" r="18" fill="#0a1628" stroke="white" strokeWidth="2" />
                <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fill="#c9a84c" fontSize="7" fontWeight="bold">
                  SPIN
                </text>
              </svg>
            </div>

            {/* Result */}
            {result && !spinning && (
              <div className="text-center mt-4 animate-bounce">
                <p className="text-sac-text-light text-xs uppercase tracking-wider">Play this ball</p>
                <p className="font-display text-2xl font-black text-navy mt-1">{result}</p>
              </div>
            )}

            {/* Spin Button */}
            <button
              onClick={spin}
              disabled={spinning}
              className={`w-full mt-4 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all ${
                spinning
                  ? 'bg-cream-dark text-sac-text-light cursor-not-allowed'
                  : 'bg-gold text-navy shadow-md hover:bg-gold-light active:scale-95'
              }`}
            >
              {spinning ? 'Spinning...' : result ? 'Spin Again' : 'Spin the Wheel'}
            </button>

            {/* Group Players */}
            <div className="mt-4 pt-4 border-t border-cream-dark">
              <p className="text-[10px] text-sac-text-light tracking-wider uppercase font-semibold mb-2">
                Group {selectedMatch.groupNumber} Players
              </p>
              <div className="grid grid-cols-2 gap-1">
                {[...selectedMatch.team1.playerIds, ...selectedMatch.team2.playerIds].map(id => (
                  <div key={id} className="flex items-center gap-1.5 text-xs text-sac-text py-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TEAM_CONFIG[players.find(p => p.id === id)?.team ?? 'morning-woods'].color }}
                    />
                    {playerName(id)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
