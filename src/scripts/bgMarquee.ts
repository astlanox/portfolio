import { qs } from "@/utils/dom";

const init = () => {
  const targetElement = qs(".js-bgMarquee") as HTMLElement | null;
  if (!targetElement) return;

  let marqueeEl = targetElement.querySelector<HTMLElement>(".bg-marquee");
  if (!marqueeEl) {
    marqueeEl = document.createElement("div");
    marqueeEl.className = "bg-marquee";
    targetElement.appendChild(marqueeEl);
  }

  const words: string[] = [
    "CMS",
    "TYPESCRIPT",
    "REACT",
    "VUE",
    "ASTRO",
    "STRAPI",
    "GRAPHQL",
    "SASS",
    "CSS",
    "PERFORMANCE",
    "ACCESSIBILITY",
    "UI/UX",
  ];

  const speedPxPerSec = 8;

  const minRows = 2;

  const topPaddingPx = 24;

  const bottomPaddingPx = 24;

  const rowGapMultiplier = 1.5;

  const minRowGapPx = 96;

  const createWordsEl = (): HTMLDivElement => {
    const el = document.createElement("div");
    el.className = "bg-marquee-words";

    const frag = document.createDocumentFragment();
    for (const word of words) {
      const wordEl = document.createElement("div");
      wordEl.className = "bg-marquee-word";
      wordEl.textContent = word;
      frag.appendChild(wordEl);
    }

    el.appendChild(frag);
    return el;
  };

  const setTrackDuration = (track: HTMLElement, one: HTMLElement): void => {
    const oneWidth = one.getBoundingClientRect().width || 1;

    track.style.setProperty("--shift", `${oneWidth}px`);

    const dur = oneWidth / speedPxPerSec;
    track.style.setProperty("--dur", `${dur}s`);
  };

  let lastRowCount = 0;
  let rafId = 0;

  const build = (): void => {
    const rect = marqueeEl.getBoundingClientRect();

    const height = rect.height;
    if (!height) return;

    const probeRow = document.createElement("div");
    probeRow.className = "bg-marquee-row";
    probeRow.dataset.dir = "ltr";
    probeRow.style.setProperty("--top", "0px");

    const probeTrack = document.createElement("div");
    probeTrack.className = "bg-marquee-track";

    const probeOne = createWordsEl();

    probeTrack.append(probeOne, probeOne.cloneNode(true));
    probeRow.appendChild(probeTrack);
    marqueeEl.appendChild(probeRow);

    const fontSize = parseFloat(getComputedStyle(probeRow).fontSize) || 64;

    const rowGap = Math.max(fontSize * rowGapMultiplier, minRowGapPx);

    marqueeEl.removeChild(probeRow);

    const usableHeight = Math.max(0, height - topPaddingPx - bottomPaddingPx);

    const rowCount = Math.max(minRows, Math.ceil(usableHeight / rowGap) + 1);

    if (rowCount === lastRowCount && marqueeEl.children.length === rowCount) {
      const tracks =
        marqueeEl.querySelectorAll<HTMLElement>(".bg-marquee-track");

      tracks.forEach((track) => {
        const one = track.firstElementChild as HTMLElement | null;
        if (!one) return;
        setTrackDuration(track, one);
      });

      return;
    }

    lastRowCount = rowCount;
    marqueeEl.innerHTML = "";

    for (let i = 0; i < rowCount; i++) {
      const dir: "ltr" | "rtl" = i % 2 === 0 ? "ltr" : "rtl";

      const row = document.createElement("div");
      row.className = "bg-marquee-row";
      row.dataset.dir = dir;

      const top = topPaddingPx + i * rowGap;
      row.style.setProperty("--top", `${top}px`);

      const track = document.createElement("div");
      track.className = "bg-marquee-track";

      const one = createWordsEl();

      track.append(one, one.cloneNode(true));
      row.appendChild(track);
      marqueeEl.appendChild(row);

      const setDuration = (): void => {
        setTrackDuration(track, one);
      };

      requestAnimationFrame(setDuration);
    }
  };

  const onResize = (): void => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(build);
  };

  requestAnimationFrame(build);
  window.addEventListener("resize", onResize, { passive: true });

  if ("fonts" in document) {
    (document.fonts as FontFaceSet).ready.then(onResize);
  }
};

init();
