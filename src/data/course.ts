export interface TeeSet {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  par: number;
  totalYards: number;
  courseRating: number;
  slopeRating: number;
  holeYardages: number[];
  holePars: number[];
}

export const HOLE_HCP_INDEX = [13, 17, 9, 5, 1, 7, 15, 3, 11, 4, 12, 14, 16, 10, 6, 2, 18, 8];

export const TEE_SETS: TeeSet[] = [
  {
    id: 'black',
    name: 'Tee 1',
    color: 'Black',
    colorHex: '#1a1a1a',
    par: 71,
    totalYards: 6820,
    courseRating: 74.5,
    slopeRating: 144,
    holeYardages: [309, 179, 477, 431, 470, 528, 221, 383, 183, 378, 528, 173, 411, 426, 508, 601, 152, 462],
    holePars: [4, 3, 4, 4, 4, 5, 3, 4, 3, 4, 5, 3, 4, 4, 5, 5, 3, 4],
  },
  {
    id: 'black-gold',
    name: 'Tee 1 & 2',
    color: 'Black/Gold',
    colorHex: '#8B7500',
    par: 71,
    totalYards: 6461,
    courseRating: 72.3,
    slopeRating: 140,
    holeYardages: [309, 179, 436, 431, 410, 528, 175, 352, 183, 343, 528, 173, 381, 383, 508, 561, 152, 429],
    holePars: [4, 3, 4, 4, 4, 5, 3, 4, 3, 4, 5, 3, 4, 4, 5, 5, 3, 4],
  },
  {
    id: 'blue',
    name: 'Tee 2',
    color: 'Blue',
    colorHex: '#1a3a6b',
    par: 71,
    totalYards: 6209,
    courseRating: 71.3,
    slopeRating: 133,
    holeYardages: [282, 150, 436, 387, 410, 516, 175, 352, 158, 343, 467, 162, 381, 383, 482, 561, 135, 429],
    holePars: [4, 3, 4, 4, 4, 5, 3, 4, 3, 4, 5, 3, 4, 4, 5, 5, 3, 4],
  },
  {
    id: 'blue-green',
    name: 'Tee 2 & 3',
    color: 'Blue/Green',
    colorHex: '#6b8e6b',
    par: 71,
    totalYards: 5845,
    courseRating: 69.3,
    slopeRating: 129,
    holeYardages: [282, 150, 390, 387, 389, 516, 151, 300, 158, 343, 467, 162, 323, 334, 482, 516, 135, 360],
    holePars: [4, 3, 4, 4, 4, 5, 3, 4, 3, 4, 5, 3, 4, 4, 5, 5, 3, 4],
  },
  {
    id: 'green',
    name: 'Tee 3',
    color: 'Green',
    colorHex: '#2d7a2d',
    par: 71,
    totalYards: 5527,
    courseRating: 68.0,
    slopeRating: 123,
    holeYardages: [257, 143, 390, 361, 389, 442, 151, 300, 137, 313, 410, 136, 323, 334, 454, 516, 111, 360],
    holePars: [4, 3, 4, 4, 4, 5, 3, 4, 3, 4, 5, 3, 4, 4, 5, 5, 3, 4],
  },
  {
    id: 'red',
    name: 'Tee 4',
    color: 'Red',
    colorHex: '#c42020',
    par: 70,
    totalYards: 4170,
    courseRating: 62.1,
    slopeRating: 98,
    holeYardages: [182, 73, 253, 294, 246, 374, 128, 201, 108, 301, 333, 99, 225, 238, 371, 437, 92, 215],
    holePars: [4, 3, 4, 4, 4, 5, 3, 4, 3, 4, 4, 3, 4, 4, 5, 5, 3, 4],
  },
];

export function getCourseHandicap(handicapIndex: number, tee: TeeSet): number {
  return Math.round(handicapIndex * (tee.slopeRating / 113) + (tee.courseRating - tee.par));
}

export function getStrokeHoles(courseHandicap: number): Map<number, number> {
  const dots = new Map<number, number>();
  if (courseHandicap === 0) return dots;

  if (courseHandicap < 0) {
    // Plus handicapper: give-back strokes on the EASIEST holes (highest HCP index)
    const absHcp = Math.abs(courseHandicap);
    const fullRounds = Math.floor(absHcp / 18);
    const remainder = absHcp % 18;

    for (let hole = 1; hole <= 18; hole++) {
      const hcpIdx = HOLE_HCP_INDEX[hole - 1];
      let strokes = fullRounds;
      if (hcpIdx > 18 - remainder) strokes++;
      if (strokes > 0) dots.set(hole, -strokes);
    }
    return dots;
  }

  const fullRounds = Math.floor(courseHandicap / 18);
  const remainder = courseHandicap % 18;

  for (let hole = 1; hole <= 18; hole++) {
    const hcpIdx = HOLE_HCP_INDEX[hole - 1];
    let strokes = fullRounds;
    if (hcpIdx <= remainder) strokes++;
    if (strokes > 0) dots.set(hole, strokes);
  }
  return dots;
}

export function getDefaultTee(): TeeSet {
  return TEE_SETS.find(t => t.id === 'blue')!;
}
