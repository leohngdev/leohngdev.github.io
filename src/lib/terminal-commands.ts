import type { TerminalData } from './terminal-data';

export type Tone = 'default' | 'muted' | 'accent' | 'error' | 'success';

export type Line =
  | { type: 'text'; text: string; tone?: Tone }
  | { type: 'echo'; text: string }
  | { type: 'link'; label: string; href: string; note?: string; external?: boolean }
  | { type: 'pair'; key: string; value: string }
  | { type: 'tags'; label: string; items: readonly string[] }
  | { type: 'blank' };

export interface CommandContext {
  data: TerminalData;
  /** Non-output side effects: clearing the screen, toggling theme, scrolling the page. */
  effect: (effect: Effect) => void;
}

export type Effect = { kind: 'clear' } | { kind: 'theme' } | { kind: 'scroll'; target: string };

export interface Command {
  name: string;
  summary: string;
  usage?: string;
  hidden?: boolean;
  run: (args: string[], ctx: CommandContext) => Line[];
}

const blank = (): Line => ({ type: 'blank' });

function heading(text: string): Line[] {
  return [{ type: 'text', text, tone: 'accent' }];
}

const commands: Command[] = [
  {
    name: 'help',
    summary: 'List everything you can type here',
    run: () => {
      const visible = commands.filter((c) => !c.hidden);
      const width = Math.max(...visible.map((c) => c.name.length));
      return [
        { type: 'text', text: 'Available commands', tone: 'accent' },
        blank(),
        ...visible.map<Line>((c) => ({
          type: 'pair',
          key: c.usage ?? c.name.padEnd(width),
          value: c.summary,
        })),
        blank(),
        {
          type: 'text',
          text: 'Tab completes, up and down arrows walk your history. Everything here is also on the page below.',
          tone: 'muted',
        },
      ];
    },
  },
  {
    name: 'whoami',
    summary: 'The short version',
    run: (_args, { data }) => [
      { type: 'text', text: data.name, tone: 'accent' },
      { type: 'text', text: `${data.role} · ${data.location}` },
      blank(),
      { type: 'text', text: data.headline },
      blank(),
      { type: 'text', text: data.available, tone: 'success' },
      blank(),
      { type: 'text', text: "Try 'projects' next, or 'help' for everything.", tone: 'muted' },
    ],
  },
  {
    name: 'about',
    summary: 'The longer version, in my own words',
    run: (_args, { data }) => [
      ...heading('about'),
      blank(),
      ...data.about.flatMap<Line>((para) => [{ type: 'text', text: para }, blank()]),
    ],
  },
  {
    name: 'skills',
    summary: 'What I work with',
    usage: 'skills [group]',
    run: (args, { data }) => {
      const query = args[0]?.toLowerCase();
      const groups = query
        ? data.skills.filter((g) => g.label.toLowerCase().includes(query))
        : data.skills;

      if (!groups.length) {
        return [
          { type: 'text', text: `No skill group matching "${args[0]}".`, tone: 'error' },
          {
            type: 'text',
            text: `Groups: ${data.skills.map((g) => g.label).join(', ')}`,
            tone: 'muted',
          },
        ];
      }

      return [
        ...heading('skills'),
        blank(),
        ...groups.flatMap<Line>((group) => [
          { type: 'tags', label: group.label, items: group.items },
          blank(),
        ]),
      ];
    },
  },
  {
    name: 'projects',
    summary: 'Selected work, newest first',
    run: (_args, { data }) => [
      ...heading('projects'),
      blank(),
      ...data.projects.flatMap<Line>((project) => [
        { type: 'pair', key: project.slug, value: project.tagline },
      ]),
      blank(),
      {
        type: 'text',
        text: "Run 'open <name>' to read a case study, e.g. open antsa-scoring-engine",
        tone: 'muted',
      },
    ],
  },
  {
    name: 'open',
    summary: 'Open a case study',
    usage: 'open <project>',
    run: (args, { data }) => {
      if (!args.length) {
        return [
          { type: 'text', text: 'Usage: open <project>', tone: 'error' },
          {
            type: 'text',
            text: `Known projects: ${data.projects.map((p) => p.slug).join(', ')}`,
            tone: 'muted',
          },
        ];
      }

      const query = args.join(' ').toLowerCase();
      const match =
        data.projects.find((p) => p.slug === query) ??
        data.projects.find((p) => p.slug.includes(query) || p.title.toLowerCase().includes(query));

      if (!match) {
        return [
          { type: 'text', text: `No project matching "${args.join(' ')}".`, tone: 'error' },
          {
            type: 'text',
            text: `Known projects: ${data.projects.map((p) => p.slug).join(', ')}`,
            tone: 'muted',
          },
        ];
      }

      return [
        { type: 'text', text: match.title, tone: 'accent' },
        { type: 'text', text: match.tagline },
        blank(),
        { type: 'pair', key: 'period', value: match.period },
        { type: 'tags', label: 'stack', items: match.stack },
        blank(),
        { type: 'link', label: `Read the ${match.title} case study`, href: match.href },
      ];
    },
  },
  {
    name: 'experience',
    summary: 'Where I have worked and studied',
    run: (_args, { data }) => [
      ...heading('experience'),
      blank(),
      ...data.experience.flatMap<Line>((role) => [
        { type: 'text', text: role.role, tone: 'accent' },
        { type: 'text', text: `${role.org} · ${role.period}`, tone: 'muted' },
        blank(),
      ]),
    ],
  },
  {
    name: 'education',
    summary: 'Degree and coursework',
    run: (_args, { data }) => [
      ...heading('education'),
      blank(),
      { type: 'text', text: data.education },
    ],
  },
  {
    name: 'contact',
    summary: 'How to reach me',
    run: (_args, { data }) => [
      ...heading('contact'),
      blank(),
      { type: 'link', label: data.email, href: `mailto:${data.email}`, note: 'email' },
      { type: 'link', label: 'linkedin.com/in/leo-hnguyen', href: data.linkedin, note: 'linkedin', external: true },
      { type: 'link', label: `github.com/${data.github.split('/').pop()}`, href: data.github, note: 'github', external: true },
      blank(),
      { type: 'text', text: data.available, tone: 'success' },
    ],
  },
  {
    name: 'resume',
    summary: 'Download my CV as a PDF',
    run: (_args, { data }) => [
      { type: 'text', text: 'Fetching CV...', tone: 'muted' },
      { type: 'link', label: 'leo-nguyen-cv.pdf', href: data.resume, note: 'download' },
    ],
  },
  {
    /**
     * The `scroll` effect existed in the type but nothing emitted it. Now that the
     * terminal is a palette rather than a widget parked in the hero, jumping to a
     * section is the thing you actually want from it.
     */
    name: 'go',
    summary: 'Jump to a section of the page',
    usage: 'go <section>',
    run: (args, { effect }) => {
      const sections = ['work', 'timeline', 'about', 'skills', 'experience', 'contact'];
      const target = args[0]?.toLowerCase();

      if (!target || !sections.includes(target)) {
        return [
          { type: 'text', text: target ? `No section called "${target}".` : 'Usage: go <section>', tone: 'error' },
          { type: 'text', text: `Sections: ${sections.join(', ')}`, tone: 'muted' },
        ];
      }

      effect({ kind: 'scroll', target });
      return [{ type: 'text', text: `Jumping to ${target}.`, tone: 'muted' }];
    },
  },
  {
    name: 'theme',
    summary: 'Flip between light and dark',
    run: (_args, { effect }) => {
      effect({ kind: 'theme' });
      return [{ type: 'text', text: 'Theme toggled.', tone: 'muted' }];
    },
  },
  {
    name: 'clear',
    summary: 'Clear the screen',
    run: (_args, { effect }) => {
      effect({ kind: 'clear' });
      return [];
    },
  },

  /* ---- Easter eggs. Hidden from help so the listed surface stays professional. ---- */
  {
    name: 'ls',
    summary: 'List sections',
    hidden: true,
    run: () => [
      {
        type: 'text',
        text: 'about  skills  projects  experience  education  contact  resume',
      },
      { type: 'text', text: "This is a portfolio, not a filesystem. Try 'help'.", tone: 'muted' },
    ],
  },
  {
    name: 'sudo',
    summary: 'Escalate privileges',
    hidden: true,
    run: (args) => {
      if (args.join(' ').includes('hire')) {
        return [
          { type: 'text', text: 'Permission granted.', tone: 'success' },
          { type: 'text', text: "That was the correct command. Run 'contact'.", tone: 'muted' },
        ];
      }
      return [
        { type: 'text', text: 'leo is not in the sudoers file. This incident has been reported.', tone: 'error' },
        { type: 'text', text: '(It has not been reported.)', tone: 'muted' },
      ];
    },
  },
  {
    name: 'vim',
    summary: 'Open vim',
    hidden: true,
    run: () => [
      { type: 'text', text: 'Opening vim...' },
      { type: 'text', text: 'Just kidding. Nobody deserves to be trapped in here.', tone: 'muted' },
    ],
  },
  {
    name: 'unreal',
    summary: 'Compile shaders',
    hidden: true,
    run: () => [
      { type: 'text', text: 'Compiling shaders (1 of 8,472)...' },
      { type: 'text', text: 'Anyone who has opened Unreal knows this feeling.', tone: 'muted' },
    ],
  },
  {
    name: 'coffee',
    summary: 'Brew coffee',
    hidden: true,
    run: () => [{ type: 'text', text: '418 I am a teapot.', tone: 'muted' }],
  },
  {
    name: 'exit',
    summary: 'Leave',
    hidden: true,
    run: () => [
      { type: 'text', text: "There is no exit, but there is a scroll bar. Keep reading.", tone: 'muted' },
    ],
  },
];

