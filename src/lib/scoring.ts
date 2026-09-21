import type { HoleScore, Match, MatchResult, SegmentResult, Round, TeamId, RoundStandings } from './types';

function computeSegment(holes: HoleScore[]): SegmentResult {
  let team1Wins = 0;
  let team2Wins = 0;
  let halved = 0;

  for (const hole of holes) {
    if (hole.team1Score == null || hole.team2Score == null) continue;
    if (hole.team1Score < hole.team2Score) team1Wins++;
    else if (hole.team2Score < hole.team1Score) team2Wins++;
    else halved++;
  }

  const played = team1Wins + team2Wins + halved;

  let winner: SegmentResult['winner'];
  let team1Points: number;
  let team2Points: number;

  if (played === 0) {
    winner = 'halved';
    team1Points = 0;
    team2Points = 0;
  } else if (team1Wins > team2Wins) {
    winner = 'team1';
    team1Points = 1;
    team2Points = 0;
  } else if (team2Wins > team1Wins) {
    winner = 'team2';
    team1Points = 0;
    team2Points = 1;
  } else {
    winner = 'halved';
    team1Points = 0.5;
    team2Points = 0.5;
  }

  return { team1Wins, team2Wins, halved, winner, team1Points, team2Points };
}

function buildStatusText(result: MatchResult, team1Short: string, team2Short: string): string {
  const { overall, holesPlayed } = result;
  if (holesPlayed === 0) return 'Not started';
  if (holesPlayed === 18) {
    if (overall.winner === 'halved') return 'All Square';
    const winnerName = overall.winner === 'team1' ? team1Short : team2Short;
    const diff = Math.abs(overall.team1Wins - overall.team2Wins);
    return `${winnerName} wins ${diff} holes up`;
  }
  const diff = overall.team1Wins - overall.team2Wins;
  if (diff === 0) return `AS thru ${holesPlayed}`;
  const leader = diff > 0 ? team1Short : team2Short;
  return `${leader} ${Math.abs(diff)}UP thru ${holesPlayed}`;
}

export function calculateMatchResult(match: Match): MatchResult {
  if (match.manualResult) {
    const { team1Points, team2Points } = match.manualResult;
    const emptySeg: SegmentResult = { team1Wins: 0, team2Wins: 0, halved: 0, winner: 'halved', team1Points: 0, team2Points: 0 };
    const statusText = match.status === 'complete'
      ? team1Points > team2Points ? 'Final' : team2Points > team1Points ? 'Final' : 'Halved'
      : 'In progress';
    return {
      front9: emptySeg,
      back9: emptySeg,
      overall: emptySeg,
      team1TotalPoints: team1Points,
      team2TotalPoints: team2Points,
      holesPlayed: match.status === 'complete' ? 18 : 0,
      matchStatusText: statusText,
    };
  }

  const played = match.holes.filter(h => h.team1Score != null && h.team2Score != null);
  const front9Holes = played.filter(h => h.hole <= 9);
  const back9Holes = played.filter(h => h.hole >= 10);

  const front9 = computeSegment(front9Holes);
  const back9 = computeSegment(back9Holes);
  const overall = computeSegment(played);

  const holesPlayed = played.length;

  const team1Short = match.team1.teamId === 'morning-woods' ? 'MW' : 'CE';
  const team2Short = match.team2.teamId === 'morning-woods' ? 'MW' : 'CE';

  const result: MatchResult = {
    front9,
    back9,
    overall,
    team1TotalPoints: front9.team1Points + back9.team1Points + overall.team1Points,
    team2TotalPoints: front9.team2Points + back9.team2Points + overall.team2Points,
    holesPlayed,
    matchStatusText: '',
  };

  result.matchStatusText = buildStatusText(result, team1Short, team2Short);
  return result;
}

export function resolveTeamScore(hole: HoleScore, match: Match, side: 'team1' | 'team2'): number | null {
  const sideData = match[side];

  if (match.format === 'scramble') {
    return side === 'team1' ? hole.team1Score : hole.team2Score;
  }

  if (match.format === 'singles') {
    return side === 'team1' ? hole.team1Score : hole.team2Score;
  }

  // four-ball and shamble: best individual score from the team
  if (hole.playerScores) {
    const scores = sideData.playerIds
      .map(pid => hole.playerScores?.[pid])
      .filter((s): s is number => s != null);
    if (scores.length === 0) return null;
    return Math.min(...scores);
  }

  return side === 'team1' ? hole.team1Score : hole.team2Score;
}

export function getRoundStandings(round: Round): RoundStandings {
  if (round.manualTeam1Points != null && round.manualTeam2Points != null) {
    return { round, team1Points: round.manualTeam1Points, team2Points: round.manualTeam2Points };
  }

  let team1Points = 0;
  let team2Points = 0;

  for (const match of round.matches) {
    const result = calculateMatchResult(match);
    team1Points += result.team1TotalPoints;
    team2Points += result.team2TotalPoints;
  }

  return { round, team1Points, team2Points };
}

export function getEventStandings(rounds: Round[]): { team1Points: number; team2Points: number; roundStandings: RoundStandings[] } {
  const roundStandings = rounds.map(getRoundStandings);
  const team1Points = roundStandings.reduce((sum, rs) => sum + rs.team1Points, 0);
  const team2Points = roundStandings.reduce((sum, rs) => sum + rs.team2Points, 0);
  return { team1Points, team2Points, roundStandings };
}

export function getHoleWinner(hole: HoleScore): 'team1' | 'team2' | 'halved' | null {
  if (hole.team1Score == null || hole.team2Score == null) return null;
  if (hole.team1Score < hole.team2Score) return 'team1';
  if (hole.team2Score < hole.team1Score) return 'team2';
  return 'halved';
}

export function getMatchThruText(match: Match): string {
  if (match.manualResult) {
    return match.status === 'complete' ? 'Final' : 'In progress';
  }
  const played = match.holes.filter(h => h.team1Score != null && h.team2Score != null).length;
  if (played === 0) return 'Not started';
  if (played === 18) return 'Final';
  return `Thru ${played}`;
}

export function getLeaderTeam(team1Pts: number, team2Pts: number): TeamId | 'tied' {
  if (team1Pts > team2Pts) return 'morning-woods';
  if (team2Pts > team1Pts) return 'chip-endels';
  return 'tied';
}
