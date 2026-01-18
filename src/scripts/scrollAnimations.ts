import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type FadeUpOptions = {
  /** ScrollTrigger start e.g. "top 85%" */
  start?: string;
  /** move distance (px) */
  y?: number;
  duration?: number;
  once?: boolean;
};

export const scrollFadeUp = (opts: FadeUpOptions = {}) => {
  const { start = "top 85%", y = 24, duration = 0.7, once = true } = opts;

  const roots = gsap.utils.toArray<HTMLElement>(".js-animate-root");

  const triggers: ScrollTrigger[] = [];

  const playFadeUp = (els: ArrayLike<Element>) => {
    const list = Array.from(els);
    if (list.length === 0) return;

    gsap.fromTo(
      list,
      { y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        ease: "power2.out",
        stagger: 0.1,
        overwrite: "auto",
      },
    );
  };

  // If there are no roots, fall back to direct targets (simple page use)
  if (!roots.length) {
    const targets = gsap.utils.toArray<HTMLElement>(".js-animate-fade-up");
    if (!targets.length) return () => {};

    ScrollTrigger.batch(targets, {
      start, // viewport-based start line (customizable via opts)
      onEnter: (batch) => playFadeUp(batch),
      onEnterBack: once ? undefined : (batch) => playFadeUp(batch),
      once,
    });

    return () => {
      // Kill only the triggers created by the batch call (best-effort)
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }
  // Root-based triggers: animation timing is controlled by each root's position.
  roots.forEach((root) => {
    // Elements to animate are descendants marked with .js-animate-fade-up
    const children = Array.from(
      root.querySelectorAll<HTMLElement>(".js-animate-fade-up"),
    );

    // Root itself may also be the element to animate
    const targets = root.classList.contains("js-animate-fade-up")
      ? [root, ...children]
      : children;

    if (!targets.length) return;

    gsap.set(targets, { y, opacity: 0 });

    const st = ScrollTrigger.create({
      trigger: root, // start timing is based on the root position
      start, // still viewport-based, but evaluated against the root
      onEnter: () => playFadeUp(targets),
      onEnterBack: once ? undefined : () => playFadeUp(targets),
      once,
      markers: true,
    });

    triggers.push(st);
  });

  // Cleanup: kill only what we created here
  return () => {
    triggers.forEach((st) => st.kill());
  };
};
