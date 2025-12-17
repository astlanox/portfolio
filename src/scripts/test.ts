import { ClassNames } from "@/constants/classNames";
import { on, once, qs, qsa } from "@/utils/dom";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

const init = () => {
  const articles = qsa(".js-article");

  const modal = qs(".js-modal");

  const modalPanel = qs(".js-modalPanel");

  const backdrop = qs(".js-backdrop");

  if (!modal || !modalPanel || !backdrop) return;

  let activeArticle: Element | null = null;

  let lastFocused: Element | null = null;

  const open = (article: Element) => {
    if (activeArticle) return;
    activeArticle = article;
    lastFocused = document.activeElement;

    const placeholder = document.createElement("div");
    placeholder.style.height = `${(article as HTMLElement).offsetHeight}px`;
    article.after(placeholder);

    modal.classList.add(ClassNames.OPEN);
    modal.setAttribute("aria-hidden", "false");

    gsap.set(backdrop, { opacity: 0 });

    Flip.fit(modalPanel, article);

    const state = Flip.getState(modalPanel);

    modalPanel.prepend(article);

    gsap.set(modalPanel, { clearProps: "all" });

    Flip.from(state, {
      duration: 0.5,
      ease: "power2.inOut",
      onStart: () => {
        gsap.to(backdrop, { opacity: 1, duration: 0.25 });
      },
    });

    article.__placeholder = placeholder;
  };

  const close = () => {
    if (!activeArticle) return;

    const article = activeArticle;

    const placeholder = article.__placeholder;

    const state = Flip.getState(article);

    placeholder.replaceWith(article);

    Flip.from(state, {
      duration: 0.5,
      ease: "power2.inOut",
      onStart: () => {
        gsap.to(backdrop, { opacity: 0, duration: 0.25 });
      },
      onComplete: () => {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      },
    });

    activeArticle = null;
  };

  articles.forEach((article) => {
    on(article, "click", () => open(article));
    // article.addEventListener("keydown", (e) => {
    // if (e.key === "Enter" || e.key === " ") {
    // e.preventDefault();
    // open(article);
    // }
    // });
  });

  on(backdrop, "click", close);
  // document.addEventListener("keydown", (e) => {
  // if (e.key === "Escape") close();
  // });
  // };
};

if (document.readyState === "loading") {
  once(document, "DOMContentLoaded", init);
} else {
  init();
}

on(document, "astro:page-load", init);
