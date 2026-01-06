/* eslint-disable @typescript-eslint/no-explicit-any */

export const qs = <T extends Element>(
  sel: string,
  root: ParentNode = document,
) => root.querySelector<T>(sel);

export const qsa = <T extends Element>(
  sel: string,
  root: ParentNode = document,
) => Array.from(root.querySelectorAll<T>(sel));

export const on = <
  T extends Element | Document | Window,
  K extends keyof (T extends Element
    ? HTMLElementEventMap
    : T extends Document
      ? DocumentEventMap
      : WindowEventMap),
>(
  el: T | null,
  type: K,
  handler: (
    this: T,
    ev: (T extends Element
      ? HTMLElementEventMap
      : T extends Document
        ? DocumentEventMap
        : WindowEventMap)[K],
  ) => any,
  options?: boolean | AddEventListenerOptions,
): void => {
  if (el)
    el.addEventListener(type as string, handler as EventListener, options);
};

export const once = <
  T extends Element | Document | Window,
  K extends keyof (T extends Element
    ? HTMLElementEventMap
    : T extends Document
      ? DocumentEventMap
      : WindowEventMap),
>(
  el: T | null,
  type: K,
  handler: (
    this: T,
    ev: (T extends Element
      ? HTMLElementEventMap
      : T extends Document
        ? DocumentEventMap
        : WindowEventMap)[K],
  ) => any,
  options?: boolean | AddEventListenerOptions,
): void => {
  if (!el) return;

  const opts =
    typeof options === "boolean"
      ? { capture: options, once: true }
      : { ...(options || {}), once: true };
  el.addEventListener(type as string, handler as EventListener, opts);
};
