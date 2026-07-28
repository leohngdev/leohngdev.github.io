/**
 * The shape the terminal island receives as props. Built at build time in
 * index.astro from the same content collection that renders the visual cards,
 * so the two interfaces cannot drift apart.
 */

export interface TerminalProject {
  slug: string;
  title: string;
  tagline: string;
  period: string;
  category: string;
  stack: string[];
  href: string;
}

export interface TerminalSkillGroup {
  label: string;
  items: readonly string[];
}

export interface TerminalRole {
  role: string;
  org: string;
  period: string;
}

export interface TerminalData {
  name: string;
  role: string;
  location: string;
  available: string;
  headline: string;
  about: readonly string[];
  skills: readonly TerminalSkillGroup[];
  projects: readonly TerminalProject[];
  experience: readonly TerminalRole[];
  education: string;
  email: string;
  linkedin: string;
  github: string;
  resume: string;
}
