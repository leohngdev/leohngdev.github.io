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

  /**
   * One line of concrete proof directly beneath the thesis. Both halves, fast.
   * Deliberately does NOT restate the ANTSA tagline: that sentence already appears
   * on the lead row of the work index one screen further down, and reading the same
   * sentence twice in the first two screens makes the page feel thinner than it is.
   */
  heroProof:
    'Software Development major, Games Development minor at Monash. Most recently on a live Australian mental health platform.',

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

  /**
   * Deliberately grouped the same way as the CV so the two read as one story.
   *
   * `depth` is what the skills section renders as a bar, and it exists because a flat
   * chip grid gave Unreal Engine and Substance Painter the same visual weight as
   * Python. Claiming less where less is true is the whole point: an interviewer who
   * probes the weakest item should find it already labelled as the weakest item.
   *
   *   shipped — production code, against real sign-off
   *   built   — real things made with it, outside a classroom exercise
   *   studied — coursework and genuine use, not professional depth
   */
  skills: [
    {
      id: 'languages',
      label: 'Languages',
      depth: 'shipped',
      note: 'Comfortable picking up whatever the codebase already uses.',
      items: ['Python', 'Java', 'C++', 'C#', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'PHP', 'SQL'],
    },
    {
      id: 'web',
      label: 'Web & Backend',
      depth: 'shipped',
      note: 'Most of my paid work sits here, including the ANTSA scoring engine.',
      items: ['Node.js', 'Nest.js', 'React', 'React Native', 'CakePHP', 'PostgreSQL', 'MySQL', 'REST APIs'],
    },
    {
      id: 'tools',
      label: 'Ways of Working',
      depth: 'shipped',
      note: 'Shipped against a client who could reject it, rather than a marking rubric.',
      items: ['Git & GitHub', 'Agile / Scrum', 'UAT', 'Code Review', 'CI/CD', 'Debugging legacy systems'],
    },
    {
      id: 'game',
      label: 'Game & 3D',
      depth: 'studied',
      note: 'The other half of my degree, and the reason I care what a frame costs. Coursework, no shipped titles.',
      items: [
        'Unity',
        'Maya',
        'Unreal Engine',
        'Substance Painter',
        'AR/VR',
        'Character Rigging & Animation',
      ],
    },
  ],

  /** First person, written to be read out loud. Rendered in the About section. */
  about: [
    "I'm a software developer in Melbourne. I finished a Bachelor of IT at Monash at the end of 2025, majoring in Software Development with a minor in Games Development. It is an odd pairing and I would choose it again.",
    'Before university I spent two years on an FRC robotics team in Ho Chi Minh City, writing navigation and sensor code in Python and C++. Two years of watching a machine do the wrong thing taught me where the work lives: in the gap between what you think a system does and what it does.',
    "My most recent work was ANTSA, a live Australian digital mental health platform, where I replaced a hardcoded questionnaire scoring system with a configurable one. The two things I am proudest of never shipped as features. I rebuilt a broken multiservice dev environment from scratch, then found a bug that had been feeding clinicians the wrong answer options.",
    'The engine and 3D half feeds the rest. Writing gameplay systems in C# and C++ and optimising topology for realtime rendering made me count frames and bytes. I still count them when I write a backend.',
  ],

  /**
   * Condensed one-paragraph version used at the top of the CV PDF. Keeps the keyword
   * density an applicant tracking system scans for, without the filler.
   */
  cvSummary:
    'IT graduate, Software Development major and Games Development minor. I build full stack web applications, deliver against real client sign-off in an agile team, and program game engines in C++ and C#. I debug legacy backends and ship production features.',

  /** Shown in the hero as a subtle hint that the terminal is real. */
  terminalHint: 'try: whoami',
} as const;

export type SkillGroup = (typeof profile.skills)[number];
