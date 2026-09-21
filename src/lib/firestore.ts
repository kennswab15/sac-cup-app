import {
  collection, doc, updateDoc, onSnapshot,
  query, orderBy, addDoc, serverTimestamp, writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { SacEvent, Round, Match, Player, HoleScore, ChatMessage } from './types';
import { calculateMatchResult } from './scoring';

// ── Matches (flat collection — one doc per match) ────────────────────

export function subscribeToMatches(
  eventId: string,
  onUpdate: (matches: Match[]) => void,
): Unsubscribe {
  if (!db) return () => {};
  const q = query(collection(db, 'matches'), orderBy('groupNumber'));
  return onSnapshot(q, snap => {
    const matches: Match[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.eventId !== eventId) return;
      const match: Match = {
        id: d.id,
        roundId: data.roundId,
        groupNumber: data.groupNumber,
        teeTime: data.teeTime ?? undefined,
        startingHole: data.startingHole ?? undefined,
        format: data.format,
        team1: data.team1,
        team2: data.team2,
        holes: data.holes ?? [],
        status: data.status ?? 'upcoming',
        result: null,
        ...(data.manualResult ? { manualResult: data.manualResult } : {}),
      };
      match.result = calculateMatchResult(match);
      matches.push(match);
    });
    onUpdate(matches);
  });
}

export async function updateHoleScoreInFirestore(
  matchId: string,
  holes: HoleScore[],
): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, { holes });
}

export async function updateMatchStatusInFirestore(
  matchId: string,
  status: Match['status'],
): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, { status });
}

export async function updateManualResult(
  matchId: string,
  team1Points: number,
  team2Points: number,
): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, { manualResult: { team1Points, team2Points }, status: 'complete' });
}

export async function updateRoundStatus(
  roundId: string,
  status: string,
): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'rounds', roundId);
  await updateDoc(ref, { status });
}

// ── Event metadata ───────────────────────────────────────────────────

export function subscribeToEvent(
  eventId: string,
  onUpdate: (event: Omit<SacEvent, 'rounds'> | null) => void,
): Unsubscribe {
  if (!db) return () => {};
  const ref = doc(db, 'events', eventId);
  return onSnapshot(ref, snap => {
    if (!snap.exists()) { onUpdate(null); return; }
    const d = snap.data();
    onUpdate({
      id: snap.id,
      name: d.name,
      year: d.year,
      venue: d.venue,
      dates: d.dates,
      status: d.status,
      totalPoints: d.totalPoints,
      pointsToWin: d.pointsToWin,
      teams: d.teams,
    });
  });
}

// ── Rounds ───────────────────────────────────────────────────────────

export function subscribeToRounds(
  eventId: string,
  onUpdate: (rounds: Omit<Round, 'matches'>[]) => void,
): Unsubscribe {
  if (!db) return () => {};
  const q = query(collection(db, 'rounds'), orderBy('sortOrder'));
  return onSnapshot(q, snap => {
    const rounds: Omit<Round, 'matches'>[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.eventId !== eventId) return;
      rounds.push({
        id: d.id,
        eventId: data.eventId,
        name: data.name,
        format: data.format,
        date: data.date,
        session: data.session,
        totalPoints: data.totalPoints,
        status: data.status,
        ...(data.manualTeam1Points != null ? { manualTeam1Points: data.manualTeam1Points } : {}),
        ...(data.manualTeam2Points != null ? { manualTeam2Points: data.manualTeam2Points } : {}),
      });
    });
    onUpdate(rounds);
  });
}

// ── Players ──────────────────────────────────────────────────────────

export function subscribeToPlayers(
  onUpdate: (players: Player[]) => void,
): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(collection(db, 'players'), snap => {
    const players: Player[] = [];
    snap.forEach(d => {
      const data = d.data();
      players.push({ id: d.id, name: data.name, handicap: data.handicap, team: data.team, pin: data.pin, email: data.email });
    });
    onUpdate(players);
  });
}

export async function updatePlayerHandicap(
  playerId: string,
  handicap: number,
): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'players', playerId);
  await updateDoc(ref, { handicap });
}

export async function updatePlayerPin(
  playerId: string,
  pin: string,
): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'players', playerId);
  await updateDoc(ref, { pin });
}

// ── Chat ─────────────────────────────────────────────────────────────

export function subscribeToChat(
  eventId: string,
  onUpdate: (messages: ChatMessage[]) => void,
): Unsubscribe {
  if (!db) return () => {};
  const q = query(collection(db, 'chat'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, snap => {
    const msgs: ChatMessage[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.eventId !== eventId) return;
      msgs.push({
        id: d.id,
        eventId: data.eventId,
        userId: data.userId,
        userName: data.userName,
        userTeam: data.userTeam,
        text: data.text,
        timestamp: data.timestamp?.toMillis?.() ?? data.timestamp ?? Date.now(),
      });
    });
    onUpdate(msgs);
  });
}

export async function sendChatMessage(
  msg: Omit<ChatMessage, 'id' | 'timestamp'>,
): Promise<void> {
  if (!db) return;
  await addDoc(collection(db, 'chat'), {
    ...msg,
    timestamp: serverTimestamp(),
  });
}

// ── Seed: write demo data to Firestore ───────────────────────────────

export async function seedEventData(
  event: SacEvent,
  players: Player[],
): Promise<void> {
  if (!db) throw new Error('Firebase not configured');
  const firestore = db;

  const batch = writeBatch(firestore);

  // Event doc (without rounds/matches)
  batch.set(doc(firestore, 'events', event.id), {
    name: event.name,
    year: event.year,
    venue: event.venue,
    dates: event.dates,
    status: event.status,
    totalPoints: event.totalPoints,
    pointsToWin: event.pointsToWin,
    teams: event.teams,
  });

  // Rounds
  event.rounds.forEach((round, i) => {
    batch.set(doc(firestore, 'rounds', round.id), {
      eventId: event.id,
      name: round.name,
      format: round.format,
      date: round.date,
      session: round.session,
      totalPoints: round.totalPoints,
      status: round.status,
      sortOrder: i,
      ...(round.manualTeam1Points != null ? { manualTeam1Points: round.manualTeam1Points } : {}),
      ...(round.manualTeam2Points != null ? { manualTeam2Points: round.manualTeam2Points } : {}),
    });

    // Matches within this round
    round.matches.forEach(match => {
      batch.set(doc(firestore, 'matches', match.id), {
        eventId: event.id,
        roundId: round.id,
        groupNumber: match.groupNumber,
        teeTime: match.teeTime ?? null,
        startingHole: match.startingHole ?? null,
        format: match.format,
        team1: match.team1,
        team2: match.team2,
        holes: match.holes,
        status: match.status,
        ...(match.manualResult ? { manualResult: match.manualResult } : {}),
      });
    });
  });

  // Players
  players.forEach(p => {
    batch.set(doc(firestore, 'players', p.id), {
      name: p.name,
      handicap: p.handicap,
      team: p.team,
      pin: p.pin ?? null,
      email: p.email ?? null,
    });
  });

  await batch.commit();
}
