import type { Player, SacEvent, HoleScore } from '@/lib/types';

const SOLINA_HOLES: Omit<HoleScore, 'team1Score' | 'team2Score'>[] = [
  { hole: 1, par: 4, yardage: 309 },
  { hole: 2, par: 3, yardage: 179 },
  { hole: 3, par: 4, yardage: 477 },
  { hole: 4, par: 4, yardage: 431 },
  { hole: 5, par: 4, yardage: 470 },
  { hole: 6, par: 5, yardage: 528 },
  { hole: 7, par: 3, yardage: 221 },
  { hole: 8, par: 4, yardage: 383 },
  { hole: 9, par: 3, yardage: 183 },
  { hole: 10, par: 4, yardage: 378 },
  { hole: 11, par: 5, yardage: 528 },
  { hole: 12, par: 3, yardage: 173 },
  { hole: 13, par: 4, yardage: 411 },
  { hole: 14, par: 4, yardage: 426 },
  { hole: 15, par: 5, yardage: 508 },
  { hole: 16, par: 5, yardage: 601 },
  { hole: 17, par: 3, yardage: 152 },
  { hole: 18, par: 4, yardage: 462 },
];

export function makeEmptyHoles(): HoleScore[] {
  return SOLINA_HOLES.map(h => ({ ...h, team1Score: null, team2Score: null }));
}

function makeFilledHoles(t1: number[], t2: number[]): HoleScore[] {
  return SOLINA_HOLES.map((h, i) => ({ ...h, team1Score: t1[i], team2Score: t2[i] }));
}

export const DEMO_PLAYERS: Player[] = [
  // Morning Woods
  { id: 'mw-1', name: 'Brian Muffly', handicap: 24, team: 'morning-woods', pin: '2418' },
  { id: 'mw-2', name: 'Chad Kuchem', handicap: 20, team: 'morning-woods', pin: '3021' },
  { id: 'mw-3', name: 'Jonathan McMann', handicap: 27, team: 'morning-woods', pin: '4532' },
  { id: 'mw-4', name: 'Kenny Swab', handicap: 3, team: 'morning-woods', pin: '1186' },
  { id: 'mw-5', name: 'Michael Strickland', handicap: 25, team: 'morning-woods', pin: '5614' },
  { id: 'mw-6', name: 'Mickey Loreti', handicap: 11, team: 'morning-woods', pin: '7723' },
  { id: 'mw-7', name: 'Nick Perkins', handicap: 19, team: 'morning-woods', pin: '6347' },
  { id: 'mw-8', name: 'Rob Randolph', handicap: 22, team: 'morning-woods', pin: '8156' },
  { id: 'mw-9', name: 'Robert Moore', handicap: 16, team: 'morning-woods', pin: '9204' },
  { id: 'mw-10', name: 'Sean McIlroy', handicap: 8, team: 'morning-woods', pin: '4071' },
  { id: 'mw-11', name: 'Scott Buckhout', handicap: 7, team: 'morning-woods', pin: '3589' },
  { id: 'mw-12', name: 'Stuart Taylor', handicap: 21, team: 'morning-woods', pin: '6832' },
  // Chip-Endels
  { id: 'ce-1', name: 'Austin Holland', handicap: 18, team: 'chip-endels', pin: '1947' },
  { id: 'ce-2', name: 'Caley Kropp', handicap: 20, team: 'chip-endels', pin: '2583' },
  { id: 'ce-3', name: 'Chris Donahoe', handicap: 25, team: 'chip-endels', pin: '7491' },
  { id: 'ce-4', name: 'Chris Mills', handicap: 17, team: 'chip-endels', pin: '8265' },
  { id: 'ce-5', name: 'Dan Liberto', handicap: 16, team: 'chip-endels', pin: '3176' },
  { id: 'ce-6', name: 'Endel Liias', handicap: 0, team: 'chip-endels', pin: '5042' },
  { id: 'ce-7', name: 'George George', handicap: 19, team: 'chip-endels', pin: '9318' },
  { id: 'ce-8', name: 'Ian Clark', handicap: 9, team: 'chip-endels', pin: '4629' },
  { id: 'ce-9', name: 'Irby Thompson', handicap: 25, team: 'chip-endels', pin: '1753' },
  { id: 'ce-10', name: 'Jeremy Mattson', handicap: 15, team: 'chip-endels', pin: '8904' },
  { id: 'ce-11', name: 'RJ Holroyd', handicap: 17, team: 'chip-endels', pin: '6271' },
  { id: 'ce-12', name: 'Sam Kerr', handicap: 7, team: 'chip-endels', pin: '5438' },
];

