export type TeamId = 'morning-woods' | 'chip-endels';
export type MatchFormat = 'scramble' | 'four-ball' | 'shamble' | 'singles';
export type EventStatus = 'upcoming' | 'live' | 'complete';
export type MatchStatus = 'upcoming' | 'live' | 'complete';

export const CHAIRMAN_PLAYER_ID = 'mw-4';

export interface Player {
  id: string;
  name: string;
  handicap: number;
  team: TeamId;
  pin?: string;
  email?: string;
  avatar?: string;
}

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  color: string;
  playerIds: string[];
}

export interface SacEvent {
  id: string;
  name: string;
  year: number;
  venue: string;
  dates: string[];
  status: EventStatus;
  totalPoints: number;
  pointsToWin: number;
  teams: Record<TeamId, Team>;
  rounds: Round[];
}

export interface Round {
  id: string;
  eventId: string;
  name: string;
  format: MatchFormat;
  date: string;
  session: 'am' | 'pm';
  totalPoints: number;
  matches: Match[];
  status: MatchStatus;
  manualTeam1Points?: number;
  manualTeam2Points?: number;
}

export interface Match {
  id: string;
  roundId: string;
  groupNumber: number;
  teeTime?: string;
  startingHole?: number;
  format: MatchFormat;
  team1: MatchSide;
  team2: MatchSide;
  holes: HoleScore[];
  status: MatchStatus;
  result: MatchResult | null;
  manualResult?: { team1Points: number; team2Points: number };
}

export interface MatchSide {
  teamId: TeamId;
  playerIds: string[];
}

export interface HoleScore {
  hole: number;
  par: number;
  yardage: number;
  team1Score: number | null;
  team2Score: number | null;
  playerScores?: Record<string, number | null>;
}

export interface SegmentResult {
  team1Wins: number;
  team2Wins: number;
  halved: number;
  winner: 'team1' | 'team2' | 'halved';
  team1Points: number;
  team2Points: number;
}

export interface MatchResult {
  front9: SegmentResult;
  back9: SegmentResult;
  overall: SegmentResult;
  team1TotalPoints: number;
  team2TotalPoints: number;
  holesPlayed: number;
  matchStatusText: string;
}

export interface TeamStanding {
  teamId: TeamId;
  teamName: string;
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesHalved: number;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userTeam: TeamId;
  text: string;
  timestamp: number;
}

export interface RoundStandings {
  round: Round;
  team1Points: number;
  team2Points: number;
}

export const FORMAT_LABELS: Record<MatchFormat, string> = {
  'scramble': 'Scramble',
  'four-ball': 'Four-Ball',
  'shamble': 'Shamble',
  'singles': 'Singles',
};

export const TEAM_CONFIG: Record<TeamId, { name: string; shortName: string; color: string; bgClass: string; textClass: string }> = {
  'morning-woods': {
    name: 'The Morning Woods',
    shortName: 'MW',
    color: '#B22234',
    bgClass: 'bg-usa',
    textClass: 'text-usa',
  },
  'chip-endels': {
    name: 'Chip-Endels',
    shortName: 'CE',
    color: '#003399',
    bgClass: 'bg-euro',
    textClass: 'text-euro',
  },
};
