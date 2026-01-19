import gsap from "gsap";

export type FadeUpOptions = {
  start?: string; // ScrollTrigger start e.g. "top 85%"
  y?: number; // 移動距離
  duration?: number; // アニメーション時間
  stagger?: number; // stagger
  once?: boolean; // 1回だけか
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

  const { y = 24, duration = 0.7, stagger = 0.1 } = opts;

  const master = gsap.timeline();

  roots.forEach((r) => {
    // --- targets ---
    const children = Array.from(
      r.querySelectorAll<HTMLElement>(".js-animateFadeUp"),
    );

    const targets = r.classList.contains("js-animateFadeUp")
      ? [r, ...children]
      : children;

    if (!targets.length) return;

    // 初期状態は即時に適用（scroll 到達前に見えないようにする）
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
