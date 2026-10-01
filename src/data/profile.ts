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

  /** The collection brings the person and the work together. */
  thesis: 'A few things that make me, me.',
  heroProof: 'Monash IT graduate in Melbourne. Software, skating, and a curiosity about how things work.',
  headline: 'I build software, learn tricks, and get curious about how things work.',
  subheadline:
    'Leo Nguyen, software developer and Monash IT graduate in Melbourne. Explore Yard, production software at ANTSA, games, 3D, web apps and robotics.',

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
      note: 'Production work at ANTSA and university web projects.',
      items: ['Node.js', 'Nest.js', 'React', 'React Native', 'CakePHP', 'PostgreSQL', 'MySQL', 'REST APIs'],
    },
    {
      id: 'product',
      label: 'Product Development',
      depth: 'built',
      note: 'Independent product work on Yard. See the project for its dated beta status.',
      items: ['Expo', 'Next.js', 'Supabase'],
    },
    {
      id: 'tools',
      label: 'Ways of Working',
      depth: 'shipped',
      note: 'Agile team delivery, client sign-off, and tracing problems across services.',
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
    'I’m Leo, a software developer in Melbourne and a Monash IT graduate. I studied Software Development with a Games Development minor.',
    'My work spans a solo product, production software, game systems, 3D, web apps, and robotics. I’m finding my direction by making things and paying attention to what each one teaches me.',
    'Games draw me in through their worlds, atmosphere, puzzles, and creative possibilities. Skating gives me room to experiment and find my own way. There are so many techniques behind one trick, and everyone puts them together differently.',
  ],

  /**
   * Condensed one-paragraph version used at the top of the CV PDF. Keeps the keyword
   * density an applicant tracking system scans for, without the filler.
   */
  cvSummary:
    'Monash IT graduate. Software Development major, Games Development minor. Solo developer of Yard; built configurable scoring at ANTSA in an agile team, with 100% UAT across two client-signed iterations.',

  /** Shown in the hero as a subtle hint that the terminal is real. */
  terminalHint: 'try: whoami',
} as const;

export type SkillGroup = (typeof profile.skills)[number];
