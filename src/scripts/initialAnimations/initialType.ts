import gsap from "gsap";

export type InitialTypeOptions = {
  line1?: string;
  line2From?: string;
  line2To?: string;
  cps?: number; // typing speed
  dps?: number; // deleting speed
  cursor?: string; // cursor char
  delayBetween?: number;
  /** Pause (seconds) after line2From is fully typed, before deleting starts */
  holdAfterLine2From?: number;
};

let cursorStyleInjected = false;

const ensureCursorStyle = () => {
  if (cursorStyleInjected) return;
  cursorStyleInjected = true;

  if (document.getElementById("js-animate-type-cursor-style")) return;

  const style = document.createElement("style");
  style.id = "js-animate-type-cursor-style";
  style.textContent = `
@keyframes jsAnimateCursorBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
.js-animate-cursor { display:inline-block; animation: jsAnimateCursorBlink 1.3s steps(1,end) infinite; }
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
  // Ensure the cursor exists only once in the DOM
  cursorEl.remove();

  el.textContent = text;

  el.append(cursorEl);
};

const setPlainText = (el: HTMLElement, text: string) => {
  el.textContent = text;
};

const clearLine = (el: HTMLElement) => {
  el.textContent = "";
};

const typeTo = (
  el: HTMLElement,
  fullText: string,
  cps: number,
  cursorEl: HTMLSpanElement,
  keepCursor = true,
) => {
  const state = { i: 0 };

  const dur = Math.max(0.1, fullText.length / Math.max(1, cps));

  // Cursor is shown only on the active line
  setLineWithCursor(el, "", cursorEl);

  return gsap.to(state, {
    i: fullText.length,
    duration: dur,
    ease: "none",
    onUpdate: () => {
      const n = Math.max(0, Math.min(fullText.length, Math.floor(state.i)));
      setLineWithCursor(el, fullText.slice(0, n), cursorEl);
    },
    onComplete: () => {
      if (keepCursor) {
        setLineWithCursor(el, fullText, cursorEl);
      } else {
        setPlainText(el, fullText);
      }
    },
  });
};

const deleteToEmpty = (
  el: HTMLElement,
  currentText: string,
  dps: number,
  cursorEl: HTMLSpanElement,
) => {
  const state = { i: currentText.length };

  const dur = Math.max(0.1, currentText.length / Math.max(1, dps));

  // Cursor stays on the active line while deleting
  setLineWithCursor(el, currentText, cursorEl);

  return gsap.to(state, {
    i: 0,
    duration: dur,
    ease: "none",
    onUpdate: () => {
      const n = Math.max(0, Math.min(currentText.length, Math.floor(state.i)));
      setLineWithCursor(el, currentText.slice(0, n), cursorEl);
    },
    onComplete: () => {
      setLineWithCursor(el, "", cursorEl);
    },
  });
};

/**
 * FV用:
 * 1) line1 type
 * 2) line2From type
 * 3) line2From delete
 * 4) line2To type
 */
export const initialType = (
  root: Element | string,
  opts: InitialTypeOptions = {},
) => {
  ensureCursorStyle();

  const roots =
    typeof root === "string"
      ? Array.from(document.querySelectorAll<HTMLElement>(root))
      : root instanceof HTMLElement
        ? [root]
        : [];

  if (!roots.length) return;

  const {
    line1 = "Hi, I am",
    line2From = "Astlanox",
    line2To = "Takayuki",
    cps = 20,
    dps = 28,
    cursor = "<",
    delayBetween = 0.2,
    holdAfterLine2From = 0.45,
  } = opts;

  roots.forEach((r) => {
    const el1 = r.querySelector<HTMLElement>(".js-fv-type-line1");

    const el2 = r.querySelector<HTMLElement>(".js-fv-type-line2");
    if (!el1 || !el2) return;

    // One shared cursor element per root
    const cursorEl = createCursorEl(cursor);

    // Initial: cursor only on line1; line2 is empty (no cursor)
    setLineWithCursor(el1, "", cursorEl);
    clearLine(el2);

    const tl = gsap.timeline();

    // 1行目：タイプ → 完了後カーソル消す（line1はプレーンテキスト固定）
    tl.add(typeTo(el1, line1, cps, cursorEl, false));
    tl.to({}, { duration: delayBetween });

    // カーソルを2行目に移す（ここで初めてline2にカーソルが出る）
    tl.call(() => {
      clearLine(el2);
      setLineWithCursor(el2, "", cursorEl);
    });

    // 2行目：Astlanox タイプ（カーソルあり）
    tl.add(typeTo(el2, line2From, cps, cursorEl, true));
    tl.to({}, { duration: holdAfterLine2From });

    // 2行目：削除（カーソルあり：最終的にカーソルだけ残る）
    tl.add(deleteToEmpty(el2, line2From, dps, cursorEl));
    tl.to({}, { duration: delayBetween * 0.7 });

    // 2行目：Taka H タイプ（カーソルあり）
    tl.add(typeTo(el2, line2To, cps, cursorEl, true));
  });
};
