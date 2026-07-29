/**
 * Single source of truth for identity, contact and skills.
 * Both the rendered HTML and the terminal island read from here, so the two
 * interfaces can never disagree about what Leo does.
 *
 * Deliberately contains no phone number. The CV PDF and the site are both built
 * from this file, so a number added here would be published in both; the CV
 * generator hard-fails if a phone number ever reaches the PDF.
 */
// Extension is explicit because the CV generator imports this file with bare
// node, which does not resolve extensionless relative specifiers.
import { GITHUB_HANDLE, GITHUB_PROFILE_URL } from './site.ts';

export const profile = {
  name: 'Nguyen Le Hoang',
  preferredName: 'Leo',
  displayName: 'Leo Nguyen',
  // Used in the <title> and structured data.
  fullDisplayName: 'Nguyen Le Hoang (Leo)',
  role: 'Software Developer',
  location: 'Melbourne, VIC',
  locationDetail: 'Melbourne, Australia',
  available: 'Open to graduate and junior software roles in Melbourne',

  headline: 'I build full-stack web apps, with a games and 3D background behind them.',
  subheadline:
    'Software Development graduate from Monash with a Games Development minor. Currently building Yard, a privacy-first social app, after five months delivering features on a live Australian digital mental health platform.',

  email: 'hnguyen.leo04@gmail.com',
  linkedin: 'https://linkedin.com/in/leo-hnguyen/',
  github: GITHUB_PROFILE_URL,
  githubHandle: GITHUB_HANDLE,
  resume: '/leo-nguyen-cv.pdf',

  education: {
    degree: 'Bachelor of Information Technology',
    institution: 'Monash University',
    period: 'Feb 2023 - Dec 2025',
    major: 'Software Development',
    minor: 'Games Development',
    coursework: [
      'Object-Oriented Programming',
      'Database Systems',
      'Web Development',
      'Game Design',
      '3D Animation',
    ],
  },

  /** Deliberately grouped the same way as the CV so the two read as one story. */
  skills: [
    {
      id: 'languages',
      label: 'Languages',
      note: 'Comfortable picking up whatever the codebase already uses.',
      items: ['Python', 'Java', 'C++', 'C#', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'PHP', 'SQL'],
    },
    {
      id: 'web',
      label: 'Web & Backend',
      note: 'Where most of my professional work has happened.',
      items: ['Node.js', 'Nest.js', 'React', 'React Native', 'CakePHP', 'PostgreSQL', 'MySQL', 'REST APIs'],
    },
    {
      id: 'game',
      label: 'Game & 3D',
      note: 'The other half of my degree, and the reason I like performance problems.',
      items: [
        'Unreal Engine',
        'Unity',
        'Maya',
        'Substance Painter',
        'AR/VR',
        'Character Rigging & Animation',
      ],
    },
    {
      id: 'tools',
      label: 'Ways of Working',
      note: 'Shipped against real client sign-off, not just assignment deadlines.',
      items: ['Git & GitHub', 'Agile / Scrum', 'UAT', 'Code Review', 'CI/CD', 'Debugging legacy systems'],
    },
  ],

  /** First person, written to be read out loud. Rendered in the About section. */
  about: [
    "I'm a software developer in Melbourne. I finished a Bachelor of IT at Monash at the end of 2025, majoring in Software Development with a minor in Games Development, which is a slightly unusual pairing that turned out to be the most useful thing I did.",
    'Before university I spent two years on an FRC robotics team in Ho Chi Minh City writing navigation and sensor code in Python and C++. That was where I learned that software is mostly about the gap between what you think the system is doing and what it is actually doing.',
    "My first professional work was a five month placement at ANTSA, a live Australian digital mental health platform, in a team of five moving questionnaire configuration out of code and into data. The work I'm proudest of there wasn't a feature. It was rebuilding the local multiservice development environment so the system ran end to end, and then tracking down a defect that produced no error and no log entry at all.",
    "Since finishing my degree I've been building Yard, a privacy-first social app where instead of an endless feed you tend a small bounded plot. The interesting problems have been the ones underneath: enforcing privacy as Postgres row level security rather than as checks in application code, and building a matching system that falls back to a deterministic signal when it can't reach an embedding provider, so the feature degrades instead of breaking.",
    "The games and 3D half of my degree isn't something I keep separate. Composing environments in Unity, sequencing cinematics, building a soundscape in FMOD and modelling to realtime polygon budgets in Maya all taught me to work inside a fixed budget and think about what earns space in it, and that instinct comes back with me to web work.",
  ],

  /** Condensed one-paragraph version used at the top of the CV PDF. */
  cvSummary:
    'IT graduate (Software Development major, Games Development minor) with hands-on experience in full stack web development, agile delivery with real clients, and game environment and audio design. Comfortable across the stack, from debugging legacy backends to shipping production features.',

  /** Shown in the hero as a subtle hint that the terminal is real. */
  terminalHint: 'try: whoami',
} as const;

export type SkillGroup = (typeof profile.skills)[number];
