/**
 * The six rooms, in chronological order. Index 0 is the earliest and sits at the
 * top-left of the house; index 5 is the present and sits bottom-right. Descending
 * always moves forward in time.
 *
 * `entry` is Tier 2 of the legibility ladder and is capped at 40 words. The cap is
 * enforced by src/lib/house/rooms.test.ts because it is the thing most likely to
 * erode quietly while writing room six.
 */
export interface Room {
  /** URL fragment and DOM id. Stable; the command palette will link to these. */
  readonly id: string;
  /** Chronological position, 0 to 5. Drives grid placement. */
  readonly index: number;
  readonly title: string;
  readonly era: string;
  readonly place: string;
  /** Tier 2 entry text. 40 words maximum. */
  readonly entry: string;
}

export const rooms: readonly Room[] = [
  {
    id: 'bedroom',
    index: 0,
    title: 'The Bedroom',
    era: '2013',
    place: 'Ho Chi Minh City',
    entry:
      'Where this starts. A kid who wanted to know how the games he played were made, ' +
      'taking things apart to find out.',
  },
  {
    id: 'workshop',
    index: 1,
    title: 'The Workshop',
    era: '2021',
    place: 'Ho Chi Minh City',
    entry:
      'Two years on an FRC robotics team writing navigation and sensor code in Python ' +
      'and C++. Watching a machine do the wrong thing taught me where the work lives.',
  },
  {
    id: 'monash',
    index: 2,
    title: 'The Odd Pairing',
    era: '2023',
    place: 'Monash University',
    entry:
      'Software Development major, Games Development minor. Two desks facing each other. ' +
      'I would choose the same pairing again.',
  },
  {
    id: 'antsa',
    index: 3,
    title: 'The Live Platform',
    era: '2025',
    place: 'ANTSA',
    entry:
      'A live Australian digital mental health platform. I made questionnaire scoring ' +
      'configurable at runtime, and traced a data mismatch that produced no error and no ' +
      'log entry.',
  },
  {
    id: 'engine',
    index: 4,
    title: 'The Engine Room',
    era: 'ongoing',
    place: 'Unity, Unreal, Blender',
    entry:
      'Gameplay systems in C# and C++, and topology optimised for realtime rendering. ' +
      'This half of the degree is why I count frames and bytes in a backend.',
  },
  {
    id: 'desk',
    index: 5,
    title: 'The Desk',
    era: 'now',
    place: 'Melbourne',
    entry:
      'Present tense. Open to graduate and junior software roles in Melbourne. The CV is ' +
      'on the desk and the record player is playing.',
  },
];
