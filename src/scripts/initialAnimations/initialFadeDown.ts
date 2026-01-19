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
) => {
  const roots =
    typeof root === "string"
      ? Array.from(document.querySelectorAll<HTMLElement>(root))
      : root instanceof HTMLElement
        ? [root]
        : [];

  if (!roots.length) return;

  const {
    y = 24, // 下方向にずらす距離
    duration = 0.7,
    stagger = 0.1,
    delay = 0,
  } = opts;

  roots.forEach((r) => {
    const children = Array.from(
      r.querySelectorAll<HTMLElement>(".js-animateFadeDown"),
    );

    const targets = r.classList.contains("js-animateFadeDown")
      ? [r, ...children]
      : children;

    if (!targets.length) return;

    // 初期状態（下にずらして非表示）
    gsap.set(targets, { y: -y, opacity: 0 });

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
