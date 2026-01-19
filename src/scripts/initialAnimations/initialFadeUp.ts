import gsap from "gsap";

export type InitialFadeUpOptions = {
  y?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
};

export const initialFadeUp = (
  root: Element | string,
  opts: InitialFadeUpOptions = {},
): gsap.core.Timeline | null => {
  const roots =
    typeof root === "string"
      ? Array.from(document.querySelectorAll<HTMLElement>(root))
      : root instanceof HTMLElement
        ? [root]
        : [];

  if (!roots.length) return null;

  const { y = 24, duration = 0.7, stagger = 0.06, delay = 0 } = opts;

  const master = gsap.timeline();

  roots.forEach((r) => {
    const children = Array.from(
      r.querySelectorAll<HTMLElement>(".js-animateFadeUp"),
    );

    const targets = r.classList.contains("js-animateFadeUp")
      ? [r, ...children]
      : children;

    if (!targets.length) return;

    const tl = gsap.timeline();

    tl.set(targets, { y, opacity: 0 });

    tl.to(targets, {
      y: 0,
      opacity: 1,
      duration,
      delay,
      stagger,
      ease: "power2.out",
      clearProps: "transform,opacity",
    });

    master.add(tl, 0);
  });

  return master.totalDuration() > 0 ? master : null;
};
