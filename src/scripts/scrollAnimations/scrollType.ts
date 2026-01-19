import { isDev } from "@/utils/getEnv";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* -------------------- Type (scroll-triggered) -------------------- */

type TypeOptions = {
  /** ScrollTrigger start (viewport-based), evaluated against each root */
  start?: string;
  /** Characters per second */
  cps?: number;
  /** Whether to run only once per element */
  once?: boolean;
  /** Cursor character (blinks) */
  cursor?: string;
  /** @deprecated Prefer passing the root (Element or selector) as the first argument to scrollType(). */
  rootSelector?: string;
  /** Target selector inside root (js-only) */
  targetSelector?: string;
};

const _typed = new WeakSet<Element>();

const _typeOriginal = new WeakMap<Element, string>();

let _cursorStyleInjected = false;

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const ensureCursorStyle = () => {
  if (_cursorStyleInjected) return;
  _cursorStyleInjected = true;

  // avoid duplicates (HMR etc.)
  if (document.getElementById("js-animateType-cursor-style")) return;

  const style = document.createElement("style");
  style.id = "js-animateType-cursor-style";
  style.textContent = `
@keyframes jsAnimateCursorBlink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.js-animate-cursor {
  display: inline-block;
  animation: jsAnimateCursorBlink 0.9s steps(1, end) infinite;
}
`;
  document.head.appendChild(style);
};

const renderWithCursorEnd = (typed: string, cursorChar: string) => {
  const c = escapeHtml(cursorChar);
  if (!typed) return `<span class="js-animate-cursor">${c}</span>`;
  return `${escapeHtml(typed)} <span class="js-animate-cursor">${c}</span>`;
};

export const scrollType = (
  rootOrOpts: Element | string | TypeOptions = {},
  maybeOpts: TypeOptions = {},
) => {
  const opts: TypeOptions =
    typeof rootOrOpts === "string" || rootOrOpts instanceof Element
      ? maybeOpts
      : rootOrOpts;

  const {
    start = "top 85%",
    cps = 20,
    once = true,
    cursor = "<",
    rootSelector = ".js-animate-root",
    targetSelector = ".js-animateType",
  } = opts;

  ensureCursorStyle();

  const roots: Element[] =
    typeof rootOrOpts === "string"
      ? Array.from(document.querySelectorAll(rootOrOpts))
      : rootOrOpts instanceof Element
        ? [rootOrOpts]
        : gsap.utils.toArray<Element>(rootSelector);
  console.log(roots);

  const triggers: ScrollTrigger[] = [];

  const typeInto = (el: Element) => {
    if (once && _typed.has(el)) return;
    _typed.add(el);

    const originalRaw = _typeOriginal.get(el) ?? el.textContent ?? "";

    const original = originalRaw.trim();

    if (!original) {
      el.innerHTML = renderWithCursorEnd("", cursor);
      return;
    }

    // cursor only at start
    el.innerHTML = renderWithCursorEnd("", cursor);

    const state = { i: 0 };

    const dur = Math.max(0.1, original.length / Math.max(1, cps));

    gsap.to(state, {
      i: original.length,
      duration: dur,
      ease: "none",
      onUpdate: () => {
        const n = Math.max(0, Math.min(original.length, Math.floor(state.i)));

        const typed = original.slice(0, n);
        el.innerHTML = renderWithCursorEnd(typed, cursor);
      },
      onComplete: () => {
        el.innerHTML = renderWithCursorEnd(original, cursor);
      },
    });
  };

  // Root-based triggers
  roots.forEach((root) => {
    const children = Array.from(root.querySelectorAll<Element>(targetSelector));

    const targetClass = targetSelector.replace(/^\./, "");

    const targets = root.classList.contains(targetClass)
      ? [root, ...children]
      : children;
    if (!targets.length) return;

    targets.forEach((t) => {
      if (!_typeOriginal.has(t)) _typeOriginal.set(t, t.textContent ?? "");

      const original = (_typeOriginal.get(t) ?? "").trim();
      if (original) t.innerHTML = renderWithCursorEnd("", cursor);
    });

    const st = ScrollTrigger.create({
      trigger: root,
      start,
      once,
      onEnter: () => targets.forEach((el) => typeInto(el)),
      onEnterBack: once
        ? undefined
        : () => targets.forEach((el) => typeInto(el)),
      markers: isDev,
    });

    triggers.push(st);
  });

  return () => {
    triggers.forEach((st) => st.kill());
  };
};