export const commandNames = commands.filter((c) => !c.hidden).map((c) => c.name);
export const allCommandNames = commands.map((c) => c.name);

export function runCommand(input: string, ctx: CommandContext): Line[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const [name, ...args] = trimmed.split(/\s+/);
  const command = commands.find((c) => c.name === name.toLowerCase());

  if (!command) {
    return [
      { type: 'text', text: `command not found: ${name}`, tone: 'error' },
      { type: 'text', text: "Type 'help' to see what does work.", tone: 'muted' },
    ];
  }

  return command.run(args, ctx);
}

/** Completes a bare command name, or a project slug for `open`. */
export function complete(input: string, projects: readonly { slug: string }[]): string | null {
  const parts = input.split(/\s+/);

  if (parts.length > 1 && parts[0].toLowerCase() === 'open') {
    const partial = parts.slice(1).join(' ').toLowerCase();
    const matches = projects.filter((p) => p.slug.startsWith(partial));
    if (matches.length === 1) return `open ${matches[0].slug}`;
    return null;
  }

  if (parts.length > 1) return null;

  const matches = allCommandNames.filter((name) => name.startsWith(input.toLowerCase()));
  if (matches.length === 1) return matches[0];

  if (matches.length > 1) {
    // Extend to the longest common prefix, the way a real shell does.
    let prefix = matches[0];
    for (const match of matches.slice(1)) {
      while (!match.startsWith(prefix)) prefix = prefix.slice(0, -1);
    }
    return prefix.length > input.length ? prefix : null;
  }

  return null;
}
