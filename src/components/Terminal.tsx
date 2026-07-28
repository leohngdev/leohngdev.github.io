import { useCallback, useEffect, useRef, useState } from 'react';
import { complete, runCommand, type Effect, type Line } from '../lib/terminal-commands';
import type { TerminalData } from '../lib/terminal-data';

interface Props {
  data: TerminalData;
}

interface Row {
  id: number;
  line: Line;
}

const PROMPT = 'leo@portfolio:~$';
const MAX_ROWS = 400;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function Terminal({ data }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = useCallback((lines: Line[]) => {
    if (!lines.length) return;
    setRows((current) => {
      const appended = lines.map((line) => ({ id: nextId.current++, line }));
      const combined = [...current, ...appended];
      return combined.length > MAX_ROWS ? combined.slice(-MAX_ROWS) : combined;
    });
  }, []);

  const handleEffect = useCallback((effect: Effect) => {
    if (effect.kind === 'clear') {
      setRows([]);
      return;
    }

    if (effect.kind === 'theme') {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      } catch {
        /* Not worth failing a command over. */
      }
      return;
    }

    if (effect.kind === 'scroll') {
      document.querySelector(effect.target)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  /* Boot banner. Staggered for texture, instant when motion is reduced. */
  useEffect(() => {
    const banner: Line[] = [
      { type: 'text', text: `${data.name} — portfolio`, tone: 'accent' },
      { type: 'text', text: `${data.role} · ${data.location}`, tone: 'muted' },
      { type: 'blank' },
      { type: 'text', text: "Type 'help' for commands, or 'whoami' to start.", tone: 'muted' },
    ];

    if (prefersReducedMotion()) {
      push(banner);
      return;
    }

    const timers = banner.map((line, index) =>
      window.setTimeout(() => push([line]), 220 * index),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [data.name, data.role, data.location, push]);

  /* Keep the newest output in view without stealing the whole page's scroll. */
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [rows]);

  const submit = useCallback(
    (raw: string) => {
      const value = raw.trim();
      push([{ type: 'echo', text: raw }]);
      setInput('');
      setHistoryIndex(null);
      setHint(null);

      if (!value) return;

      setHistory((current) => (current[current.length - 1] === value ? current : [...current, value]));
      const output = runCommand(value, { data, effect: handleEffect });
      push(output);
    },
    [data, handleEffect, push],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit(input);
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const completed = complete(input, data.projects);
      if (completed) {
        setInput(completed);
        setHint(null);
      } else if (input.trim()) {
        setHint('No single match. Keep typing, or run help.');
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!history.length) return;
      const index = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setInput(history[index]);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === null) return;
      const index = historyIndex + 1;
      if (index >= history.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(index);
        setInput(history[index]);
      }
      return;
    }

    if (event.key === 'l' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      setRows([]);
      return;
    }

    if (event.key === 'c' && event.ctrlKey) {
      event.preventDefault();
      push([{ type: 'echo', text: `${input}^C` }]);
      setInput('');
      setHistoryIndex(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[var(--border-strong)]" />
          <span className="size-2.5 rounded-full bg-[var(--border-strong)]" />
          <span className="size-2.5 rounded-full bg-[var(--color-accent-400)]" />
        </span>
        <p className="ml-1 font-mono text-xs text-[var(--text-muted)]">leo@portfolio — zsh</p>
      </div>

      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="h-[20rem] overflow-y-auto px-4 py-3 font-mono text-[0.8125rem] leading-relaxed sm:h-[24rem]"
      >
        <div role="log" aria-live="polite" aria-label="Terminal output">
          {rows.map((row) => (
            <LineView key={row.id} line={row.line} />
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(input);
          }}
          className="mt-1 flex items-baseline gap-2"
        >
          <label htmlFor="terminal-input" className="shrink-0 text-[var(--accent)]">
            {PROMPT}
          </label>
          <span className="sr-only">
            Interactive terminal. Type a command such as help, or read the same information in the
            sections below this one.
          </span>
          <input
            id="terminal-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            className="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] caret-[var(--accent)] outline-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="terminal-help"
            enterKeyHint="go"
          />
        </form>

        {hint && <p className="mt-1 text-[var(--text-muted)]">{hint}</p>}
      </div>

      <p id="terminal-help" className="sr-only">
        Optional interactive terminal. Available commands are help, whoami, about, skills, projects,
        open, experience, education, contact, resume, theme and clear. All of this content also
        appears as ordinary text on this page.
      </p>
    </div>
  );
}

function LineView({ line }: { line: Line }) {
  if (line.type === 'blank') return <div className="h-3" aria-hidden="true" />;

  if (line.type === 'echo') {
    return (
      <div className="flex gap-2">
        <span className="shrink-0 text-[var(--accent)]">{PROMPT}</span>
        <span className="break-words text-[var(--text-primary)]">{line.text}</span>
      </div>
    );
  }

  if (line.type === 'link') {
    return (
      <div className="flex flex-wrap items-baseline gap-2">
        {line.note && <span className="text-[var(--text-muted)]">{line.note}</span>}
        <a
          href={line.href}
          className="link-underline text-[var(--accent)]"
          {...(line.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {line.label}
        </a>
      </div>
    );
  }

  if (line.type === 'pair') {
    return (
      <div className="flex flex-col gap-x-4 sm:flex-row">
        <span className="shrink-0 text-[var(--accent)] sm:w-48">{line.key}</span>
        <span className="text-[var(--text-secondary)]">{line.value}</span>
      </div>
    );
  }

  if (line.type === 'tags') {
    return (
      <div className="flex flex-col gap-x-4 sm:flex-row">
        <span className="shrink-0 text-[var(--accent)] sm:w-48">{line.label}</span>
        <span className="text-[var(--text-secondary)]">{line.items.join('  ·  ')}</span>
      </div>
    );
  }

  const tones: Record<string, string> = {
    default: 'text-[var(--text-primary)]',
    muted: 'text-[var(--text-muted)]',
    accent: 'text-[var(--accent)]',
    error: 'text-red-500 dark:text-red-400',
    success: 'text-emerald-700 dark:text-emerald-400',
  };

  return (
    <p className={`break-words ${tones[line.tone ?? 'default']}`}>{line.text}</p>
  );
}
