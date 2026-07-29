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

  /**
   * The one sentence the site is built around, set at display scale in the hero.
   * It is a causal claim, not a list: the games half explains why the software half
   * is good, which is the thing a four-second scan needs to land. Everything else on
   * the page — including the measured page-weight readout — is evidence for it.
   * Keep it under about 40 characters or it stops working at display size.
   */
  thesis: 'Games taught me what software costs.',

  /** One line of concrete proof directly beneath the thesis. Both halves, fast. */
  heroProof:
    'I rebuilt the scoring engine behind a live Australian mental health platform. Before that, two years of engine and 3D work.',

  headline: 'I build full-stack web apps, and things that run in game engines.',
  /** Meta description and OG copy. Longer than the hero copy on purpose. */
  subheadline:
    'Software Development graduate from Monash with a Games Development minor. Most recently I rebuilt the scoring engine behind a live Australian digital mental health platform.',

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
    "My most recent work was on ANTSA, a live Australian digital mental health platform, where I replaced a hardcoded questionnaire scoring system with a fully configurable one. The work I'm proudest of there wasn't a feature. It was rebuilding a broken multiservice dev environment from scratch, and then finding a silent bug that had been feeding clinicians the wrong answer options.",
    "The engine and 3D side is not a hobby I keep separate. Writing gameplay systems in C# and C++, rigging characters in Maya and optimising topology for realtime rendering taught me to care about frame budgets and memory, and I bring that instinct back to web work.",
  ],

  /** Condensed one-paragraph version used at the top of the CV PDF. */
  cvSummary:
    'IT graduate (Software Development major, Games Development minor) with hands-on experience in full stack web development, agile delivery with real clients, and game/engine programming. Comfortable across the stack, from debugging legacy backends to shipping production features.',

  /** Shown in the hero as a subtle hint that the terminal is real. */
  terminalHint: 'try: whoami',
} as const;

export type SkillGroup = (typeof profile.skills)[number];
