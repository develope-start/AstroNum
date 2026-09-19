export function scrollToAscendantSection() {
  if (typeof window === "undefined") return;

  // Dispatch custom event to expand the section if it is managed by React state
  window.dispatchEvent(new CustomEvent("scroll-to-ascendant"));

  setTimeout(() => {
    const el = document.getElementById("ascendant-section");
    if (el) {
      if (el instanceof HTMLDetailsElement && !el.open) {
        el.open = true;
      }
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 30);
}
