import gsap from "gsap";

export type InitialFadeInOptions = {
  duration?: number;
  delay?: number;
  stagger?: number;
};

export const initialFadeIn = (
  root: Element | string,
  opts: InitialFadeInOptions = {},
): gsap.core.Timeline | null => {
  const roots =
    typeof root === "string"
      ? Array.from(document.querySelectorAll<HTMLElement>(root))
      : root instanceof HTMLElement
        ? [root]
        : [];

  if (!roots.length) return null;

  const { duration = 0.6, delay = 0, stagger = 0.06 } = opts;

  const master = gsap.timeline();

  roots.forEach((r) => {
    const children = Array.from(
      r.querySelectorAll<HTMLElement>(".js-animateFadeIn"),
    );

    const targets = r.classList.contains("js-animateFadeIn")
      ? [r, ...children]
      : children;

    if (!targets.length) return;

    const tl = gsap.timeline();

    tl.set(targets, { opacity: 0 });

    tl.to(targets, {
      opacity: 1,
      duration,
      delay,
      stagger,
      ease: "power1.out",
      clearProps: "opacity",
    });

    master.add(tl, 0);
  });

  return master.totalDuration() > 0 ? master : null;
};
