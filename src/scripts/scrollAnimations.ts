import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Options = {
  y?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  scrub?: boolean;
  once?: boolean;
};

export function revealUp(
  rootSelector: string,
  itemSelector: string,
  opts: Options = {},
) {
  const {
    y = 24,
    duration = 0.7,
    stagger = 0.06,
    start = "top 85%",
    scrub = false,
    once = true,
  } = opts;

  const roots = document.querySelectorAll(rootSelector);

  const cleanups: Array<() => void> = [];

  roots.forEach((root) => {
    const ctx = gsap.context(() => {
      const targets = root.querySelectorAll(itemSelector);
      if (!targets.length) return;

      gsap.fromTo(
        targets,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          ease: "power2.out",
          stagger,
          scrollTrigger: {
            trigger: root,
            start,
            toggleActions: once
              ? "play none none none"
              : scrub
                ? undefined
                : "play none none reverse",
            scrub: scrub || undefined,
            once,
          },
        },
      );
    }, root);

    cleanups.push(() => ctx.revert());
  });

  return () => cleanups.forEach((fn) => fn());
}
