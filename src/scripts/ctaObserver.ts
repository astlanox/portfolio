import { ClassNames } from "@/constants/classNames";
import { qs, qsa } from "@/utils/dom";

const cta = qs(".js-cta");

const targets = qsa(".js-ctaTarget");
console.log(cta, targets);

if (cta && targets.length > 0) {
  const observer = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      const shouldHide = entries.some(
        (entry: IntersectionObserverEntry) => entry.isIntersecting,
      );

      cta.classList.toggle(ClassNames.SHOW, !shouldHide);
    },
    {
      root: null,
      threshold: 0,
      rootMargin: "0px",
    },
  );

  targets.forEach((target) => {
    observer.observe(target);
  });
}
