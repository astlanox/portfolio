import gsap from "gsap";

export type InitialFadeDownOptions = {
  y?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
};

export const initialFadeDown = (
  root: Element | string,
  opts: InitialFadeDownOptions = {},
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
      r.querySelectorAll<HTMLElement>(".js-animateFadeDown"),
    );

    const targets = r.classList.contains("js-animateFadeDown")
      ? [r, ...children]
      : children;

    if (!targets.length) return;

    const tl = gsap.timeline();

    // 初期状態（下にずらして非表示）
    tl.set(targets, { y: -y, opacity: 0 });

    // 即時再生
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
