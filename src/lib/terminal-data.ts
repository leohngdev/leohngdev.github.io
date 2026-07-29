/**
 * The shape the command palette receives. Built at build time from the same content
 * collections that render the visual sections, so the two interfaces cannot drift.
 *
 * The builder lives here rather than in a page because the palette is mounted in the
 * layout and therefore exists on every page, including case studies.
 */
import { getCollection } from 'astro:content';
import { profile } from '../data/profile';

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

/** Reads the collections once and shapes them for the palette. */
export async function buildTerminalData(): Promise<TerminalData> {
  const projects = (await getCollection('projects'))
    .filter((project) => project.data.featured)
    .sort((a, b) => a.data.order - b.data.order);

  const roles = (await getCollection('experience')).sort((a, b) => a.data.order - b.data.order);

  return {
    name: profile.displayName,
    role: profile.role,
    location: profile.location,
    available: profile.available,
    headline: profile.headline,
    about: profile.about,
    skills: profile.skills.map((group) => ({ label: group.label, items: group.items })),
    projects: projects.map((project) => ({
      slug: project.id,
      title: project.data.title,
      tagline: project.data.tagline,
      period: project.data.period,
      category: project.data.category,
      stack: [...project.data.stack],
      href: `/work/${project.id}/`,
    })),
    experience: roles.map((entry) => ({
      role: entry.data.role,
      org: entry.data.org,
      period: entry.data.period,
    })),
    education: `${profile.education.degree}, ${profile.education.institution} (${profile.education.period}). Major in ${profile.education.major}, minor in ${profile.education.minor}.`,
    email: profile.email,
    linkedin: profile.linkedin,
    github: profile.github,
    resume: profile.resume,
  };
}
