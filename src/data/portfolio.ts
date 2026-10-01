/** Editorial context for the physical collection. Project facts live in content/projects. */
export interface PortfolioChapter {
  key: string;
  short: string;
  label: string;
  title: string;
  lede: string;
  annotation: string;
  notesTitle: string;
  notes: string[];
  diagram?: string[];
  takeaway?: { title: string; text: string };
}

export const portfolio: Record<string, PortfolioChapter> = {
  yard: {
    key: "yard",
    short: "Yard",
    label: "Solo product",
    title: "Yard",
    lede: "Neighbourhood connections, on your terms.",
    annotation: "open the tape",
    notesTitle: "Inside the sleeve",
    notes: [
      "The mobile app and web client share a domain package. The data layer enforces the boundaries around public posts, private posts, and mutual connection.",
      "The map and bloom are the expressive surface. The privacy decisions underneath are part of what makes the product work.",
    ],
    takeaway: {
      title: "The decision that matters",
      text: "Private posts don’t create crossings. Matching doesn’t read live location. Neither identity is revealed until both people opt in.",
    },
  },
  "antsa-scoring-engine": {
    key: "antsa",
    short: "ANTSA",
    label: "Production software",
    title: "ANTSA",
    lede: "Scoring that clinicians can configure.",
    annotation: "the rules live in the data.",
    notesTitle: "Open the case notes",
    notes: [
      "Assessment rules could be changed through data: categories, severity thresholds, weights, and reverse-scoring flags. I carried the scoring into clinician dashboards and PDF exports.",
      "This was a five-person Monash industry placement on an existing production platform, with two client-signed iterations.",
    ],
    diagram: ["Configure", "Score", "Report"],
    takeaway: {
      title: "Beyond the feature",
      text: "I stood up the multiservice stack locally, then traced a data mismatch that produced no error and no log entry.",
    },
  },
  "engine-prototypes": {
    key: "games",
    short: "Games",
    label: "University studies",
    title: "Game-engine prototypes",
    lede: "Build it. Play it. Adjust it.",
    annotation: "the next try teaches you something.",
    notesTitle: "Notes from the prototypes",
    notes: [
      "A playable version makes movement, feedback, and state changes something you can inspect and improve. Performance constraints also change how often code runs and what it allocates.",
      "These are university prototypes from the Games Development minor. Coursework, no shipped titles.",
    ],
    diagram: ["Prototype", "Playtest", "Revise"],
  },
  "character-pipeline": {
    key: "character",
    short: "3D",
    label: "Character & technical art",
    title: "3D character pipeline",
    lede: "Think about the next pair of hands.",
    annotation: "made to move.",
    notesTitle: "Unfold the pipeline notes",
    notes: [
      "The pipeline joins modelling, texturing, rigging, and animation. A rig is also an interface for the person who needs to animate it, so naming and control design matter alongside the model itself.",
      "The wireframe on this page is an illustrative project object. The case study describes my university character work.",
    ],
    diagram: ["Model", "Texture", "Rig"],
  },
  "fullstack-web-apps": {
    key: "web",
    short: "Web",
    label: "Web & databases",
    title: "Full-stack web apps",
    lede: "Follow it all the way through.",
    annotation: "every layer has a job.",
    notesTitle: "Open the layers",
    notes: [
      "Requirements and the relational model help define the behaviour of the application. Working across Node.js and CakePHP exposed the ideas shared by different server ecosystems.",
      "These projects combine university web and database coursework.",
    ],
  },
  "frc-robotics": {
    key: "robotics",
    short: "Robotics",
    label: "Competition robotics",
    title: "FRC robotics",
    lede: "Code meets the real world.",
    annotation: "the world gets a vote, too.",
    notesTitle: "Notes from the workshop",
    notes: [
      "Robot behaviour depends on software, sensor readings, and mechanical systems working together. This team experience connected programming with physical behaviour and competition deadlines.",
      "The wheel is an illustrative project object, rather than a documented component of the competition robot.",
    ],
    diagram: ["Sense", "Decide", "Move"],
  },
};
