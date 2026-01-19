import gsap from "gsap";

export type InitialFadeInOptions = {
  duration?: number;
  delay?: number;
  stagger?: number;
};

export const initialFadeIn = (
  root: Element | string,
  opts: InitialFadeInOptions = {},
) => {
  const roots =
    typeof root === "string"
      ? Array.from(document.querySelectorAll<HTMLElement>(root))
      : root instanceof HTMLElement
        ? [root]
        : [];

  if (!roots.length) return;

  const { duration = 0.6, delay = 0, stagger = 0.1 } = opts;

  roots.forEach((r) => {
    const children = Array.from(
      r.querySelectorAll<HTMLElement>(".js-animateFadeIn"),
    );

    const targets = r.classList.contains("js-animateFadeIn")
      ? [r, ...children]
      : children;

    if (!targets.length) return;

    // 初期状態
    gsap.set(targets, { opacity: 0 });

    // 即時再生
    gsap.to(targets, {
      opacity: 1,
      duration,
      delay,
      stagger,
      ease: "power1.out",
      clearProps: "opacity",
    });
  });
};
