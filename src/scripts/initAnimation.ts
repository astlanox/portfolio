import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { lockScroll, unlockScroll } from "@/scripts/scrollLock";

gsap.registerPlugin(ScrollTrigger);

type BuildContext = {
  rootEl: HTMLElement;
  master: gsap.core.Timeline;
};

type InitAnimationOptions = {
  mode: "intro" | "scroll";

  /** 基準 root */
  root: string | HTMLElement;

  /** scroll 時のみ */
  start?: string;

  /** intro 時のみ */
  lockScroll?: boolean;

  /** すでに開始位置より後ろならアニメしない */
  skipIfPassed?: boolean;

  /** timeline を組む */
  buildTimeline: (ctx: BuildContext) => void;
};

const resolveRoots = (root: string | HTMLElement): HTMLElement[] => {
  if (typeof root === "string") {
    return Array.from(document.querySelectorAll<HTMLElement>(root));
  }
  return root instanceof HTMLElement ? [root] : [];
};

export const initAnimation = ({
  mode,
  root,
  start = "top 80%",
  lockScroll: shouldLockScroll = false,
  skipIfPassed = true,
  buildTimeline,
}: InitAnimationOptions) => {
  const roots = resolveRoots(root);
  if (!roots.length) return;

  roots.forEach((rootEl) => {
    const master = gsap.timeline({ paused: true });
    buildTimeline({ rootEl, master });

    // 何も積まれてない
    if (master.totalDuration() === 0) return;

    /** =========================
     *  SKIP 判定
     * =======================*/
    if (skipIfPassed) {
      if (mode === "intro") {
        if (window.scrollY > 0) {
          master.progress(1).pause();
          return;
        }
      }

      if (mode === "scroll") {
        const rect = rootEl.getBoundingClientRect();
        if (rect.top < 0) {
          master.progress(1).pause();
          return;
        }
      }
    }

    /** =========================
     *  INTRO
     * =======================*/
    if (mode === "intro") {
      if (shouldLockScroll && window.scrollY === 0) {
        lockScroll();
      }

      master.play(0);

      if (shouldLockScroll) {
        master.eventCallback("onComplete", () => {
          unlockScroll();
        });
      }

      return;
    }

    /** =========================
     *  SCROLL
     * =======================*/
    ScrollTrigger.create({
      trigger: rootEl,
      start,
      once: true,
      onEnter: () => {
        master.play(0);
      },
    });
  });
};
