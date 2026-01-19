let lockedScrollY = 0;
let isScrollLocked = false;

export const lockScroll = () => {
  if (isScrollLocked) return;
  isScrollLocked = true;

  lockedScrollY = window.scrollY || 0;

  document.body.style.position = "fixed";
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
};

export const unlockScroll = () => {
  if (!isScrollLocked) return;
  isScrollLocked = false;

  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, lockedScrollY);
};
