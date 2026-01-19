import gsap from "gsap";

export type FadeUpOptions = {
  start?: string;
  y?: number;
  duration?: number;
  stagger?: number;
  once?: boolean;
};

export const scrollFadeUp = (
  root: Element | string,
  opts: FadeUpOptions = {},
): gsap.core.Timeline | null => {
  const roots =
    typeof root === "string"
      ? Array.from(document.querySelectorAll<HTMLElement>(root))
      : root instanceof HTMLElement
        ? [root]
        : [];
  if (!roots.length) return null;

  const { y = 24, duration = 0.7, stagger = 0.06 } = opts;

  const master = gsap.timeline();

  roots.forEach((r) => {
    const children = Array.from(
      r.querySelectorAll<HTMLElement>(".js-animateFadeUp"),
    );

    const targets = r.classList.contains("js-animateFadeUp")
      ? [r, ...children]
      : children;

    if (!targets.length) return;

    gsap.set(targets, { y, opacity: 0 });

    const tl = gsap.timeline();

    tl.to(targets, {
      y: 0,
      opacity: 1,
      duration,
      ease: "power2.out",
      stagger,
      overwrite: "auto",
      clearProps: "transform,opacity",
    });

    master.add(tl, 0);
  });

  return master.totalDuration() > 0 ? master : null;
};
