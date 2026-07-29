/**
 * One place for what a project category is called and which of the two worlds it
 * belongs to. Previously the label map was copy-pasted between the project card and
 * the case study page, so they could drift.
 *
 * The world is the site's argument made scannable. The thesis is causal — software is
 * the job, engines are the reason it is any good — and a reader who scans the work
 * index sees that column alternate between Software and Engines without reading a
 * single sentence. That is the whole job of this file.
 */

export type Category = 'web' | 'game' | 'threed' | 'hardware';
export type World = 'software' | 'engines';

export const categoryLabel: Record<Category, string> = {
  web: 'Web & Backend',
  game: 'Games',
  threed: '3D & Technical Art',
  hardware: 'Robotics',
};

/**
 * Robotics sits on the software side deliberately: the FRC work was navigation and
 * sensor code, not mechanical design. Grouping it with games because it involves
 * hardware would misrepresent what the work actually was.
 */
export const categoryWorld: Record<Category, World> = {
  web: 'software',
  hardware: 'software',
  game: 'engines',
  threed: 'engines',
};

export const worldLabel: Record<World, string> = {
  software: 'Software',
  engines: 'Engines',
};

export function labelFor(category: string): string {
  return categoryLabel[category as Category] ?? category;
}

export function worldFor(category: string): World {
  return categoryWorld[category as Category] ?? 'software';
}
