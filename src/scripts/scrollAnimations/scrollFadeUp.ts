import { isDev } from "@/utils/getEnv";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type FadeUpOptions = {
  start?: string; // ScrollTrigger start e.g. "top 85%"
  y?: number; // 移動距離
  duration?: number; // アニメーション時間
  stagger?: number; // stagger
  once?: boolean; // 1回だけか
};

const boundRoots = new WeakSet<Element>();

export const scrollFadeUp = (
  root: Element | string,
  opts: FadeUpOptions = {},
) => {
  const roots =
    typeof root === "string"
      ? Array.from(document.querySelectorAll<HTMLElement>(root))
      : root instanceof HTMLElement
        ? [root]
        : [];
  if (!roots.length) return;

  const {
    start = "top 85%",
    y = 24,
    duration = 0.7,
    stagger = 0.1,
    once = true,
  } = opts;

  roots.forEach((r) => {
    if (boundRoots.has(r)) return;
    boundRoots.add(r);

    // --- targets ---
    const children = Array.from(
      r.querySelectorAll<HTMLElement>(".js-animateFadeUp"),
    );

    const targets = r.classList.contains("js-animateFadeUp")
      ? [r, ...children]
      : children;

    if (!targets.length) return;

    // 初期状態（必須）
    gsap.set(targets, { y, opacity: 0 });

    const play = () => {
      gsap.fromTo(
        targets,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          ease: "power2.out",
          stagger,
          overwrite: "auto",
          clearProps: "transform,opacity",
        },
      );
    };

    ScrollTrigger.create({
      trigger: r,
      start,
      once,
      onEnter: play,
      onEnterBack: once ? undefined : play,
      markers: isDev,
    });
  });
};
