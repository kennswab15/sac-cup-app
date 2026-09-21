import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight, Trophy, Disc3, Users, Calculator } from 'lucide-react';
import { useEvent } from '@/context/EventContext';
import { getEventStandings, getLeaderTeam, calculateMatchResult, getRoundStandings } from '@/lib/scoring';
import { FORMAT_LABELS, TEAM_CONFIG } from '@/lib/types';
import type { SacEvent } from '@/lib/types';

export default function Home() {
  const { event } = useEvent();
  const { team1Points, team2Points, roundStandings } = getEventStandings(event.rounds);
  const leader = getLeaderTeam(team1Points, team2Points);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-green text-white px-4 py-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(201,168,76,0.08)_0%,transparent_50%)]" />
        <div className="relative z-10">
          <img src="/sac-cup-logo.png" alt="The SAC Cup" className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg border-2 border-gold/30" />
          <h1 className="font-display text-4xl font-black tracking-wide mb-1">
            {event.name.replace(/\d+/, '').trim()}
          </h1>
          <p className="text-gold text-xs tracking-[4px] uppercase font-medium">{event.year}</p>
          <p className="text-white/30 text-[10px] tracking-[3px] uppercase mt-2">
            Solina Annual Championship
          </p>
          <p className="text-white/50 text-sm italic font-display mt-1">
            Est. 2025 &middot; Ryder Cup Style
          </p>
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <div className="text-center">
              <MapPin className="w-4 h-4 text-gold mx-auto mb-1" />
              <p className="text-white/70 text-xs">{event.venue}</p>
            </div>
            <div className="text-center">
              <Calendar className="w-4 h-4 text-gold mx-auto mb-1" />
              <p className="text-white/70 text-xs">Sept 17–19, 2026</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Scoreboard */}
      <section className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto">
          <div className="bg-navy px-4 py-3 text-center">
            <p className="text-gold text-[10px] tracking-[3px] uppercase font-semibold">
              {event.status === 'live' ? 'Live Standings' : 'Event Standings'}
            </p>
          </div>
          <div className="flex items-center justify-center py-6 px-4 gap-4">
            <div className="text-center flex-1">
              <p className="font-display text-sm text-usa font-semibold">
                {TEAM_CONFIG['morning-woods'].name}
              </p>
              <p className="font-display text-5xl font-black text-usa mt-1">
                {team1Points % 1 === 0 ? team1Points : team1Points.toFixed(1)}
              </p>
              {leader === 'morning-woods' && (
                <span className="inline-block mt-1 text-[10px] bg-gold/15 text-gold-light px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase">
                  Leading
                </span>
              )}
            </div>
            <div className="text-sac-text-light text-sm italic font-display">vs</div>
            <div className="text-center flex-1">
              <p className="font-display text-sm text-euro font-semibold">
                {TEAM_CONFIG['chip-endels'].name}
              </p>
              <p className="font-display text-5xl font-black text-euro mt-1">
                {team2Points % 1 === 0 ? team2Points : team2Points.toFixed(1)}
              </p>
              {leader === 'chip-endels' && (
                <span className="inline-block mt-1 text-[10px] bg-euro/15 text-euro-light px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase">
                  Leading
                </span>
              )}
            </div>
          </div>
          <div className="border-t border-cream-dark px-4 py-2 text-center">
            <p className="text-[10px] text-sac-text-light tracking-wider uppercase">
              {event.pointsToWin} points to win &middot; {event.totalPoints} total
            </p>
          </div>
        </div>
      </section>

      {/* Projection Bar */}
      <ProjectionBar event={event} />

      {/* Round Cards */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <h2 className="font-display text-xl font-bold text-navy mb-4">Rounds</h2>
        <div className="space-y-3">
          {roundStandings.map(({ round, team1Points: rT1, team2Points: rT2 }) => (
            <Link
              key={round.id}
              to={`/leaderboard?round=${round.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-navy text-sm">{round.name}</p>
                  <p className="text-[10px] text-sac-text-light tracking-wider uppercase">
                    {FORMAT_LABELS[round.format]} &middot; {round.matches.length} matches
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase ${
                  round.status === 'live'
                    ? 'bg-green-light/15 text-green-light'
                    : round.status === 'complete'
                    ? 'bg-navy/10 text-navy'
                    : 'bg-cream-dark text-sac-text-light'
                }`}>
                  {round.status === 'live' && '● '}
                  {round.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-usa">{rT1}</span>
                <div className="flex-1 mx-3 h-2 bg-cream rounded-full overflow-hidden flex">
                  {(rT1 + rT2) > 0 && (
                    <>
                      <div className="bg-usa h-full transition-all" style={{ width: `${(rT1 / (rT1 + rT2)) * 100}%` }} />
                      <div className="bg-euro h-full transition-all" style={{ width: `${(rT2 / (rT1 + rT2)) * 100}%` }} />
                    </>
                  )}
                </div>
                <span className="font-bold text-euro">{rT2}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-sac-text-light">
                <span>{round.totalPoints} pts available</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 pb-8 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/scoring"
            className="bg-gold text-navy rounded-xl p-4 text-center font-semibold text-sm shadow-md hover:bg-gold-light transition-colors"
          >
            <PenLine className="w-6 h-6 mx-auto mb-1" />
            Enter Scores
          </Link>
          <Link
            to="/leaderboard"
            className="bg-navy text-white rounded-xl p-4 text-center font-semibold text-sm shadow-md hover:bg-navy-light transition-colors"
          >
            <Trophy className="w-6 h-6 mx-auto mb-1" />
            Leaderboard
          </Link>
          <Link
            to="/wheel"
            className="bg-white text-navy rounded-xl p-4 text-center font-semibold text-sm shadow-md hover:bg-cream transition-colors border border-gold/30"
          >
            <Disc3 className="w-6 h-6 mx-auto mb-1 text-gold" />
            Wheel
          </Link>
          <Link
            to="/stats"
            className="bg-white text-navy rounded-xl p-4 text-center font-semibold text-sm shadow-md hover:bg-cream transition-colors border border-cream-dark"
          >
            <Users className="w-6 h-6 mx-auto mb-1 text-navy" />
            Player Stats
          </Link>
          <Link
            to="/projections"
            className="bg-white text-navy rounded-xl p-4 text-center font-semibold text-sm shadow-md hover:bg-cream transition-colors border border-cream-dark"
          >
            <Calculator className="w-6 h-6 mx-auto mb-1 text-navy" />
            What-If
          </Link>
        </div>
      </section>
    </div>
  );
}

function computeProjection(event: SacEvent) {
  let mwConfirmed = 0, mwProjected = 0;
  let ceConfirmed = 0, ceProjected = 0;

  for (const round of event.rounds) {
    if (round.status === 'complete') {
      const rs = getRoundStandings(round);
      mwConfirmed += rs.team1Points;
      ceConfirmed += rs.team2Points;
    } else if (round.status === 'live') {
      let roundClaimed = 0;
      for (const match of round.matches) {
        const result = calculateMatchResult(match);
        if (match.status === 'complete') {
          mwConfirmed += result.team1TotalPoints;
          ceConfirmed += result.team2TotalPoints;
          roundClaimed += result.team1TotalPoints + result.team2TotalPoints;
        } else if (match.status === 'live') {
          mwProjected += result.team1TotalPoints;
          ceProjected += result.team2TotalPoints;
          roundClaimed += result.team1TotalPoints + result.team2TotalPoints;
          if (round.format !== 'scramble') {
            const claimed = result.team1TotalPoints + result.team2TotalPoints;
            const remaining = 3 - claimed;
            if (remaining > 0) {
              const mwWins = result.overall.team1Wins;
              const ceWins = result.overall.team2Wins;
              if (mwWins > ceWins) { mwProjected += remaining; }
              else if (ceWins > mwWins) { ceProjected += remaining; }
              else { mwProjected += remaining / 2; ceProjected += remaining / 2; }
              roundClaimed += remaining;
            }
          }
        }
      }
      const roundRemaining = round.totalPoints - roundClaimed;
      if (roundRemaining > 0) {
        mwProjected += roundRemaining / 2;
        ceProjected += roundRemaining / 2;
      }
    } else {
      mwProjected += round.totalPoints / 2;
      ceProjected += round.totalPoints / 2;
    }
  }

  return { mwConfirmed, mwProjected, ceConfirmed, ceProjected };
}

function ProjectionBar({ event }: { event: SacEvent }) {
  const { mwConfirmed, mwProjected, ceConfirmed, ceProjected } = computeProjection(event);
  const total = event.totalPoints;
  const target = event.pointsToWin;

  const mwTotal = mwConfirmed + mwProjected;
  const ceTotal = ceConfirmed + ceProjected;

  const mwConfPct = (mwConfirmed / total) * 100;
  const mwProjPct = (mwProjected / total) * 100;
  const ceProjPct = (ceProjected / total) * 100;
  const ceConfPct = (ceConfirmed / total) * 100;
  const gapPct = Math.max(0, 100 - mwConfPct - mwProjPct - ceProjPct - ceConfPct);
  const targetPct = (target / total) * 100;

  const mwWinning = mwTotal > ceTotal;
  const ceWinning = ceTotal > mwTotal;
  const mwPastTarget = mwTotal >= target;
  const cePastTarget = ceTotal >= target;

  return (
    <section className="px-4 mt-4 max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] text-center tracking-[3px] uppercase text-sac-text-light font-semibold">
            Projection
          </p>
        </div>

        <div className="px-4 pb-1">
          <div className="flex justify-between items-end mb-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className={`font-display font-black text-2xl ${mwWinning ? 'text-usa' : 'text-usa/60'}`}>
                {mwTotal % 1 === 0 ? mwTotal : mwTotal.toFixed(1)}
              </span>
              <span className="text-[10px] text-usa/50 font-semibold uppercase tracking-wider">
                {TEAM_CONFIG['morning-woods'].shortName}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-euro/50 font-semibold uppercase tracking-wider">
                {TEAM_CONFIG['chip-endels'].shortName}
              </span>
              <span className={`font-display font-black text-2xl ${ceWinning ? 'text-euro' : 'text-euro/60'}`}>
                {ceTotal % 1 === 0 ? ceTotal : ceTotal.toFixed(1)}
              </span>
            </div>
          </div>

          {/* The bar */}
          <div className="relative h-7 rounded-full overflow-hidden flex bg-cream-dark/50">
            {mwConfPct > 0 && (
              <div
                className="bg-usa h-full transition-all duration-700 ease-out"
                style={{ width: `${mwConfPct}%` }}
              />
            )}
            {mwProjPct > 0 && (
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{
                  width: `${mwProjPct}%`,
                  background: 'repeating-linear-gradient(135deg, rgba(178,34,52,0.35), rgba(178,34,52,0.35) 3px, rgba(178,34,52,0.2) 3px, rgba(178,34,52,0.2) 6px)',
                }}
              />
            )}
            {gapPct > 0 && (
              <div className="h-full flex-shrink-0" style={{ width: `${gapPct}%` }} />
            )}
            {ceProjPct > 0 && (
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{
                  width: `${ceProjPct}%`,
                  background: 'repeating-linear-gradient(135deg, rgba(0,51,153,0.35), rgba(0,51,153,0.35) 3px, rgba(0,51,153,0.2) 3px, rgba(0,51,153,0.2) 6px)',
                }}
              />
            )}
            {ceConfPct > 0 && (
              <div
                className="bg-euro h-full transition-all duration-700 ease-out"
                style={{ width: `${ceConfPct}%` }}
              />
            )}

            {/* Target marker */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-gold z-10"
              style={{ left: `${targetPct}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-gold font-bold whitespace-nowrap">
                {target}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-between items-center mt-5 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-usa" />
                <span className="text-[9px] text-sac-text-light">Won</span>
              </div>
              {(mwProjected > 0 || ceProjected > 0) && (
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ background: 'repeating-linear-gradient(135deg, rgba(178,34,52,0.35), rgba(178,34,52,0.35) 2px, rgba(178,34,52,0.2) 2px, rgba(178,34,52,0.2) 4px)' }}
                  />
                  <span className="text-[9px] text-sac-text-light">Projected</span>
                </div>
              )}
            </div>
            <span className="text-[9px] text-sac-text-light">
              {mwPastTarget ? `${TEAM_CONFIG['morning-woods'].shortName} wins!` :
               cePastTarget ? `${TEAM_CONFIG['chip-endels'].shortName} wins!` :
               `${target} to win`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PenLine(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
    </svg>
  );
}
