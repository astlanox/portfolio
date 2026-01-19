import gsap from "gsap";

/* -------------------- Type (scroll-triggered) -------------------- */

type TypeOptions = {
  /** Characters per second */
  cps?: number;
  /** Cursor character (blinks) */
  cursor?: string;
  /** Target selector inside root (js-only) */
  targetSelector?: string;
};

const _typeOriginal = new WeakMap<Element, string>();

const _cursorEl = new WeakMap<Element, HTMLSpanElement>();

let _cursorStyleInjected = false;

const ensureCursorStyle = () => {
  if (_cursorStyleInjected) return;
  _cursorStyleInjected = true;

  // avoid duplicates (HMR etc.)
  if (document.getElementById("js-animate-type-cursor-style")) return;

  const style = document.createElement("style");
  style.id = "js-animate-type-cursor-style";
  style.textContent = `
@keyframes jsAnimateCursorBlink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.js-animate-cursor {
  display: inline-block;
  animation: jsAnimateCursorBlink 1.3s steps(1, end) infinite;
}
`;
  document.head.appendChild(style);
};

const createCursorEl = (cursorChar: string) => {
  const span = document.createElement("span");
  span.className = "js-animate-cursor";
  span.textContent = cursorChar;
  return span;
};

const setLineWithCursor = (
  el: HTMLElement,
  text: string,
  cursorEl: HTMLSpanElement,
) => {
  // Ensure the cursor exists only once in the DOM (per target)
  cursorEl.remove();

  el.textContent = text;
  el.append(cursorEl);
};

export const scrollType = (
  rootOrOpts: Element | string | TypeOptions = {},
  maybeOpts: TypeOptions = {},
): gsap.core.Timeline | null => {
  const opts: TypeOptions =
    typeof rootOrOpts === "string" || rootOrOpts instanceof Element
      ? maybeOpts
      : rootOrOpts;

  const { cps = 20, cursor = "<", targetSelector = ".js-animateType" } = opts;

  ensureCursorStyle();

  const roots: Element[] =
    typeof rootOrOpts === "string"
      ? Array.from(document.querySelectorAll(rootOrOpts))
      : rootOrOpts instanceof Element
        ? [rootOrOpts]
        : gsap.utils.toArray<Element>(".js-animate-root");

  const master = gsap.timeline();

  const typeInto = (el: Element): gsap.core.Tween | null => {
    const originalRaw = _typeOriginal.get(el) ?? el.textContent ?? "";

    const original = originalRaw.trim();

    const cursorEl = _cursorEl.get(el) ?? createCursorEl(cursor);
    if (!_cursorEl.has(el)) _cursorEl.set(el, cursorEl);

    if (!original) {
      setLineWithCursor(el as HTMLElement, "", cursorEl);
      return null;
    }

    // cursor only at start
    setLineWithCursor(el as HTMLElement, "", cursorEl);

    const state = { i: 0 };

    const dur = Math.max(0.1, original.length / Math.max(1, cps));

    return gsap.to(state, {
      i: original.length,
      duration: dur,
      ease: "none",
      onUpdate: () => {
        const n = Math.max(0, Math.min(original.length, Math.floor(state.i)));

        const typed = original.slice(0, n);
        setLineWithCursor(el as HTMLElement, typed, cursorEl);
      },
      onComplete: () => {
        setLineWithCursor(el as HTMLElement, original, cursorEl);
      },
    });
  };

  roots.forEach((root) => {
    const children = Array.from(root.querySelectorAll<Element>(targetSelector));

    const targetClass = targetSelector.replace(/^\./, "");

    const targets = root.classList.contains(targetClass)
      ? [root, ...children]
      : children;
    if (!targets.length) return;

    targets.forEach((t) => {
      if (!_typeOriginal.has(t)) _typeOriginal.set(t, t.textContent ?? "");

      const cursorEl = _cursorEl.get(t) ?? createCursorEl(cursor);
      if (!_cursorEl.has(t)) _cursorEl.set(t, cursorEl);

      const original = (_typeOriginal.get(t) ?? "").trim();
      if (original) setLineWithCursor(t as HTMLElement, "", cursorEl);
    });

    const tl = gsap.timeline();

    targets.forEach((t) => {
      const tween = typeInto(t);
      if (tween) tl.add(tween);
    });

    master.add(tl, 0);
  });

  return master.totalDuration() > 0 ? master : null;
};