export const DEMO_EVENT: SacEvent = {
  id: 'sac-2026',
  name: 'The SAC Cup 2026',
  year: 2026,
  venue: 'Solina Golf Club',
  dates: ['2026-09-17', '2026-09-18', '2026-09-19'],
  status: 'live',
  totalPoints: 100,
  pointsToWin: 50.5,
  teams: {
    'morning-woods': {
      id: 'morning-woods',
      name: 'The Morning Woods',
      shortName: 'MW',
      color: '#0a1628',
      playerIds: DEMO_PLAYERS.filter(p => p.team === 'morning-woods').map(p => p.id),
    },
    'chip-endels': {
      id: 'chip-endels',
      name: 'Chip-Endels',
      shortName: 'CE',
      color: '#6b2d3e',
      playerIds: DEMO_PLAYERS.filter(p => p.team === 'chip-endels').map(p => p.id),
    },
  },
  rounds: [
    // Friday AM — Scramble (Stroke Play, 28 pts)
    // Positional scoring: 1st=7, 2nd=5, 3rd=4, 4th=3, 5th=2, 6th-12th=1
    // Ordered by total score; ties broken by Last 9, Last 6, Last 3, Last 1
    // MW 15 — CE 13
    {
      id: 'r1',
      eventId: 'sac-2026',
      name: 'Friday AM',
      format: 'scramble',
      date: '2026-09-18',
      session: 'am',
      totalPoints: 28,
      manualTeam1Points: 15,
      manualTeam2Points: 13,
      status: 'complete' as const,
      matches: [
        // 1st (61, B31): Kuchem/Randolph 7pts | 2nd (61, B32): Liias/George 5pts
        { id: 'r1-m1', roundId: 'r1', groupNumber: 1, teeTime: '8:00 AM', format: 'scramble' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-2', 'mw-8'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-6', 'ce-7'] }, holes: makeFilledHoles([4,3,4,3,2,4,3,4,3,4,6,2,4,3,4,3,2,3], [4,3,3,4,4,2,4,2,3,4,4,3,4,4,4,3,2,4]), status: 'complete' as const, result: null, manualResult: { team1Points: 7, team2Points: 5 } },
        // 3rd (61, B33): Kerr/Thompson 4pts | 4th (63, B32): Swab/Strickland 3pts
        { id: 'r1-m2', roundId: 'r1', groupNumber: 2, teeTime: '8:00 AM', format: 'scramble' as const, team1: { teamId: 'chip-endels' as const, playerIds: ['ce-12', 'ce-9'] }, team2: { teamId: 'morning-woods' as const, playerIds: ['mw-4', 'mw-5'] }, holes: makeFilledHoles([4,3,4,2,2,4,3,3,3,3,5,3,4,4,4,4,2,4], [3,4,4,4,3,4,3,3,3,4,4,3,3,3,4,4,3,4]), status: 'complete' as const, result: null, manualResult: { team1Points: 4, team2Points: 3 } },
        // 5th (63, B33): McIlroy/McMann 2pts | 6th (64): Liberto/Kropp 1pt
        { id: 'r1-m3', roundId: 'r1', groupNumber: 3, teeTime: '8:00 AM', format: 'scramble' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-10', 'mw-3'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-5', 'ce-2'] }, holes: makeFilledHoles([4,3,5,3,3,4,2,3,3,3,4,4,4,5,2,4,3,4], [4,3,5,3,3,4,3,3,3,3,6,3,4,4,3,3,3,4]), status: 'complete' as const, result: null, manualResult: { team1Points: 2, team2Points: 1 } },
        // 7th (66, B33): Clark/Donahoe 1pt | 8th (66, B34): Mattson/Holland 1pt
        { id: 'r1-m4', roundId: 'r1', groupNumber: 4, teeTime: '8:00 AM', format: 'scramble' as const, team1: { teamId: 'chip-endels' as const, playerIds: ['ce-8', 'ce-3'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-10', 'ce-1'] }, holes: makeFilledHoles([4,3,5,3,4,5,2,4,3,3,5,3,4,4,3,4,4,3], [5,3,6,3,3,3,3,3,3,2,5,4,4,4,5,4,3,3]), status: 'complete' as const, result: null, manualResult: { team1Points: 1, team2Points: 1 } },
        // 9th (67): Moore/Perkins 1pt | 10th (68): Buckhout/Muffly 1pt
        { id: 'r1-m5', roundId: 'r1', groupNumber: 5, teeTime: '8:00 AM', format: 'scramble' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-9', 'mw-7'] }, team2: { teamId: 'morning-woods' as const, playerIds: ['mw-11', 'mw-1'] }, holes: makeFilledHoles([4,3,4,3,4,4,2,4,3,3,6,3,5,5,4,4,3,3], [4,4,4,3,4,4,3,3,3,4,4,4,4,4,4,5,4,3]), status: 'complete' as const, result: null, manualResult: { team1Points: 1, team2Points: 1 } },
        // 11th (69, B34): Mills/Holroyd 1pt | 12th (69, B36): Loreti/Taylor 1pt
        { id: 'r1-m6', roundId: 'r1', groupNumber: 6, teeTime: '8:00 AM', format: 'scramble' as const, team1: { teamId: 'chip-endels' as const, playerIds: ['ce-4', 'ce-11'] }, team2: { teamId: 'morning-woods' as const, playerIds: ['mw-6', 'mw-12'] }, holes: makeFilledHoles([5,2,5,4,3,5,3,4,4,3,5,4,3,5,3,5,3,3], [5,3,5,3,3,5,3,3,3,4,5,4,4,4,4,4,3,4]), status: 'complete' as const, result: null, manualResult: { team1Points: 1, team2Points: 1 } },
      ],
    },
    // Friday PM — Four-Ball (Match Play, 18 pts)
    {
      id: 'r2',
      eventId: 'sac-2026',
      name: 'Friday PM',
      format: 'four-ball',
      date: '2026-09-18',
      session: 'pm',
      totalPoints: 18,
      manualTeam1Points: 6,
      manualTeam2Points: 12,
      status: 'complete' as const,
      matches: [
        { id: 'r2-m1', roundId: 'r2', groupNumber: 1, teeTime: '1:00 PM', format: 'four-ball' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-1', 'mw-3'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-8', 'ce-7'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0, team2Points: 3 } },
        { id: 'r2-m2', roundId: 'r2', groupNumber: 2, teeTime: '1:10 PM', format: 'four-ball' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-11', 'mw-2'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-5', 'ce-4'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 1.5, team2Points: 1.5 } },
        { id: 'r2-m3', roundId: 'r2', groupNumber: 3, teeTime: '1:20 PM', format: 'four-ball' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-8', 'mw-6'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-6', 'ce-3'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0.5, team2Points: 2.5 } },
        { id: 'r2-m4', roundId: 'r2', groupNumber: 4, teeTime: '1:30 PM', format: 'four-ball' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-10', 'mw-7'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-2', 'ce-12'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 1, team2Points: 2 } },
        { id: 'r2-m5', roundId: 'r2', groupNumber: 5, teeTime: '1:40 PM', format: 'four-ball' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-5', 'mw-12'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-1', 'ce-9'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0, team2Points: 3 } },
        { id: 'r2-m6', roundId: 'r2', groupNumber: 6, teeTime: '1:50 PM', format: 'four-ball' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-4', 'mw-9'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-10', 'ce-11'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 3, team2Points: 0 } },
      ],
    },
    // Saturday AM — Shamble (Match Play, 18 pts) — RESULTS FROM SPREADSHEET
    {
      id: 'r3',
      eventId: 'sac-2026',
      name: 'Saturday AM',
      format: 'shamble',
      date: '2026-09-19',
      session: 'am',
      totalPoints: 18,
      status: 'complete' as const,
      matches: [
        { id: 'r3-m1', roundId: 'r3', groupNumber: 1, teeTime: '8:00 AM', startingHole: 1, format: 'shamble' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-11', 'mw-9'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-6', 'ce-5'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0, team2Points: 3 } },
        { id: 'r3-m2', roundId: 'r3', groupNumber: 2, teeTime: '8:00 AM', startingHole: 4, format: 'shamble' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-10', 'mw-12'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-8', 'ce-10'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 2.5, team2Points: 0.5 } },
        { id: 'r3-m3', roundId: 'r3', groupNumber: 3, teeTime: '8:00 AM', startingHole: 7, format: 'shamble' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-6', 'mw-3'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-12', 'ce-11'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0, team2Points: 3 } },
        { id: 'r3-m4', roundId: 'r3', groupNumber: 4, teeTime: '8:00 AM', startingHole: 10, format: 'shamble' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-4', 'mw-2'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-4', 'ce-3'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 3, team2Points: 0 } },
        { id: 'r3-m5', roundId: 'r3', groupNumber: 5, teeTime: '8:00 AM', startingHole: 13, format: 'shamble' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-8', 'mw-5'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-7', 'ce-9'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 2, team2Points: 1 } },
        { id: 'r3-m6', roundId: 'r3', groupNumber: 6, teeTime: '8:00 AM', startingHole: 16, format: 'shamble' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-7', 'mw-1'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-1', 'ce-2'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0.5, team2Points: 2.5 } },
      ],
    },
    // Saturday PM — Singles (Match Play, 36 pts) — 2 matches still live
    {
      id: 'r4',
      eventId: 'sac-2026',
      name: 'Saturday PM',
      format: 'singles',
      date: '2026-09-19',
      session: 'pm',
      totalPoints: 36,
      status: 'complete' as const,
      matches: [
        // Group 1
        { id: 'r4-m1', roundId: 'r4', groupNumber: 1, teeTime: '12:30 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-3'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-3'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 2.5, team2Points: 0.5 } },
        { id: 'r4-m2', roundId: 'r4', groupNumber: 2, teeTime: '12:40 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-7'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-4'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 3, team2Points: 0 } },
        { id: 'r4-m3', roundId: 'r4', groupNumber: 3, teeTime: '12:50 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-5'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-6'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0.5, team2Points: 2.5 } },
        { id: 'r4-m4', roundId: 'r4', groupNumber: 4, teeTime: '1:00 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-11'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-12'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0, team2Points: 3 } },
        { id: 'r4-m5', roundId: 'r4', groupNumber: 5, teeTime: '1:10 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-6'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-10'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 3, team2Points: 0 } },
        { id: 'r4-m6', roundId: 'r4', groupNumber: 6, teeTime: '1:20 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-9'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-1'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0.5, team2Points: 2.5 } },
        // Group 2
        { id: 'r4-m7', roundId: 'r4', groupNumber: 7, teeTime: '1:30 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-1'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-2'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0, team2Points: 3 } },
        { id: 'r4-m8', roundId: 'r4', groupNumber: 8, teeTime: '1:40 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-12'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-7'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0, team2Points: 3 } },
        { id: 'r4-m9', roundId: 'r4', groupNumber: 9, teeTime: '1:50 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-4'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-9'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 3, team2Points: 0 } },
        { id: 'r4-m10', roundId: 'r4', groupNumber: 10, teeTime: '2:00 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-10'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-8'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 3, team2Points: 0 } },
        { id: 'r4-m11', roundId: 'r4', groupNumber: 11, teeTime: '2:10 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-8'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-5'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 1, team2Points: 2 } },
        { id: 'r4-m12', roundId: 'r4', groupNumber: 12, teeTime: '2:20 PM', format: 'singles' as const, team1: { teamId: 'morning-woods' as const, playerIds: ['mw-2'] }, team2: { teamId: 'chip-endels' as const, playerIds: ['ce-11'] }, holes: makeEmptyHoles(), status: 'complete' as const, result: null, manualResult: { team1Points: 0, team2Points: 3 } },
      ],
    },
  ],
};
