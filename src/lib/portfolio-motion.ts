/** Native scroll is the playhead. No autoplay, wheel interception or animation loop. */
const ledgeTimes = [2.55, 2.9, 3.12, 3.28, 3.44, 3.62, 3.82, 4.12];
const kickTimes = [
  1.25, 1.4, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.9, 2.0, 2.2,
];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
let dispose: (() => void) | undefined;

function initPortfolio() {
  dispose?.();
  const root = document.documentElement;
  const page = document.querySelector<HTMLElement>("[data-portfolio]");
  const controller = new AbortController();
  const { signal } = controller;
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const controls = [
    ...document.querySelectorAll<HTMLInputElement>("[data-reduce-motion]"),
  ];
  let preference: string | null = null;
  try {
    preference = localStorage.getItem("portfolio-motion");
  } catch {
    /* Use system preference. */
  }
  let reduced = preference ? preference === "reduce" : media.matches;
  let frame = 0;
  let dirty = true;
  let viewport = innerHeight;
  const scenes = [
    ...(page?.querySelectorAll<HTMLElement>("[data-motion]") ?? []),
  ].map((node) => ({
    node,
    kind: node.dataset.motion,
    top: 0,
    height: 1,
    artTop: 0,
    artHeight: 1,
    sticky: false,
    inset: 0,
    travel: 1,
    stage: node.querySelector<HTMLElement>(".scene-stage"),
    paper: node.querySelector<HTMLElement>(".film-paper, .coding-paper"),
    sprite: node.querySelector<HTMLElement>(".sprite"),
    details: node.querySelector<HTMLDetailsElement>("details"),
    objects: [...node.querySelectorAll<HTMLElement>(".object")],
    layers: [...node.querySelectorAll<HTMLElement>(".layers i")],
  }));

  function measure() {
    dirty = false;
    viewport = innerHeight;
    const y = scrollY;
    scenes.forEach((scene) => {
      const bounds = scene.node.getBoundingClientRect();
      scene.top = bounds.top + y;
      scene.height = bounds.height;
      const art = scene.paper?.getBoundingClientRect() ?? bounds;
      scene.artTop = art.top + y;
      scene.artHeight = art.height;
      const style = scene.stage ? getComputedStyle(scene.stage) : null;
      scene.sticky = style?.position === "sticky";
      scene.inset = parseFloat(style?.top ?? "0") || 0;
      scene.travel = Math.max(
        1,
        scene.height - (scene.stage?.offsetHeight ?? 0),
      );
    });
  }

  function paintSprite(
    scene: (typeof scenes)[number],
    pose: number,
    columns: number,
    rows: number,
  ) {
    if (!scene.sprite || scene.sprite.dataset.pose === String(pose)) return;
    scene.sprite.dataset.pose = String(pose);
    scene.sprite.style.setProperty(
      "--sprite-x",
      `${(-(pose % columns) * 100) / columns}%`,
    );
    scene.sprite.style.setProperty(
      "--sprite-y",
      `${(-Math.floor(pose / columns) * 100) / rows}%`,
    );
  }

  function poseAt(times: number[], progress: number) {
    const time =
      times[0] + clamp(progress) * (times[times.length - 1] - times[0]);
    let index = 0;
    while (index < times.length - 1 && times[index + 1] <= time) index++;
    return index;
  }

  function render() {
    frame = 0;
    if (dirty) measure();
    const y = scrollY;
    scenes.forEach((scene) => {
      const p = reduced
        ? 0.72
        : clamp(
            (y + viewport * 0.55 - scene.top + scene.height * 0.08) /
              (scene.height * 1.16),
          );
      const set = (name: string, value: number, unit = "") =>
        scene.node.style.setProperty(name, `${value.toFixed(3)}${unit}`);
      set("--p", p);
      set("--reel", reduced ? 0 : p * 440, "deg");
      set("--mesh", reduced ? 0 : (p - 0.5) * 24, "deg");
      set("--wheel", reduced ? 0 : p * 100, "deg");
      set("--photo-lift", reduced ? 0 : (1 - p) * 17, "px");
      set("--prop-turn", reduced ? -3 : 5 - p * 9, "deg");
      if (scene.kind === "project") {
        set(
          "--lid",
          scene.details?.open
            ? -116
            : reduced
              ? -55
              : -clamp((p - 0.08) / 0.55) * 95,
          "deg",
        );
        set(
          "--cover",
          scene.details?.open ? -53 : reduced ? -25 : -p * 36,
          "deg",
        );
        scene.layers.forEach((layer, i) =>
          layer.style.setProperty(
            "--layer-shift",
            `${reduced ? 0 : (1 - p) * (i - 1) * 22}px`,
          ),
        );
      }
      scene.objects.forEach((object, i) =>
        object.style.setProperty(
          "--lift",
          `${reduced ? 0 : -p * (7 + i * 2)}px`,
        ),
      );
      if (scene.kind === "skate" || scene.kind === "kickflip") {
        const kick = scene.kind === "kickflip";
        const progress = scene.sticky
          ? clamp((y - scene.top + scene.inset) / scene.travel)
          : clamp(
              (y + viewport * 0.72 - scene.artTop) /
                (scene.artHeight + viewport * 0.25),
            );
        const pose = reduced
          ? kick
            ? 6
            : 4
          : poseAt(kick ? kickTimes : ledgeTimes, (progress - 0.12) / 0.75);
        paintSprite(scene, pose, 4, kick ? 3 : 2);
        // The sheet settles before the trick begins; the skater is never translated or mirrored.
        const fold = reduced ? 1 : clamp(progress / 0.12);
        scene.paper?.style.setProperty("--fold", `${(1 - fold) * 30}%`);
        set("--p", reduced ? 1 : progress);
      } else if (scene.kind === "coding") {
        const progress = clamp(
          (y + viewport * 0.65 - scene.artTop) /
            (scene.artHeight + viewport * 0.3),
        );
        paintSprite(
          scene,
          reduced ? 0 : Math.min(3, Math.floor(progress * 4)),
          2,
          2,
        );
      }
    });
  }

  function queue() {
    if (!frame && !signal.aborted) frame = requestAnimationFrame(render);
  }
  function invalidate() {
    dirty = true;
    queue();
  }
  function syncMotion() {
    root.dataset.motion = reduced ? "reduce" : "full";
    controls.forEach((input) => {
      input.checked = reduced;
    });
    invalidate();
  }
  controls.forEach((input) => {
    input
      .closest<HTMLElement>("[data-motion-control]")
      ?.removeAttribute("hidden");
    input.addEventListener(
      "change",
      () => {
        reduced = input.checked;
        preference = reduced ? "reduce" : "full";
        try {
          localStorage.setItem("portfolio-motion", preference);
        } catch {
          /* Session choice still applies. */
        }
        syncMotion();
      },
      { signal },
    );
  });
  media.addEventListener(
    "change",
    () => {
      if (!preference) {
        reduced = media.matches;
        syncMotion();
      }
    },
    { signal },
  );

  const details = [
    ...(page?.querySelectorAll<HTMLDetailsElement>(".extras") ?? []),
  ];
  const noteLinks = [
    ...(page?.querySelectorAll<HTMLAnchorElement>("[data-notes]") ?? []),
  ];
  function syncDetails() {
    noteLinks.forEach((link) => {
      const panel = document.getElementById(
        `${link.dataset.notes}-notes`,
      ) as HTMLDetailsElement | null;
      link.setAttribute("aria-expanded", String(Boolean(panel?.open)));
    });
    invalidate();
  }
  const plainClick = (event: MouseEvent) =>
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey;
  noteLinks.forEach((link) => {
    link.setAttribute("role", "button");
    link.addEventListener(
      "keydown",
      (event) => {
        if (event.key === " ") {
          event.preventDefault();
          link.click();
        }
      },
      { signal },
    );
    link.addEventListener(
      "click",
      (event) => {
        if (!plainClick(event)) return;
        const panel = document.getElementById(
          `${link.dataset.notes}-notes`,
        ) as HTMLDetailsElement | null;
        if (!panel) return;
        event.preventDefault();
        panel.open = !panel.open;
        syncDetails();
        if (panel.open) {
          panel.querySelector("summary")?.focus({ preventScroll: true });
          panel.scrollIntoView({ block: "nearest", behavior: "instant" });
        }
      },
      { signal },
    );
  });
  page?.querySelectorAll<HTMLAnchorElement>("[data-project]").forEach((link) =>
    link.addEventListener(
      "click",
      (event) => {
        if (!plainClick(event)) return;
        const panel = document.getElementById(
          `${link.dataset.project}-notes`,
        ) as HTMLDetailsElement | null;
        if (panel) panel.open = true;
        // Keep native hash/history behaviour, including the no-JavaScript fallback.
        syncDetails();
      },
      { signal },
    ),
  );
  details.forEach((panel) =>
    panel.addEventListener("toggle", syncDetails, { signal }),
  );
  function revealHash() {
    const panel = details.find((item) => `#${item.id}` === location.hash);
    if (panel) panel.open = true;
    syncDetails();
  }
  window.addEventListener("hashchange", revealHash, { signal });
  window.addEventListener("scroll", queue, { passive: true, signal });
  window.addEventListener("resize", invalidate, { passive: true, signal });
  const observer = new ResizeObserver(invalidate);
  if (page) observer.observe(page);
  page
    ?.querySelectorAll("img")
    .forEach((img) => img.addEventListener("load", invalidate, { signal }));
  document.fonts.ready.then(() => {
    if (!signal.aborted) invalidate();
  });
  syncMotion();
  revealHash();
  dispose = () => {
    controller.abort();
    observer.disconnect();
    cancelAnimationFrame(frame);
  };
}

document.addEventListener("astro:page-load", initPortfolio);
document.addEventListener("astro:before-swap", () => {
  dispose?.();
  dispose = undefined;
});
