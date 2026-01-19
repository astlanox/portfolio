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
) => {
  const roots =
    typeof root === "string"
      ? Array.from(document.querySelectorAll<HTMLElement>(root))
      : root instanceof HTMLElement
        ? [root]
        : [];

  if (!roots.length) return;

  const { y = 24, duration = 0.7, stagger = 0.1, delay = 0 } = opts;

  roots.forEach((r) => {
    const children = Array.from(
      r.querySelectorAll<HTMLElement>(".js-animateFadeUp"),
    );

    const targets = r.classList.contains("js-animateFadeUp")
      ? [r, ...children]
      : children;

    if (!targets.length) return;

    // 初期状態
    gsap.set(targets, { y, opacity: 0 });

    // 即時再生
    gsap.to(targets, {
      y: 0,
      opacity: 1,
      duration,
      delay,
      stagger,
      ease: "power2.out",
      clearProps: "transform,opacity",
    });
  });
};
